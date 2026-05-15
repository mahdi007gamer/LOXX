import { Request, Response } from "express";
import { AuthService } from "../services/auth.service.ts";
import prisma from "../utils/prisma.ts";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      console.log(`[AUTH_CTRL] Registering user: ${req.body.username}, phone: ${req.body.phone}`);
      const user = await AuthService.register(req.body);
      res.status(201).json({
        status: "success",
        message: "User registered successfully",
        user: { 
          id: user.id, 
          username: user.username,
          verificationToken: user.verificationToken
        }
      });
    } catch (error: any) {
      console.error(`[AUTH_CTRL] Registration failed: ${error.message}`);
      res.status(400).json({ status: "error", error: { code: "VALIDATION_FAILED", message: error.message } });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      console.log(`[AUTH_CTRL] Login attempt for: ${req.body.phone}`);
      const result = await AuthService.login(req.body);
      
      if (result.status === "2fa_required") {
        console.log(`[AUTH_CTRL] 2FA required for user: ${result.userId}`);
        return res.json({
          status: "2fa_required",
          message: "کد تایید ارسال شد",
          userId: result.userId
        });
      }

      const { user, accessToken, refreshToken } = result;
      console.log(`[AUTH_CTRL] Login successful for: ${user?.username}`);

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
          phone: user!.phone,
          role: user!.role,
          membership: user!.profile?.membershipType,
          isVerified: user!.isVerified,
          twoFactorEnabled: user!.twoFactorEnabled,
          avatarUrl: user!.profile?.avatarUrl,
          bannerUrl: user!.profile?.bannerUrl,
          displayName: user!.profile?.displayName,
          vipMetadata: user!.profile?.vipMetadata ? JSON.parse(user!.profile.vipMetadata) : null
        }
      });
    } catch (error: any) {
      console.log(`[AUTH_CTRL] Login failed for ${req.body.phone}: ${error.message}`);
      if (error.message === "VERIFICATION_REQUIRED") {
        return res.status(403).json({ status: "error", error: { code: "VERIFICATION_REQUIRED", message: "VERIFICATION_REQUIRED" } });
      }
      res.status(401).json({ status: "error", error: { code: "INVALID_CREDENTIALS", message: error.message } });
    }
  }

  static async getBaleLoginUrl(req: Request, res: Response) {
    try {
      const { phone } = req.body;
      if (!phone) throw new Error("Phone is required");
      
      const normalizedPhone = AuthService.normalizePhone(phone);
      const token = AuthService.generateBaleAuthToken(normalizedPhone);
      const url = `https://ble.ir/loxxbot?start=${token}`;
      
      res.json({ status: "success", url });
    } catch (error: any) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }

  static async verifyBaleCallback(req: Request, res: Response) {
    try {
      const { token } = req.body;
      const { userId } = AuthService.verifyAccessToken(token); // bot sends session token
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      });

      if (!user) throw new Error("User not found");

      const refreshToken = AuthService.generateRefreshToken(user.id);
      
      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({
        status: "success",
        token,
        user: { 
          id: user.id, 
          username: user.username, 
          phone: user.phone,
          role: user.role,
          membership: user.profile?.membershipType,
          isVerified: user.isVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          avatarUrl: user.profile?.avatarUrl,
          bannerUrl: user.profile?.bannerUrl,
          displayName: user.profile?.displayName,
          vipMetadata: user.profile?.vipMetadata ? JSON.parse(user.profile.vipMetadata) : null
        }
      });
    } catch (error: any) {
      res.status(403).json({ status: "error", message: error.message });
    }
  }

  static async sendBaleVerificationLink(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) throw new Error("Unauthorized");
      await AuthService.sendBaleVerificationLink(userId);
      res.json({ status: "success", message: "لینک تایید ارسال شد" });
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
          phone: user.phone,
          role: user.role,
          membership: user.profile?.membershipType,
          isVerified: user.isVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          avatarUrl: user.profile?.avatarUrl,
          bannerUrl: user.profile?.bannerUrl,
          displayName: user.profile?.displayName,
          vipMetadata: user.profile?.vipMetadata ? JSON.parse(user.profile.vipMetadata) : null
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
      const { phone } = req.body;
      await AuthService.forgotPassword(phone);
      res.json({ status: "success", message: "کد بازیابی ارسال شد" });
    } catch (error: any) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { phone, code, newPassword } = req.body;
      await AuthService.resetPassword(phone, code, newPassword);
      res.json({ status: "success", message: "رمز عبور با موفقیت تغییر کرد" });
    } catch (error: any) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }

  static async checkStatus(req: Request, res: Response) {
    try {
      const { phone } = req.params;
      const normalizedPhone = AuthService.normalizePhone(phone);

      const user = await prisma.user.findFirst({
        where: { 
          OR: [
            { phone: normalizedPhone },
            { phone: phone }
          ]
        },
        include: { profile: true }
      });

      if (!user) return res.status(404).json({ status: "error", message: "User not found" });

      if (user.isVerified) {
         const accessToken = AuthService.generateAccessToken(user.id);
         const refreshToken = AuthService.generateRefreshToken(user.id);

         res.cookie("refresh_token", refreshToken, {
           httpOnly: true,
           secure: true,
           sameSite: "none",
           maxAge: 7 * 24 * 60 * 60 * 1000
         });

         return res.json({
           status: "success",
           verified: true,
           token: accessToken,
           user: {
             id: user.id,
             username: user.username,
             phone: user.phone,
             role: user.role,
             membership: user.profile?.membershipType,
             isVerified: user.isVerified,
             twoFactorEnabled: user.twoFactorEnabled,
             avatarUrl: user.profile?.avatarUrl,
             displayName: user.profile?.displayName
           }
         });
      }

      res.json({ status: "success", verified: false });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
}
