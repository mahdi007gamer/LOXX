import prisma from "../utils/prisma.ts";

export class BadgeService {
  static async getAllBadges() {
    return await prisma.badge.findMany({
      orderBy: { name: "asc" }
    });
  }

  static async getBadgesByCategory(category: string) {
    return await prisma.badge.findMany({
      where: { category },
      orderBy: { name: "asc" }
    });
  }

  static async createBadge(data: { name: string, iconUrl: string, category: string, isSpecial: boolean }) {
    return await prisma.badge.create({
      data
    });
  }

  static async updateBadge(id: string, data: any) {
    return await prisma.badge.update({
      where: { id },
      data
    });
  }

  static async deleteBadge(id: string) {
    return await prisma.badge.delete({
      where: { id }
    });
  }

  static async toggleStandardBadge(userId: string, badgeId: string) {
    const badge = await prisma.badge.findUnique({ where: { id: badgeId } });
    if (!badge || badge.category !== "STANDARD") {
      throw new Error("این نشان قابل انتخاب توسط کاربر نیست");
    }
    
    const existing = await prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } }
    });
    
    if (existing) {
      await prisma.userBadge.delete({
        where: { userId_badgeId: { userId, badgeId } }
      });
      return { added: false };
    } else {
      await prisma.userBadge.create({
        data: { userId, badgeId }
      });
      return { added: true };
    }
  }

  static async assignBadge(userId: string, badgeId: string) {
    return await prisma.userBadge.upsert({
      where: {
        userId_badgeId: { userId, badgeId }
      },
      update: {},
      create: {
        userId,
        badgeId
      }
    });
  }

  static async removeBadge(userId: string, badgeId: string) {
    return await prisma.userBadge.deleteMany({
      where: {
        userId,
        badgeId
      }
    });
  }

  static async pinBadge(userId: string, badgeId: string, isPinned: boolean) {
    if (isPinned) {
      // Check if user already has 5 pinned badges
      const count = await prisma.userBadge.count({
        where: { userId, isPinned: true }
      });
      if (count >= 5) {
        throw new Error("You can only pin up to 5 badges");
      }
    }

    return await prisma.userBadge.update({
      where: {
        userId_badgeId: { userId, badgeId }
      },
      data: { isPinned }
    });
  }

  static async getUserBadges(userId: string) {
    return await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true }
    });
  }

  static async seedDefaultBadges() {
    const GAME_BADGES = [
      { name: "RainbowSix", iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=RainbowSix", category: "GAME" },
      { name: "Dota 2", iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=Dota2", category: "GAME" },
      { name: "CsGo", iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=CsGo", category: "GAME" },
      { name: "GTA V", iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=GTAV", category: "GAME" },
      { name: "Call Of Duty", iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=CoD", category: "GAME" },
      { name: "Fortnite", iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=Fortnite", category: "GAME" },
      { name: "Pubg", iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=Pubg", category: "GAME" },
      { name: "Zula", iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=Zula", category: "GAME" },
      { name: "BattleField", iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=BattleField", category: "GAME" },
      { name: "Apex", iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=Apex", category: "GAME" },
      { name: "Minecraft", iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=Minecraft", category: "GAME" },
      { name: "LOL", iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=LOL", category: "GAME" },
      { name: "WOW", iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=WOW", category: "GAME" },
      { name: "Rust", iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=Rust", category: "GAME" },
    ];

    const USER_BADGES = [
      { name: "Smoker", iconUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Smoker", category: "STANDARD" },
      { name: "Sniper", iconUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Sniper", category: "STANDARD" },
      { name: "Rifel", iconUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Rifel", category: "STANDARD" },
      { name: "Faghir", iconUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Faghir", category: "STANDARD" },
      { name: "Feshari", iconUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Feshari", category: "STANDARD" },
      { name: "BCool", iconUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=BCool", category: "STANDARD" },
      { name: "Ferferi", iconUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Ferferi", category: "STANDARD" },
      { name: "SuperLag", iconUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=SuperLag", category: "STANDARD" },
      { name: "Jooje", iconUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Jooje", category: "STANDARD" },
      { name: "Noob", iconUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Noob", category: "STANDARD" },
      { name: "Weed", iconUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Weed", category: "STANDARD" },
      { name: "Falaj", iconUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Falaj", category: "STANDARD" },
      { name: "Systemy", iconUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Systemy", category: "STANDARD" },
      { name: "Mobile Gamer", iconUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Mobile", category: "STANDARD" },
    ];

    const SPECIAL_BADGES = [
      { name: "Streamer", iconUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Streamer", category: "SPECIAL", isSpecial: true },
      { name: "Verify", iconUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Verify", category: "SPECIAL", isSpecial: true },
      { name: "Helper", iconUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Helper", category: "SPECIAL", isSpecial: true },
      { name: "Pro Player", iconUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pro", category: "SPECIAL", isSpecial: true },
      { name: "Leader", iconUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Leader", category: "SPECIAL", isSpecial: true },
    ];

    const allBadges = [...GAME_BADGES, ...USER_BADGES, ...SPECIAL_BADGES];

    for (const badgeData of allBadges) {
      await (prisma.badge as any).upsert({
        where: { name: badgeData.name },
        update: badgeData,
        create: badgeData,
      });
    }

    return { count: allBadges.length };
  }
}
