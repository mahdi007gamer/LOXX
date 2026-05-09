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
    return await prisma.userBadge.delete({
      where: {
        userId_badgeId: { userId, badgeId }
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
      { name: "RainbowSix", iconUrl: "/badges/r6.png", category: "GAME" },
      { name: "Dota 2", iconUrl: "/badges/dota2.png", category: "GAME" },
      { name: "CsGo", iconUrl: "/badges/csgo.png", category: "GAME" },
      { name: "GTA V", iconUrl: "/badges/gtav.png", category: "GAME" },
      { name: "Call Of Duty", iconUrl: "/badges/cod.png", category: "GAME" },
      { name: "Fortnite", iconUrl: "/badges/fortnite.png", category: "GAME" },
      { name: "Pubg", iconUrl: "/badges/pubg.png", category: "GAME" },
      { name: "Zula", iconUrl: "/badges/zula.png", category: "GAME" },
      { name: "BattleField", iconUrl: "/badges/bf.png", category: "GAME" },
      { name: "Apex", iconUrl: "/badges/apex.png", category: "GAME" },
      { name: "Minecraft", iconUrl: "/badges/minecraft.png", category: "GAME" },
      { name: "LOL", iconUrl: "/badges/lol.png", category: "GAME" },
      { name: "WOW", iconUrl: "/badges/wow.png", category: "GAME" },
      { name: "Rust", iconUrl: "/badges/rust.png", category: "GAME" },
    ];

    const USER_BADGES = [
      { name: "Smoker", iconUrl: "/badges/smoker.png", category: "USER" },
      { name: "Sniper", iconUrl: "/badges/sniper.png", category: "USER" },
      { name: "Rifel", iconUrl: "/badges/rifel.png", category: "USER" },
      { name: "Faghir", iconUrl: "/badges/faghir.png", category: "USER" },
      { name: "Feshari", iconUrl: "/badges/feshari.png", category: "USER" },
      { name: "BCool", iconUrl: "/badges/bcool.png", category: "USER" },
      { name: "Ferferi", iconUrl: "/badges/ferferi.png", category: "USER" },
      { name: "SuperLag", iconUrl: "/badges/superlag.png", category: "USER" },
      { name: "Jooje", iconUrl: "/badges/jooje.png", category: "USER" },
      { name: "Noob", iconUrl: "/badges/noob.png", category: "USER" },
      { name: "Weed", iconUrl: "/badges/weed.png", category: "USER" },
      { name: "Falaj", iconUrl: "/badges/falaj.png", category: "USER" },
      { name: "Systemy", iconUrl: "/badges/systemy.png", category: "USER" },
      { name: "Mobile Gamer", iconUrl: "/badges/mobile.png", category: "USER" },
    ];

    const SPECIAL_BADGES = [
      { name: "Streamer", iconUrl: "/badges/streamer.png", category: "SPECIAL", isSpecial: true },
      { name: "Verify", iconUrl: "/badges/verify.png", category: "SPECIAL", isSpecial: true },
      { name: "Helper", iconUrl: "/badges/helper.png", category: "SPECIAL", isSpecial: true },
      { name: "Pro Player", iconUrl: "/badges/pro.png", category: "SPECIAL", isSpecial: true },
      { name: "Leader", iconUrl: "/badges/leader.png", category: "SPECIAL", isSpecial: true },
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
