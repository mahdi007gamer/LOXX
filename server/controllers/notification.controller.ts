import { Response } from "express";
import { NotificationService } from "../services/notification.service.ts";
import { AuthenticatedRequest } from "../middleware/auth.middleware.ts";

export class NotificationController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const notifications = await NotificationService.getNotifications(req.user!.userId);
      res.json({ status: "success", data: { items: notifications } });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { code: "INTERNAL_ERROR", message: error.message } });
    }
  }

  static async markRead(req: AuthenticatedRequest, res: Response) {
    try {
      await NotificationService.markAsRead(req.user!.userId, req.body.ids, req.body.all);
      res.json({ status: "success", message: "Success" });
    } catch (error: any) {
      res.status(400).json({ status: "error", error: { code: "VALIDATION_FAILED", message: error.message } });
    }
  }
}
