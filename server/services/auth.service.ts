import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import prisma from "../utils/prisma.ts";
import { RegisterDTO, LoginDTO } from "../types/auth.ts";
import { EmailService } from "./email.service.ts";
import { BaleService } from "./bale.service.ts";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh_secret";

export class AuthService {
  static async register(data: RegisterDTO & { referralCode?: string }) {
    const passwordHash = await argon2.hash(data.password);
    const verificationToken = uuidv4();
    
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        verificationToken,
        profile: {
          create: {
            displayName: data.username,
            region: "IR",
            membershipType: "NONE",
          }
        }
      },
      include: {
        profile: true
      }
    });

    console.log(`[BALE] Verification link: ble.ir/loxxbot?start=${verificationToken}`);
    // EmailService.sendVerificationEmail is now removed as per user request to use Bale instead
    
    if (data.referralCode) {
      // ... existing referral logic
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

    if (user.twoFactorEnabled) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

      await prisma.user.update({
        where: { id: user.id },
        data: { otpCode, otpExpires }
      });

      console.log(`[BALE/EMAIL] 2FA Code: ${otpCode}`);
      if (user.baleId) {
        await BaleService.sendOTPViaBot(user.baleId, otpCode);
      } else {
        // Fallback or skip if not linked
        await EmailService.sendOTP(user.email, otpCode);
      }
      return { status: "2fa_required", userId: user.id };
    }

    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    return { status: "success", user, accessToken, refreshToken };
  }

  static async sendVerificationEmail(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    if (user.isVerified) throw new Error("ایمیل شما قبلاً تایید شده است");

    const verificationToken = uuidv4();
    await prisma.user.update({
      where: { id: userId },
      data: { verificationToken }
    });

    console.log(`[BALE] Verification link: ble.ir/loxxbot?start=${verificationToken}`);
    return true;
  }

  static async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token }
    });

    if (!user) throw new Error("توکن نامعتبر است");

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null }
    });

    return true;
  }

  static async verify2FA(userId: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user || user.otpCode !== code || !user.otpExpires || new Date() > user.otpExpires) {
      throw new Error("کد تایید نامعتبر یا منقضی شده است");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { otpCode: null, otpExpires: null }
    });

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

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) throw new Error("کاربری با این ایمیل یافت نشد");

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: code, otpExpires: expires }
    });

    console.log(`[BALE/EMAIL] Security code: ${code}`);
    if (user.baleId) {
      await BaleService.sendOTPViaBot(user.baleId, code);
    } else {
      await EmailService.sendOTP(email, code);
    }
    return true;
  }

  static async resetPassword(email: string, code: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { email }
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
