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

  static async listRequests(req: AuthenticatedRequest, res: Response) {
    try {
      const requests = await FriendshipService.getRequests(req.user!.userId);
      res.json({ status: "success", data: requests });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { code: "INTERNAL_ERROR", message: error.message } });
    }
  }

  static async sendRequest(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.body.username) {
        await FriendshipService.sendRequestByUsername(req.user!.userId, req.body.username);
      } else {
        await FriendshipService.sendRequest(req.user!.userId, req.body.target_id);
      }
      res.json({ status: "success", message: "درخواست ارسال شد" });
    } catch (error: any) {
      res.status(400).json({ status: "error", error: { code: "CONFLICT", message: error.message } });
    }
  }

  static async respondRequest(req: AuthenticatedRequest, res: Response) {
    try {
      await FriendshipService.respondRequest(req.user!.userId, req.body.request_id, req.body.action);
      res.json({ status: "success", message: "عملیات با موفقیت انجام شد" });
    } catch (error: any) {
      res.status(400).json({ status: "error", error: { code: "VALIDATION_FAILED", message: error.message } });
    }
  }

  static async toggleFavorite(req: AuthenticatedRequest, res: Response) {
    try {
      await FriendshipService.toggleFavorite(req.user!.userId, req.params.id);
      res.json({ status: "success", message: "تغییر وضعیت انجام شد" });
    } catch (error: any) {
      res.status(400).json({ status: "error", error: { code: "NOT_FOUND", message: error.message } });
    }
  }

  static async toggleMute(req: AuthenticatedRequest, res: Response) {
    try {
      await FriendshipService.toggleMute(req.user!.userId, req.params.id);
      res.json({ status: "success", message: "تغییر وضعیت انجام شد" });
    } catch (error: any) {
      res.status(400).json({ status: "error", error: { code: "NOT_FOUND", message: error.message } });
    }
  }

  static async toggleBlock(req: AuthenticatedRequest, res: Response) {
    try {
      await FriendshipService.toggleBlock(req.user!.userId, req.params.id);
      res.json({ status: "success", message: "تغییر وضعیت انجام شد" });
    } catch (error: any) {
      res.status(400).json({ status: "error", error: { code: "NOT_FOUND", message: error.message } });
    }
  }

  static async removeFriend(req: AuthenticatedRequest, res: Response) {
    try {
      await FriendshipService.removeFriend(req.user!.userId, req.params.id);
      res.json({ status: "success", message: "دوست حذف شد" });
    } catch (error: any) {
      res.status(400).json({ status: "error", error: { code: "NOT_FOUND", message: error.message } });
    }
  }
}
