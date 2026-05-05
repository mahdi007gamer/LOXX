import prisma from "../utils/prisma.js";

export class RankingService {
  static async addXP(userId: string, amount: number, source: string) {
    // 1. Log XP Event
    await prisma.xPLog.create({
      data: {
        userId,
        amount,
        source
      }
    });

    // 2. Fetch current profile
    const profile = await prisma.profile.findUnique({
      where: { userId }
    });

    if (!profile) return null;

    const newXp = profile.xp + amount;
    
    // 3. Simple progressive level formula: RequiredXP = L * (L-1) * 50
    // Solving for L: 50L^2 - 50L - XP = 0
    // Using quadratic formula: L = (50 + sqrt(2500 + 200*XP)) / 100
    const newLevel = Math.floor((50 + Math.sqrt(2500 + 200 * newXp)) / 100);

    return prisma.profile.update({
      where: { userId },
      data: {
        xp: newXp,
        level: newLevel
      }
    });
  }

  static async getLeaderboard(period: string = "weekly") {
    // For now, we simulate periods by looking at different XP filters if available
    // But since the project is early, we'll return global top
    const topProfiles = await prisma.profile.findMany({
      take: 50,
      orderBy: { xp: "desc" },
      include: { 
        user: {
          select: {
            username: true,
            id: true
          }
        } 
      }
    });

    return {
      reset_in: "2d 14h 05m", // Mock reset time for now
      top_users: topProfiles.map((p, i) => ({
        rank: i + 1,
        username: p.user.username,
        points: p.xp,
        trend: i < 3 ? "up" : "stable"
      }))
    };
  }
}
