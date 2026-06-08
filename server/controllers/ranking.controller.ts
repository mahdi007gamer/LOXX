import { Request, Response } from "express";
import { RankingService } from "../services/ranking.service.ts";
import { AuthenticatedRequest } from "../middleware/auth.middleware.ts";

export class RankingController {
  static async getLeaderboard(req: Request, res: Response) {
    try {
      const { period } = req.query;
      const data = await RankingService.getLeaderboard(period as string);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { code: "INTERNAL_ERROR", message: error.message } });
    }
  }

  static async getUserRank(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await RankingService.getUserRank(req.user!.userId);
      res.json({ status: "success", data });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { code: "INTERNAL_ERROR", message: error.message } });
    }
  }
}
