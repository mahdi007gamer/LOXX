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
        data: games.map(g => {
          const metadata = g.metadata ? JSON.parse(g.metadata) : {};
          return {
            ...g,
            ...metadata,
            activeLobbies: g._count.lobbies,
            image: g.bannerUrl || metadata.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2070",
            genre: metadata.genre || "بازی آنلاین",
            playerCount: metadata.playerCount || "10K+",
            friendsPlaying: metadata.friendsPlaying || [],
            variants: metadata.variants || ["Competitive", "Casual", "Ranked"],
            maps: metadata.maps || ["Mirage", "Inferno", "Dust 2", "Nuke", "Overpass", "Vertigo"]
          };
        })
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Failed to fetch games" });
    }
  }
}
