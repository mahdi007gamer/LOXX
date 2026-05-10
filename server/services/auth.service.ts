import argon2 from "argon2";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.ts";
import { RegisterDTO, LoginDTO } from "../types/auth.ts";
import { SmsService } from "./sms.service.ts";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh_secret";

export class AuthService {
  static async register(data: RegisterDTO & { referralCode?: string }) {
    const passwordHash = await argon2.hash(data.password);
    
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        phoneNumber: data.phoneNumber ? data.phoneNumber.replace(/\s+/g, '') : null,
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

    if (user.phoneNumber) {
      await this.sendOtp(user.id);
    }

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
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phoneNumber: data.email } // Support phone as "email" field in login
        ]
      },
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

  static async sendOtp(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.phoneNumber) throw new Error("شماره همراه یافت نشد");

    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await prisma.user.update({
      where: { id: userId },
      data: { otpCode: code, otpExpires: expires }
    });

    await SmsService.sendOtp(user.phoneNumber, code);
    return true;
  }

  static async verifyOtp(userId: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.otpCode || !user.otpExpires) throw new Error("کد تایید منقضی شده یا نامعتبر است");

    if (new Date() > user.otpExpires) throw new Error("کد تایید منقضی شده است");
    if (user.otpCode !== code) throw new Error("کد تایید اشتباه است");

    await prisma.user.update({
      where: { id: userId },
      data: { phoneVerified: true, otpCode: null, otpExpires: null }
    });

    return true;
  }

  static async forgotPassword(phoneOrEmail: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: phoneOrEmail },
          { phoneNumber: phoneOrEmail }
        ]
      }
    });

    if (!user) throw new Error("کاربری با این مشخصات یافت نشد");
    if (!user.phoneNumber) throw new Error("شماره همراه برای این کاربر ثبت نشده است");

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: code, otpExpires: expires }
    });

    await SmsService.sendOtp(user.phoneNumber, code);
    return true;
  }

  static async resetPassword(phoneOrEmail: string, code: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: phoneOrEmail },
          { phoneNumber: phoneOrEmail }
        ]
      }
    });

    if (!user || user.otpCode !== code || !user.otpExpires || new Date() > user.otpExpires) {
      throw new Error("کد تایید نامعتبر یا منقضی شده است");
    }

    const passwordHash = await argon2.hash(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, otpCode: null, otpExpires: null }
    });

    return true;
  }
}
