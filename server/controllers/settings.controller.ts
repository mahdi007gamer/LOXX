import { Response } from "express";
import { SettingsService } from "../services/settings.service.ts";
import { AuthenticatedRequest } from "../middleware/auth.middleware.ts";

export class SettingsController {
  static async getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const settings = await SettingsService.getSettings(req.user!.userId);
      res.json({ status: "success", data: settings });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { code: "INTERNAL_ERROR", message: error.message } });
    }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const settings = await SettingsService.updateSettings(req.user!.userId, req.body);
      res.json({ status: "success", data: settings });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { code: "INTERNAL_ERROR", message: error.message } });
    }
  }
}
