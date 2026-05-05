import { Response } from "express";
import { UserService } from "../services/user.service.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export class UserController {
  static async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await UserService.getMe(req.user!.userId);
      if (!user) return res.status(404).json({ status: "error", error: { code: "RESOURCE_NOT_FOUND", message: "User not found" } });

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
          email: user.email,
          role: user.role
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

  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await UserService.getProfileByUsername(req.params.username);
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
          avatarUrl: user.profile?.avatarUrl
        }
      });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { code: "INTERNAL_ERROR", message: error.message } });
    }
  }
}
