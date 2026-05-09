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
}
