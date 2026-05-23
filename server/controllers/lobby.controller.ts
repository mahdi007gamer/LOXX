import { Response } from "express";
import { LobbyService } from "../services/lobby.service.ts";
import { RankingService } from "../services/ranking.service.ts";
import { AuthenticatedRequest } from "../middleware/auth.middleware.ts";
import { emitLobbyUpdate, emitNotification } from "../utils/socket.ts";
import prisma from "../utils/prisma.ts";

import { PenaltyService } from "../services/penalty.service.ts";

export class LobbyController {
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const penalty = await PenaltyService.checkPenalty(req.user!.userId, ["LOBBY_BAN"]);
      if (penalty.isBanned) {
        return res.status(403).json({ status: "error", error: { message: penalty.message } });
      }

      const lobby = await LobbyService.createLobby(req.user!.userId, req.body);
      
      // Award XP for creating lobby
      await RankingService.addXP(req.user!.userId, 20, "LOBBY_CREATE");
      
      emitLobbyUpdate();

      // Emit lobby created notification to friends
      try {
        const friendships = await prisma.friendship.findMany({
          where: { OR: [{ requesterId: req.user!.userId, status: "ACCEPTED" }, { targetId: req.user!.userId, status: "ACCEPTED" }] },
          include: { 
            requester: { select: { username: true, profile: { select: { displayName: true } } } }, 
            target: { select: { username: true, profile: { select: { displayName: true } } } } 
          }
        });
        
        for (const f of friendships) {
          const friendId = f.requesterId === req.user!.userId ? f.targetId : f.requesterId;
          const myProfile = f.requesterId === req.user!.userId ? f.requester : f.target;
          const myName = myProfile.profile?.displayName || myProfile.username;
          
          await prisma.notification.create({
            data: {
              userId: friendId,
              type: "FRIEND_ACTIVITY",
              data: JSON.stringify({ message: `${myName} یک لابی جدید ساخت: ${lobby.title}`, lobbyId: lobby.id, userId: req.user!.userId }),
              isRead: false
            }
          });

          emitNotification(friendId, "FRIEND_ACTIVITY", {
              message: `${myName} یک لابی جدید ساخت: ${lobby.title}`,
              lobbyId: lobby.id,
              userId: req.user!.userId
          });
        }
      } catch (e) {
        console.error("Failed to emit friend lobby notification", e);
      }

      res.status(201).json({ status: "success", data: lobby });
    } catch (error: any) {
      res.status(400).json({ status: "error", error: { code: "VALIDATION_FAILED", message: error.message } });
    }
  }

  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { game_id, region } = req.query;
      const lobbies = await LobbyService.getLobbies({ 
        gameId: game_id as string, 
        region: region as string 
      });
      res.json({ status: "success", data: { items: lobbies } });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { code: "INTERNAL_ERROR", message: error.message } });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const lobby = await LobbyService.getLobbyById(req.params.id);
      if (!lobby) {
        return res.status(404).json({ status: "error", error: { code: "NOT_FOUND", message: "Lobby not found" } });
      }
      res.json({ status: "success", data: lobby });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { code: "INTERNAL_ERROR", message: error.message } });
    }
  }

  static async join(req: AuthenticatedRequest, res: Response) {
    try {
      await LobbyService.joinLobby(req.user!.userId, req.params.id, req.body.password);
      
      // Award XP for joining
      await RankingService.addXP(req.user!.userId, 10, "LOBBY_JOIN");
      
      emitLobbyUpdate();
      res.json({ status: "success", message: "Joined lobby" });
    } catch (error: any) {
      const code = error.message === "Lobby full" ? "LOBBY_FULL" : "VALIDATION_FAILED";
      res.status(400).json({ status: "error", error: { code, message: error.message } });
    }
  }
}
