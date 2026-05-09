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
    const STANDARD_BADGES = [
      { name: "Rainbow Six Siege", iconUrl: "/badges/r6.png", category: "GAME" },
      { name: "CS2 Pro", iconUrl: "/badges/cs2.png", category: "GAME" },
      { name: "Valorant Radiant", iconUrl: "/badges/valorant.png", category: "GAME" },
      { name: "Dota 2 Immortal", iconUrl: "/badges/dota2.png", category: "GAME" },
      { name: "LoL Challenger", iconUrl: "/badges/lol.png", category: "GAME" },
    ];

    const USER_CHOICE_BADGES = [
      { name: "Elite Sniper", iconUrl: "/badges/sniper.png", category: "USER" },
      { name: "Support Hero", iconUrl: "/badges/support.png", category: "USER" },
      { name: "Tactical Mind", iconUrl: "/badges/tactical.png", category: "USER" },
      { name: "entry Fragger", iconUrl: "/badges/entry.png", category: "USER" },
    ];

    const SPECIAL_BADGES = [
      { name: "LOXX Founder", iconUrl: "/badges/founder.png", category: "SPECIAL", isSpecial: true },
      { name: "Beta Tester", iconUrl: "/badges/beta.png", category: "SPECIAL", isSpecial: true },
      { name: "Top Contributor", iconUrl: "/badges/top.png", category: "SPECIAL", isSpecial: true },
      { name: "Streamer Partner", iconUrl: "/badges/streamer.png", category: "SPECIAL", isSpecial: true },
    ];

    const allBadges = [...STANDARD_BADGES, ...USER_CHOICE_BADGES, ...SPECIAL_BADGES];

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
