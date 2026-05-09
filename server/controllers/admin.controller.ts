import { Request, Response } from "express";
import prisma from "../utils/prisma.ts";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    
    const whereClause = search ? {
      OR: [
        { username: { contains: String(search) } as any },
        { email: { contains: String(search) } as any }
      ]
    } : {};

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            avatarUrl: true,
            bannerUrl: true,
            displayName: true,
            membershipType: true,
            bio: true,
            level: true
          }
        },
        badges: {
          include: { badge: true }
        },
        subscriptions: {
          orderBy: { expiresAt: "desc" },
          take: 1
        }
      }
    });
    res.json({ status: "success", data: users });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({
      where: { id }
    });
    res.json({ status: "success", message: "User deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, role: true }
    });
    res.json({ status: "success", data: user });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const updateUserMembership = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { membershipType, days } = req.body; // NONE, PLUS, VIP, and days (number)
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ status: "error", message: "User not found" });

    // 1. Update Profile
    await prisma.profile.update({
      where: { userId: id },
      data: { membershipType }
    });

    // 2. Handle Subscription if it's not NONE
    if (membershipType !== "NONE" && days > 0) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const existingSub = await prisma.subscription.findFirst({
        where: { userId: id }
      });

      if (existingSub) {
        // If they have an active sub, extend it. Otherwise start fresh
        let newExpiresAt = existingSub.expiresAt > now 
          ? new Date(existingSub.expiresAt.getTime() + days * 24 * 60 * 60 * 1000) 
          : expiresAt;

        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: {
            type: membershipType,
            expiresAt: newExpiresAt
          }
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId: id,
            type: membershipType,
            expiresAt: expiresAt
          }
        });
      }
    } else if (membershipType === "NONE") {
      // If setting to NONE, we could either delete active sub or just let it expire.
      // For immediate effect as requested by user ("I manually made him regular"),
      // we should probably clear or expire the sub.
      await prisma.subscription.updateMany({
        where: { userId: id, expiresAt: { gt: new Date() } },
        data: { expiresAt: new Date() }
      });
    }

    res.json({ status: "success", message: "Membership updated successfully" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const getGameById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const game = await prisma.game.findUnique({
      where: { id }
    }) as any;
    
    if (!game) return res.status(404).json({ status: "error", message: "Game not found" });
    
    // Safely Parse JSON fields
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
    
    // Ensure metadata has features without overwriting other potential fields
    if (typeof parsedGame.metadata === 'object' && parsedGame.metadata !== null && !parsedGame.metadata.features) {
      parsedGame.metadata.features = [];
    } else if (typeof parsedGame.metadata !== 'object' || parsedGame.metadata === null) {
      parsedGame.metadata = { features: [] };
    }
    
    // Migration: If metadata has modes/maps but they aren't in features, add them
    const metadata = parsedGame.metadata;
    if (metadata) {
      const features = Array.isArray(metadata.features) ? metadata.features : [];
      
      const findFeature = (name: string) => features.find((f: any) => 
        f.name.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(f.name.toLowerCase())
      );

      const hasMode = findFeature('Mode') || findFeature('حالت بازی');
      const hasMap = findFeature('Map') || findFeature('نقشه');
      const hasSide = findFeature('Side');
      const hasLevel = findFeature('Level');

      if (!hasMode && metadata.modes && Array.isArray(metadata.modes)) {
        features.push({ name: 'حالت بازی (Mode)', options: metadata.modes });
      }
      if (!hasMap && metadata.maps && Array.isArray(metadata.maps)) {
        features.push({ name: 'نقشه (Map)', options: metadata.maps });
      }
      if (!hasSide && metadata.sides && Array.isArray(metadata.sides)) {
        features.push({ name: 'Side', options: metadata.sides });
      }
      if (!hasLevel && metadata.levels && Array.isArray(metadata.levels)) {
        features.push({ name: 'Level', options: metadata.levels });
      }
      
      parsedGame.metadata.features = features;
    }
    
    res.json({ status: "success", data: parsedGame });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const createGame = async (req: Request, res: Response) => {
  const { title, iconUrl, bannerUrl, genres, regions, metadata } = req.body;
  try {
    const game = await (prisma.game.create as any)({
      data: { 
        title, 
        iconUrl,
        bannerUrl,
        genres: genres ? JSON.stringify(genres) : null,
        regions: regions ? JSON.stringify(regions) : null,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });
    res.json({ status: "success", data: game });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const updateGame = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, iconUrl, bannerUrl, genres, regions, metadata } = req.body;
  try {
    const game = await (prisma.game.update as any)({
      where: { id },
      data: { 
        title, 
        iconUrl,
        bannerUrl,
        genres: genres ? JSON.stringify(genres) : null,
        regions: regions ? JSON.stringify(regions) : null,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });
    res.json({ status: "success", data: game });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const deleteGame = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.game.delete({
      where: { id }
    });
    res.json({ status: "success", message: "Game deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Genre Management
export const getAllGenres = async (req: Request, res: Response) => {
  try {
    const genres = await (prisma as any).genre.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ status: "success", data: genres });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const createGenre = async (req: Request, res: Response) => {
  const { name, icon } = req.body;
  try {
    const genre = await (prisma as any).genre.create({
      data: { name, icon }
    });
    res.json({ status: "success", data: genre });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const updateGenre = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, icon } = req.body;
  try {
    const genre = await (prisma as any).genre.update({
      where: { id },
      data: { name, icon }
    });
    res.json({ status: "success", data: genre });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const seedGenres = async (req: Request, res: Response) => {
  const defaultGenres = [
    { name: "شلیک اول شخص (FPS)", icon: "Target" },
    { name: "نقش‌آفرینی (RPG)", icon: "Swords" },
    { name: "استراتژی (Strategy)", icon: "Cpu" },
    { name: "ورزشی (Sports)", icon: "Trophy" },
    { name: "مسابقه‌ای (Racing)", icon: "Car" },
    { name: "ترسناک (Horror)", icon: "Ghost" },
    { name: "بقا (Survival)", icon: "Flame" },
    { name: "مافیا (Mafia)", icon: "ShieldAlert" },
    { name: "بتل رویال (Battle Royale)", icon: "Skull" },
    { name: "تاکتیکی (Tactical)", icon: "Shield" },
    { name: "شبیه سازی (Simulation)", icon: "Box" },
    { name: "مبارزه‌ای (Fighting)", icon: "Zap" },
    { name: "ماجراجویی (Adventure)", icon: "Compass" },
    { name: "پازل و فکری", icon: "Dices" },
    { name: "میدان نبرد آنلاین (MOBA)", icon: "Swords" }
  ];

  try {
    const results = [];
    for (const g of defaultGenres) {
      // Check if exists
      const existing = await (prisma as any).genre.findFirst({
        where: { name: g.name }
      });
      if (!existing) {
        const created = await (prisma as any).genre.create({ data: g });
        results.push(created);
      }
    }
    res.json({ status: "success", message: `Generated ${results.length} new genres`, data: results });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const deleteGenre = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await (prisma as any).genre.delete({
      where: { id }
    });
    res.json({ status: "success", message: "Genre deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const autoLinkGameBadges = async (req: Request, res: Response) => {
  try {
    const games = await prisma.game.findMany();
    const badges = await prisma.badge.findMany({ where: { category: "GAME" } });
    
    let updatedCount = 0;
    for (const game of games) {
      if (game.badgeId) continue;
      
      const matchingBadge = badges.find(b => 
        b.name.toLowerCase().replace(/\s+/g, '') === game.title.toLowerCase().replace(/\s+/g, '') ||
        game.title.toLowerCase().includes(b.name.toLowerCase())
      );
      
      if (matchingBadge) {
        await (prisma.game.update as any)({
          where: { id: game.id },
          data: { badgeId: matchingBadge.id }
        });
        updatedCount++;
      }
    }
    
    res.json({ status: "success", message: `Auto-linked ${updatedCount} games to badges` });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
