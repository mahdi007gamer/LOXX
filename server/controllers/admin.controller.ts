import { Request, Response } from "express";
import prisma from "../utils/prisma.ts";
import argon2 from "argon2";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    
    const whereClause = search ? {
      OR: [
        { username: { contains: String(search) } as any },
        { phone: { contains: String(search) } as any }
      ]
    } : {};

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        phone: true,
        isVerified: true,
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
    // 1. Resolve messages that need to be updated to detach replyTo 
    const messagesToUpdate = await prisma.message.findMany({
      where: { replyTo: { OR: [{ senderId: id }, { receiverId: id }] } },
      select: { id: true }
    });
    const messageIdsToUpdate = messagesToUpdate.map(m => m.id);

    // 2. Cleanup all related records using deleteMany to avoid errors if they don't exist
    // This handles foreign key constraints manually since onDelete: Cascade might not be active
    await prisma.$transaction([
      prisma.userBadge.deleteMany({ where: { userId: id } }),
      prisma.friendship.deleteMany({ where: { OR: [{ requesterId: id }, { targetId: id }] } }),
      prisma.channelMember.deleteMany({ where: { userId: id } }),
      prisma.message.updateMany({ where: { id: { in: messageIdsToUpdate } }, data: { replyToId: null } }),
      prisma.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } }),
      prisma.lobbyMember.deleteMany({ where: { userId: id } }),
      prisma.xPLog.deleteMany({ where: { userId: id } }),
      prisma.subscription.deleteMany({ where: { userId: id } }),
      prisma.paymentRequest.deleteMany({ where: { userId: id } }),
      prisma.activity.deleteMany({ where: { userId: id } }),
      prisma.lobbyBan.deleteMany({ where: { userId: id } }),
      prisma.connectedDevice.deleteMany({ where: { userId: id } }),
      prisma.notification.deleteMany({ where: { userId: id } }),
      prisma.userGame.deleteMany({ where: { userId: id } }),
      prisma.referral.deleteMany({ where: { OR: [{ inviterId: id }, { inviteeId: id }] } }),
      prisma.auditLog.deleteMany({ where: { userId: id } }), // Added
      prisma.channel.updateMany({ where: { ownerId: id }, data: { ownerId: null } }),
      prisma.lobby.deleteMany({ where: { hostId: id } }), 
      prisma.profile.deleteMany({ where: { userId: id } }),
      prisma.userSettings.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } })
    ]);

    res.json({ status: "success", message: "کاربر با موفقیت حذف شد" });
  } catch (error: any) {
    console.error("Delete user error:", error);
    res.status(500).json({ status: "error", message: "خطا در حذف کاربر: " + error.message });
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

export const updateUserVerification = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isVerified } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { isVerified },
      select: { id: true, isVerified: true }
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
      const features = Array.isArray(metadata.features) ? [...metadata.features] : [];
      
      const hasFeature = (names: string[]) => features.some((f: any) => 
        names.some(n => f.name.toLowerCase() === n.toLowerCase() || f.name.toLowerCase().includes(n.toLowerCase()))
      );

      const hasMode = hasFeature(['Mode', 'حالت']);
      const hasMap = hasFeature(['Map', 'نقشه']);
      const hasSide = hasFeature(['Side', 'تیم']);
      const hasLevel = hasFeature(['Level', 'سطح']);

      if (!hasMode && metadata.modes && Array.isArray(metadata.modes) && metadata.modes.length > 0) {
        features.push({ name: 'Mode', options: metadata.modes });
      }
      if (!hasMap && metadata.maps && Array.isArray(metadata.maps) && metadata.maps.length > 0) {
        features.push({ name: 'Map', options: metadata.maps });
      }
      if (!hasSide && metadata.sides && Array.isArray(metadata.sides) && metadata.sides.length > 0) {
        features.push({ name: 'Side', options: metadata.sides });
      }
      if (!hasLevel && metadata.levels && Array.isArray(metadata.levels) && metadata.levels.length > 0) {
        features.push({ name: 'Level', options: metadata.levels });
      }
      
      parsedGame.metadata.features = features;
      
      // Remove legacy fields so when admin saves it overrides them into features
      delete parsedGame.metadata.modes;
      delete parsedGame.metadata.maps;
      delete parsedGame.metadata.sides;
      delete parsedGame.metadata.levels;
    }
    
    res.json({ status: "success", data: parsedGame });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const createGame = async (req: Request, res: Response) => {
  const { title, iconUrl, bannerUrl, genres, regions, metadata, badgeId } = req.body;
  try {
    const game = await (prisma.game.create as any)({
      data: { 
        title, 
        iconUrl,
        bannerUrl,
        badgeId: badgeId || null,
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
  const { title, iconUrl, bannerUrl, genres, regions, metadata, badgeId } = req.body;
  try {
    const game = await (prisma.game.update as any)({
      where: { id },
      data: { 
        title, 
        iconUrl,
        bannerUrl,
        badgeId: badgeId || null,
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

export const updateUserDetails = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, phone, password } = req.body;
  
  try {
    const data: any = {};
    if (username) data.username = username;
    if (phone) data.phone = phone;
    if (password) data.passwordHash = await argon2.hash(password);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, phone: true }
    });

    res.json({ status: "success", data: user });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const exportDatabase = async (req: Request, res: Response) => {
  try {
    const games = await prisma.game.findMany();
    const badges = await prisma.badge.findMany();
    
    const backup = {
      timestamp: new Date().toISOString(),
      games,
      badges
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=loxx_backup.json');
    res.send(JSON.stringify(backup, null, 2));
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const getAdminAlerts = async (req: Request, res: Response) => {
  try {
    const pendingPaymentsCount = await prisma.paymentRequest.count({
      where: { status: "PENDING" }
    });
    const pendingReportsCount = await prisma.report.count({
      where: { status: "PENDING" }
    });
    res.json({
      status: "success",
      data: {
        pendingPaymentsCount,
        pendingReportsCount
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Streamer Management
export const getAllStreamers = async (req: Request, res: Response) => {
  try {
    const streamers = await prisma.user.findMany({
      where: { role: "STREAMER" },
      include: {
        streamerStats: true,
        withdrawals: { orderBy: { createdAt: 'desc' } }
      }
    });

    const mappedStreamers = streamers.map(user => ({
      ...user.streamerStats,
      user: {
        username: user.username,
        avatar: user.avatar
      },
      withdrawalRequests: user.withdrawals
    }));

    res.json({ status: "success", data: mappedStreamers });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const approveWithdrawal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { receiptUrl } = req.body;
    
    const withdrawal = await prisma.withdrawalRequest.findUnique({ where: { id }});
    if (!withdrawal || withdrawal.status !== "PENDING") {
      return res.status(400).json({ status: "error", message: "Invalid withdrawal request" });
    }

    await prisma.$transaction([
      prisma.withdrawalRequest.update({
        where: { id },
        data: { status: "PAID", receiptUrl }
      }),
      prisma.streamerStats.update({
        where: { userId: withdrawal.streamerId },
        data: { balance: { decrement: withdrawal.amount } }
      }),
      // Create a notification for the streamer
      prisma.notification.create({
        data: {
          userId: withdrawal.streamerId,
          type: "SYSTEM",
          data: JSON.stringify({
            title: "تسویه حساب استریمر",
            message: `درخواست تسویه ${withdrawal.amount.toLocaleString()} تومان تایید و واریز شد.`
          })
        }
      })
    ]);

    const { emitNotification } = require("../utils/socket.ts");
    emitNotification(withdrawal.streamerId, "SYSTEM", {
      title: "تسویه حساب استریمر",
      message: `درخواست تسویه ${withdrawal.amount.toLocaleString()} تومان تایید و واریز شد.`
    });

    res.json({ status: "success", message: "Withdrawal approved" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const rejectWithdrawal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const withdrawal = await prisma.withdrawalRequest.findUnique({ where: { id }});
    if (!withdrawal || withdrawal.status !== "PENDING") {
      return res.status(400).json({ status: "error", message: "Invalid withdrawal request" });
    }

    await prisma.$transaction([
      prisma.withdrawalRequest.update({
        where: { id },
        data: { status: "REJECTED" }
      }),
      // Refund balance? Actually no, balance is already deducted when PENDING.
      // We must add it back since it's rejected.
      prisma.streamerStats.update({
        where: { userId: withdrawal.streamerId },
        data: { balance: { increment: withdrawal.amount } }
      }),
      prisma.notification.create({
        data: {
          userId: withdrawal.streamerId,
          type: "SYSTEM",
          data: JSON.stringify({
            title: "رد درخواست تسویه",
            message: `درخواست تسویه شما رد شد. علت: ${reason || 'نامشخص'}`
          })
        }
      })
    ]);

    const { emitNotification } = require("../utils/socket.ts");
    emitNotification(withdrawal.streamerId, "SYSTEM", {
      title: "رد درخواست تسویه",
      message: `درخواست تسویه شما رد شد. علت: ${reason || 'نامشخص'}`
    });

    res.json({ status: "success", message: "Withdrawal rejected" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
