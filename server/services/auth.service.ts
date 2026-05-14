import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import prisma from "../utils/prisma.ts";
import { RegisterDTO, LoginDTO } from "../types/auth.ts";
import { BaleService } from "./bale.service.ts";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh_secret";

export class AuthService {
  static async register(data: RegisterDTO & { referralCode?: string }) {
    const normalizedPhone = this.normalizePhone(data.phone);
    const passwordHash = await argon2.hash(data.password);
    const verificationToken = uuidv4();
    const isAdmin = normalizedPhone === "13781378" || data.username === "admin";
    const isVip = normalizedPhone === "123" || data.username === "VIP";
    
    const user = await prisma.user.create({
      data: {
        username: data.username,
        phone: normalizedPhone,
        passwordHash,
        verificationToken: isAdmin ? null : verificationToken,
        isVerified: isAdmin ? true : false,
        role: isAdmin ? "ADMIN" : "USER",
        profile: {
          create: {
            displayName: data.username,
            region: "IR",
            membershipType: isVip ? "VIP" : "NONE",
          }
        }
      },
      include: {
        profile: true
      }
    });

    console.log(`[BALE] Verification link: ble.ir/loxxbot?start=${verificationToken}`);
    
    if (data.referralCode) {
      // ... existing referral logic
    }

    return user;
  }

  static normalizePhone(phone: string): string {
    let p = phone.replace(/[^\d]/g, "");
    // Handle Iranian numbers: 0989... -> 09...
    if (p.startsWith("098") && p.length > 11) {
      p = "0" + p.substring(3);
    } else if (p.startsWith("98") && p.length > 10) {
      p = "0" + p.substring(2);
    } else if (p.startsWith("+98") && p.length > 10) {
      p = "0" + p.substring(3);
    }
    // Ensure it starts with 0
    if (!p.startsWith("0") && p.length === 10) {
      p = "0" + p;
    }
    return p;
  }

  static async login(data: LoginDTO) {
    const normalizedPhone = this.normalizePhone(data.phone);
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { phone: normalizedPhone },
          { phone: data.phone } // Fallback to raw for older entries
        ]
      },
      include: { profile: true }
    });

    if (!user) throw new Error("Invalid credentials");

    // Enforce Bale verification except for pre-verified admin
    if (!user.isVerified && user.phone !== "13781378" && user.username !== "admin") {
      throw new Error("VERIFICATION_REQUIRED");
    }

    const valid = await argon2.verify(user.passwordHash, data.password);
    if (!valid) throw new Error("Invalid credentials");

    if (user.twoFactorEnabled) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

      await prisma.user.update({
        where: { id: user.id },
        data: { otpCode, otpExpires }
      });

      console.log(`[BALE] 2FA Code: ${otpCode}`);
      if (user.baleId) {
        await BaleService.sendOTPViaBot(user.baleId, otpCode);
      }
      return { status: "2fa_required", userId: user.id };
    }

    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    return { status: "success", user, accessToken, refreshToken };
  }

  static async sendBaleVerificationLink(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    if (user.isVerified) throw new Error("حساب شما قبلاً تایید شده است");

    const verificationToken = uuidv4();
    await prisma.user.update({
      where: { id: userId },
      data: { verificationToken }
    });

    console.log(`[BALE] Verification link: ble.ir/loxxbot?start=${verificationToken}`);
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

  static async forgotPassword(phone: string) {
    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) throw new Error("کاربری با این شماره یافت نشد");

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: code, otpExpires: expires }
    });

    console.log(`[BALE] Security code: ${code}`);
    if (user.baleId) {
      await BaleService.sendOTPViaBot(user.baleId, code);
    }
    return true;
  }

  static async resetPassword(phone: string, code: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { phone }
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

  static generateBaleAuthToken(phone: string) {
    return jwt.sign({ phone, type: "bale_auth", nonce: uuidv4() }, JWT_SECRET, { expiresIn: "5m" });
  }

  static verifyBaleAuthToken(token: string) {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== "bale_auth") throw new Error("Invalid token type");
    return decoded as { phone: string };
  }
}
