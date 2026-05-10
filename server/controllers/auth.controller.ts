import { Request, Response } from "express";
import { AuthService } from "../services/auth.service.ts";
import prisma from "../utils/prisma.ts";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const user = await AuthService.register(req.body);
      res.status(201).json({
        status: "success",
        message: "User registered successfully",
        user: { id: user.id, username: user.username }
      });
    } catch (error: any) {
      res.status(400).json({ status: "error", error: { code: "VALIDATION_FAILED", message: error.message } });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const result = await AuthService.login(req.body);
      
      if (result.status === "2fa_required") {
        return res.json({
          status: "2fa_required",
          message: "کد تایید به ایمیل شما ارسال شد",
          userId: result.userId
        });
      }

      const { user, accessToken, refreshToken } = result;

      // Store connected device
      const userAgent = req.headers["user-agent"] || "Unknown Browser";
      // ... (existing OS/Browser logic)
      let os = "Desktop";
      if (userAgent.includes("Windows")) os = "Windows";
      else if (userAgent.includes("Mac OS")) os = "macOS";
      else if (userAgent.includes("Linux")) os = "Linux";
      else if (userAgent.includes("Android")) os = "Android";
      else if (userAgent.includes("iOS") || userAgent.includes("iPhone")) os = "iOS";

      let browser = "Web Browser";
      if (userAgent.includes("Chrome")) browser = "Chrome";
      else if (userAgent.includes("Firefox")) browser = "Firefox";
      else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";

      await prisma.connectedDevice.create({
        data: {
          userId: user!.id,
          deviceName: `${os} (${browser})`,
          os,
          browser,
          ipAddress: req.ip || req.connection?.remoteAddress || "Unknown"
        }
      });

      // Set refresh token in HttpOnly cookie
      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        status: "success",
        token: accessToken,
        user: { 
          id: user!.id, 
          username: user!.username, 
          email: user!.email,
          role: user!.role,
          membership: user!.profile?.membershipType,
          isVerified: user!.isVerified,
          avatarUrl: user!.profile?.avatarUrl,
          bannerUrl: user!.profile?.bannerUrl,
          displayName: user!.profile?.displayName,
          vipMetadata: user!.profile?.vipMetadata
        }
      });
    } catch (error: any) {
      res.status(401).json({ status: "error", error: { code: "INVALID_CREDENTIALS", message: error.message } });
    }
  }

  static async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.body;
      await AuthService.verifyEmail(token);
      res.json({ status: "success", message: "ایمیل شما با موفقیت تایید شد" });
    } catch (error: any) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }

  static async verify2FA(req: Request, res: Response) {
    try {
      const { userId, code } = req.body;
      const { user, accessToken, refreshToken } = await AuthService.verify2FA(userId, code);

      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({
        status: "success",
        token: accessToken,
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          role: user.role,
          membership: user.profile?.membershipType,
          isVerified: user.isVerified,
          avatarUrl: user.profile?.avatarUrl,
          bannerUrl: user.profile?.bannerUrl,
          displayName: user.profile?.displayName,
          vipMetadata: user.profile?.vipMetadata
        }
      });
    } catch (error: any) {
      res.status(401).json({ status: "error", message: error.message });
    }
  }

  static async refresh(req: Request, res: Response) {
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ status: "error", error: { code: "AUTH_EXPIRED", message: "No refresh token" } });

    try {
      const { userId } = AuthService.verifyRefreshToken(token);
      
      // Verify user exists in DB
      const userExits = await prisma.user.findUnique({ where: { id: userId } });
      if (!userExits) {
        res.clearCookie("refresh_token");
        return res.status(401).json({ status: "error", error: { code: "UNAUTHORIZED", message: "User no longer exists" } });
      }

      const newAccessToken = AuthService.generateAccessToken(userId);
      res.json({ status: "success", token: newAccessToken });
    } catch (error) {
      res.status(401).json({ status: "error", error: { code: "AUTH_EXPIRED", message: "Invalid refresh token" } });
    }
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie("refresh_token");
    res.json({ status: "success", message: "Logged out" });
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const { identifier } = req.body;
      await AuthService.forgotPassword(identifier);
      res.json({ status: "success", message: "ایمیل بازیابی ارسال شد" });
    } catch (error: any) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { identifier, code, newPassword } = req.body;
      await AuthService.resetPassword(identifier, code, newPassword);
      res.json({ status: "success", message: "رمز عبور با موفقیت تغییر کرد" });
    } catch (error: any) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }
}
