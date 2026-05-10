import { Response } from "express";
import { UserService } from "../services/user.service.ts";
import { AuthenticatedRequest } from "../middleware/auth.middleware.ts";
import prisma from "../utils/prisma.ts";
import { SmsService } from "../services/sms.service.ts";

export class UserController {
  static async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      const user: any = await UserService.getMe(req.user!.userId);
      if (!user) return res.status(401).json({ status: "error", error: { code: "UNAUTHORIZED", message: "User not found" } });

      res.json({
        status: "success",
        data: {
          id: user.id,
          username: user.username,
          displayName: user.profile?.displayName,
          bio: user.profile?.bio,
          level: user.profile?.level,
          xp: user.profile?.xp,
          membership: user.profile?.membershipType,
          region: user.profile?.region,
          avatarUrl: user.profile?.avatarUrl,
          bannerUrl: user.profile?.bannerUrl,
          vipMetadata: user.profile?.vipMetadata,
          email: user.email,
          phoneNumber: user.phoneNumber,
          phoneVerified: user.phoneVerified,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled,
          stats: user.stats,
          badges: user.badges
        }
      });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { code: "INTERNAL_ERROR", message: error.message } });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      await UserService.updateProfile(req.user!.userId, req.body);
      res.json({ status: "success", message: "Profile updated successfully" });
    } catch (error: any) {
      res.status(400).json({ status: "error", error: { code: "VALIDATION_FAILED", message: error.message } });
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { current_password, new_password } = req.body;
      await UserService.changePassword(req.user!.userId, current_password, new_password);
      res.json({ status: "success", message: "Password updated successfully" });
    } catch (error: any) {
      res.status(400).json({ status: "error", error: { code: "PASSWORD_CHANGE_FAILED", message: error.message } });
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const user: any = await UserService.getProfileByUsername(req.params.username);
      if (!user) return res.status(404).json({ status: "error", error: { code: "RESOURCE_NOT_FOUND", message: "User not found" } });

      res.json({
        status: "success",
        data: {
          id: user.id,
          username: user.username,
          displayName: user.profile?.displayName,
          bio: user.profile?.bio,
          level: user.profile?.level,
          membership: user.profile?.membershipType,
          avatarUrl: user.profile?.avatarUrl,
          bannerUrl: user.profile?.bannerUrl,
          stats: user.stats,
          badges: user.badges,
          vipMetadata: user.profile?.vipMetadata
        }
      });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { code: "INTERNAL_ERROR", message: error.message } });
    }
  }

  static async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const stats = await UserService.getDashboardStats(req.user!.userId);
      res.json({ status: "success", data: stats });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { code: "INTERNAL_ERROR", message: error.message } });
    }
  }

  static async getMyGames(req: AuthenticatedRequest, res: Response) {
    try {
      const games = await UserService.getMyGames(req.user!.userId);
      res.json({ status: "success", data: games.map(ug => ug.game) });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { code: "INTERNAL_ERROR", message: error.message } });
    }
  }

  static async getTotalUserCount(req: AuthenticatedRequest, res: Response) {
    try {
      const count = await UserService.getTotalCount();
      res.json({ status: "success", data: { count } });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { code: "INTERNAL_ERROR", message: error.message } });
    }
  }

  static async toggleGame(req: AuthenticatedRequest, res: Response) {
    try {
      const { gameId } = req.body;
      const result = await UserService.toggleGame(req.user!.userId, gameId);
      res.json({ status: "success", data: result });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { code: "INTERNAL_ERROR", message: error.message } });
    }
  }

  static async getDevices(req: AuthenticatedRequest, res: Response) {
    try {
      const devices = await prisma.connectedDevice.findMany({
        where: { userId: req.user!.userId },
        orderBy: { lastActive: "desc" }
      });
      res.json({ status: "success", data: devices });
    } catch (error: any) {
      console.error("Error in getDevices:", error);
      res.status(500).json({ status: "error", error: { message: error.message } });
    }
  }

  static async revokeDevice(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await prisma.connectedDevice.deleteMany({
        where: { id, userId: req.user!.userId }
      });
      res.json({ status: "success", message: "Device revoked successfully" });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { message: error.message } });
    }
  }

  static async setup2FA(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      if (!user || !user.phoneNumber) {
        return res.status(400).json({ status: "error", error: { message: "ابتدا باید شماره همراه خود را در تنظیمات ثبت کنید" } });
      }

      const code = Math.floor(10000 + Math.random() * 90000).toString();
      const expires = new Date(Date.now() + 5 * 60 * 1000);

      await prisma.user.update({
        where: { id: userId },
        data: { otpCode: code, otpExpires: expires }
      });

      await SmsService.sendOtp(user.phoneNumber, code);
      res.json({ status: "success", message: "کد تایید پیامک شد" });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { message: error.message } });
    }
  }

  static async verify2FA(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { code } = req.body;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      
      if (!user || user.otpCode !== code || !user.otpExpires || new Date() > user.otpExpires) {
        return res.status(400).json({ status: "error", error: { message: "کد تایید اشتباه یا منقضی شده است" } });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { 
          twoFactorEnabled: true,
          otpCode: null,
          otpExpires: null
        }
      });

      res.json({ status: "success", message: "تایید دو مرحله‌ای با موفقیت فعال شد" });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { message: error.message } });
    }
  }

  static async disable2FA(req: AuthenticatedRequest, res: Response) {
    try {
      await prisma.user.update({
        where: { id: req.user!.userId },
        data: { twoFactorEnabled: false }
      });
      res.json({ status: "success", message: "تایید دو مرحله‌ای غیرفعال شد" });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { message: error.message } });
    }
  }
}
