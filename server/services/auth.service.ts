import argon2 from "argon2";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.ts";
import { RegisterDTO, LoginDTO } from "../types/auth.ts";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh_secret";

export class AuthService {
  static async register(data: RegisterDTO & { referralCode?: string }) {
    const passwordHash = await argon2.hash(data.password);
    
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        profile: {
          create: {
            displayName: data.username, // Default to username
            region: "IR",
            membershipType: "NONE",
          }
        }
      },
      include: {
        profile: true
      }
    });

    if (data.referralCode) {
      try {
        const inviter = await prisma.user.findUnique({
          where: { username: data.referralCode }
        });

        if (inviter && inviter.id !== user.id) {
          await prisma.referral.create({
            data: {
              inviterId: inviter.id,
              inviteeId: user.id,
              referralCode: data.referralCode
            }
          });

          // Give 3 days Plus to inviter
          const now = new Date();
          const plusDays = 3 * 24 * 60 * 60 * 1000;
          const expiresAt = new Date(now.getTime() + plusDays);

          // Update Inviter
          const inviterSub = await prisma.subscription.findFirst({
            where: { userId: inviter.id }
          });

          if (inviterSub) {
             const newExpiresAt = inviterSub.expiresAt > now ? new Date(inviterSub.expiresAt.getTime() + plusDays) : expiresAt;
             await prisma.subscription.update({
               where: { id: inviterSub.id },
               data: { expiresAt: newExpiresAt }
             });
          } else {
            await prisma.subscription.create({
              data: {
                userId: inviter.id,
                type: "PLUS",
                expiresAt: expiresAt
              }
            });
            await prisma.profile.update({
              where: { userId: inviter.id },
              data: { membershipType: "PLUS" }
            }).catch(() => {});
          }

          // Update Invitee (The new user)
          await prisma.subscription.create({
            data: {
              userId: user.id,
              type: "PLUS",
              expiresAt: expiresAt
            }
          });
          await prisma.profile.update({
            where: { userId: user.id },
            data: { membershipType: "PLUS" }
          }).catch(() => {});
        }
      } catch (err) {
        console.error("Referral processing failed", err);
      }
    }

    return user;
  }

  static async login(data: LoginDTO) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { profile: true }
    });

    if (!user) throw new Error("Invalid credentials");

    const valid = await argon2.verify(user.passwordHash, data.password);
    if (!valid) throw new Error("Invalid credentials");

    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  static generateAccessToken(userId: string) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "15m" });
  }

  static generateRefreshToken(userId: string) {
    return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
  }

  static verifyAccessToken(token: string) {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  }

  static verifyRefreshToken(token: string) {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as { userId: string };
  }
}
