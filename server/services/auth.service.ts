import argon2 from "argon2";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.ts";
import { RegisterDTO, LoginDTO } from "../types/auth.ts";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh_secret";

export class AuthService {
  static async register(data: RegisterDTO) {
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
