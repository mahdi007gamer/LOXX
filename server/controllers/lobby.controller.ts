import { Response } from "express";
import { LobbyService } from "../services/lobby.service.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export class LobbyController {
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const lobby = await LobbyService.createLobby(req.user!.userId, req.body);
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

  static async join(req: AuthenticatedRequest, res: Response) {
    try {
      await LobbyService.joinLobby(req.user!.userId, req.params.id, req.body.password);
      res.json({ status: "success", message: "Joined lobby" });
    } catch (error: any) {
      const code = error.message === "Lobby full" ? "LOBBY_FULL" : "VALIDATION_FAILED";
      res.status(400).json({ status: "error", error: { code, message: error.message } });
    }
  }
}
