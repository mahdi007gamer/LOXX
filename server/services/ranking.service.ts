import prisma from "../utils/prisma.ts";
import { emitRankingUpdate } from "../utils/socket.ts";

export class RankingService {
  static async addXP(userId: string, amount: number, source: string) {
    // Limits and Cooldowns Logic
    const now = new Date();
    
    // Check for cooldowns/limits based on source
    if (source === "LOBBY_CREATE") {
      // 1 per hour
      const last = await prisma.xPLog.findFirst({
        where: { userId, source, timestamp: { gte: new Date(now.getTime() - 3600000) } }
      });
      if (last) return null;
    } else if (source === "LOBBY_FULL") {
      // 1 per 30 mins
      const last = await prisma.xPLog.findFirst({
        where: { userId, source, timestamp: { gte: new Date(now.getTime() - 1800000) } }
      });
      if (last) return null;
    } else if (source === "MATCH_START") {
      // 1 per hour
      const last = await prisma.xPLog.findFirst({
        where: { userId, source, timestamp: { gte: new Date(now.getTime() - 3600000) } }
      });
      if (last) return null;
    } else if (source === "FRIEND_ACCEPTED") {
      // max 2 per hour
      const count = await prisma.xPLog.count({
        where: { userId, source, timestamp: { gte: new Date(now.getTime() - 3600000) } }
      });
      if (count >= 2) return null;
    } else if (source === "CHAT_MESSAGE") {
      // max 10 per hour
      const count = await prisma.xPLog.count({
        where: { userId, source, timestamp: { gte: new Date(now.getTime() - 3600000) } }
      });
      if (count >= 10) return null;
    } else if (source === "LOBBY_SHARE") {
      // 1 per hour
      const last = await prisma.xPLog.findFirst({
        where: { userId, source, timestamp: { gte: new Date(now.getTime() - 3600000) } }
      });
      if (last) return null;
    }

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
    // Using quadratic formula: L = (50 + Math.sqrt(2500 + 200*XP)) / 100
    const newLevel = Math.floor((50 + Math.sqrt(2500 + 200 * newXp)) / 100);

    const updated = await prisma.profile.update({
      where: { userId },
      data: {
        xp: newXp,
        level: newLevel
      }
    });

    emitRankingUpdate();
    return updated;
  }

  static async getLeaderboard(period: string = "weekly") {
    // Find next Monday 00:00 for reset estimation
    const now = new Date();
    const nextMonday = new Date();
    nextMonday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7);
    nextMonday.setHours(0, 0, 0, 0);
    if (nextMonday <= now) nextMonday.setDate(nextMonday.getDate() + 7);

    const diff = nextMonday.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);

    const reset_in = `${days}d ${hours}h ${mins}m`;

    const topProfiles = await prisma.profile.findMany({
      take: 50,
      orderBy: { xp: "desc" },
      include: { 
        user: {
          select: {
            username: true,
            id: true,
            profile: {
               select: { avatarUrl: true, level: true }
            }
          }
        } 
      }
    });

    const topUsersFormatted = topProfiles.map((p, i) => ({
      rank: i + 1,
      id: p.userId,
      username: p.user.username,
      points: p.xp,
      level: p.level,
      avatar: p.user.profile?.avatarUrl,
      trend: i < 3 ? "up" : i > 10 ? "down" : "stable"
    }));

    return {
      reset_in,
      top_users: topUsersFormatted
    };
  }

  static async getUserRank(userId: string) {
    const allProfiles = await prisma.profile.findMany({
      orderBy: { xp: "desc" },
      select: { userId: true, xp: true }
    });

    const index = allProfiles.findIndex(p => p.userId === userId);
    const rank = index === -1 ? allProfiles.length + 1 : index + 1;
    const profile = await prisma.profile.findUnique({ where: { userId } });

    // Points to reach top 10
    let pointsToTop10 = 0;
    if (rank > 10 && allProfiles.length >= 10) {
      pointsToTop10 = (allProfiles[9].xp - (profile?.xp || 0)) + 1;
    }

    return {
      rank,
      points: profile?.xp || 0,
      level: profile?.level || 1,
      pointsToTop10: Math.max(0, pointsToTop10)
    };
  }
}
