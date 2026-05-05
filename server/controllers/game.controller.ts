import { Request, Response } from "express";
import prisma from "../utils/prisma.js";

export class GameController {
  static async getAllGames(req: Request, res: Response) {
    try {
      const games = await prisma.game.findMany({
        include: {
          _count: {
            select: { lobbies: true }
          }
        }
      });

      res.json({
        status: "success",
        data: games.map(g => ({
          ...g,
          activeLobbies: g._count.lobbies,
          // Mapping to the frontend expected structure partially
          image: g.bannerUrl,
          genre: "بازی آنلاین", // Default for now
          playerCount: "نامشخص",
          friendsPlaying: []
        }))
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Failed to fetch games" });
    }
  }
}
