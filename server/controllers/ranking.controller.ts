import { Request, Response } from "express";
import { RankingService } from "../services/ranking.service.ts";

export class RankingController {
  static async getLeaderboard(req: Request, res: Response) {
    try {
      const { period } = req.query;
      const leaderboard = await RankingService.getLeaderboard(period as string);
      res.json({
        status: "success",
        data: {
          items: leaderboard,
          reset_in: "2d 14h 05m" // Mock reset time
        }
      });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { code: "INTERNAL_ERROR", message: error.message } });
    }
  }
}
