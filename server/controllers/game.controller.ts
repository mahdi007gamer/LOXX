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
          let metadata = {};
          if (g.metadata) {
            try { metadata = JSON.parse(g.metadata); } catch(e) {}
          }
          return {
            ...g,
            ...metadata,
            activeLobbies: g._count.lobbies,
            image: g.bannerUrl || (metadata as any).image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2070",
            genre: (metadata as any).genre || "بازی آنلاین",
            playerCount: (metadata as any).playerCount || "10K+",
            friendsPlaying: (metadata as any).friendsPlaying || [],
            variants: (metadata as any).variants || ["Competitive", "Casual", "Ranked"],
            maps: (metadata as any).maps || ["Mirage", "Inferno", "Dust 2", "Nuke", "Overpass", "Vertigo"]
          };
        })
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Failed to fetch games" });
    }
  }

  static async getGameById(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const game = await prisma.game.findUnique({
        where: { id }
      }) as any;
      
      if (!game) return res.status(404).json({ status: "error", message: "Game not found" });
      
      const safeParse = (str: string, defaultVal: any) => {
        if (!str) return defaultVal;
        try { return JSON.parse(str); } catch (e) { return defaultVal; }
      };
      
      const parsedGame = {
        ...game,
        genres: safeParse(game.genres, []),
        regions: safeParse(game.regions, []),
        metadata: safeParse(game.metadata, { features: [] })
      };
      
      if (!parsedGame.metadata?.features) {
        parsedGame.metadata = { ...parsedGame.metadata, features: [] };
      }
      
      res.json({ status: "success", data: parsedGame });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
}
