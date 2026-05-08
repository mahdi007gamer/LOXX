import { Response } from "express";
import { FriendshipService } from "../services/friendship.service.ts";
import { RankingService } from "../services/ranking.service.ts";
import { AuthenticatedRequest } from "../middleware/auth.middleware.ts";

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
      let friendship;
      if (req.body.username) {
        friendship = await FriendshipService.sendRequestByUsername(req.user!.userId, req.body.username);
      } else {
        friendship = await FriendshipService.sendRequest(req.user!.userId, req.body.target_id);
      }

      // Realtime emit
      const io = req.app.get("io");
      if (io && friendship) {
         io.of("/notify").to(`user:${friendship.targetId}`).emit("friend_request_received", {
           requestId: friendship.id,
           requesterId: friendship.requesterId
         });
      }

      res.json({ status: "success", message: "درخواست ارسال شد" });
    } catch (error: any) {
      res.status(400).json({ status: "error", error: { code: "CONFLICT", message: error.message } });
    }
  }

  static async respondRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const friendship = await FriendshipService.respondRequest(req.user!.userId, req.body.request_id, req.body.action);
      
      // Award XP on Acceptance
      if (req.body.action === "ACCEPTED") {
          await RankingService.addXP(req.user!.userId, 20, "FRIEND_ACCEPTED");
      }

      // Realtime emit
      const io = req.app.get("io");
      if (io && friendship) {
         // Tell the requester that their request was accepted or rejected
         io.of("/notify").to(`user:${friendship.requesterId}`).emit("friend_request_responded", {
           requestId: friendship.id,
           targetId: friendship.targetId,
           action: req.body.action
         });
         // Tell both parties their friend list updated
         if (req.body.action === "ACCEPTED") {
            io.of("/notify").to(`user:${friendship.requesterId}`).emit("friend_list_updated");
            io.of("/notify").to(`user:${friendship.targetId}`).emit("friend_list_updated");
         }
      }

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
