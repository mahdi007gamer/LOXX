import { Response } from "express";
import { FriendshipService } from "../services/friendship.service.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export class FriendshipController {
  static async listFriends(req: AuthenticatedRequest, res: Response) {
    try {
      const friends = await FriendshipService.getFriends(req.user!.userId);
      res.json({ status: "success", data: { items: friends } });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { code: "INTERNAL_ERROR", message: error.message } });
    }
  }

  static async sendRequest(req: AuthenticatedRequest, res: Response) {
    try {
      await FriendshipService.sendRequest(req.user!.userId, req.body.target_id);
      res.json({ status: "success", message: "Request sent" });
    } catch (error: any) {
      res.status(400).json({ status: "error", error: { code: "CONFLICT", message: error.message } });
    }
  }

  static async respondRequest(req: AuthenticatedRequest, res: Response) {
    try {
      await FriendshipService.respondRequest(req.user!.userId, req.body.request_id, req.body.action);
      res.json({ status: "success", message: "Success" });
    } catch (error: any) {
      res.status(400).json({ status: "error", error: { code: "VALIDATION_FAILED", message: error.message } });
    }
  }
}
