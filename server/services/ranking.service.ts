import prisma from "../utils/prisma.js";

export class RankingService {
  static async addXP(userId: string, amount: number, source: string) {
    await prisma.xPLog.create({
      data: {
        userId,
        amount,
        source
      }
    });

    return prisma.profile.update({
      where: { userId },
      data: {
        xp: { increment: amount },
        level: {
          // Simplified leveling logic: every 100 XP is a level
          // In real implementation, this would be more complex
          increment: 0 
        }
      }
    });
  }

  static async getLeaderboard(period: string) {
    // Simplified: SQLite doesn't have periodic aggregation built-in as easily as Postgres
    // We'll just return top users by XP for now
    const topProfiles = await prisma.profile.findMany({
      take: 50,
      orderBy: { xp: "desc" },
      include: { user: true }
    });

    return topProfiles.map((p, i) => ({
      rank: i + 1,
      username: p.user.username,
      points: p.xp,
      trend: "stable"
    }));
  }
}
