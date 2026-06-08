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

    const startOfWeek = new Date(nextMonday.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weeklyLogs = await prisma.xPLog.groupBy({
      by: ['userId'],
      _sum: { amount: true },
      where: { timestamp: { gte: startOfWeek } },
      orderBy: { _sum: { amount: 'desc' } },
      take: 50
    });

    const userIds = weeklyLogs.map(l => l.userId);

    const topProfiles = await prisma.profile.findMany({
      where: { userId: { in: userIds } },
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

    const topUsersFormatted = weeklyLogs.map((log, i) => {
      const p = topProfiles.find(profile => profile.userId === log.userId);
      if (!p) return null;
      return {
        rank: i + 1,
        id: p.userId,
        username: p.user.username,
        points: log._sum.amount || 0,
        level: p.level,
        avatar: p.avatarUrl,
        avatarUrl: p.avatarUrl,
        bannerUrl: p.bannerUrl,
        membership: p.membershipType,
        vipMetadata: p.vipMetadata ? JSON.parse(p.vipMetadata.toString()) : undefined,
        trend: i < 3 ? "up" : i > 10 ? "down" : "stable"
      };
    }).filter(Boolean);

    return {
      reset_in,
      top_users: topUsersFormatted
    };
  }

  static async distributeWeeklyRewards(isManual: boolean = false) {
    const now = new Date();
    
    // Check if we already distributed this week
    const lastReward = await prisma.notification.findFirst({
      where: { type: "WEEKLY_REWARD" },
      orderBy: { createdAt: "desc" }
    });

    if (!isManual && lastReward && (now.getTime() - lastReward.createdAt.getTime() < 6 * 24 * 60 * 60 * 1000)) {
      return; 
    }

    if (!isManual && now.getDay() !== 1) return; // Only run automatically on Mondays

    let startOfPrevWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    startOfPrevWeek.setHours(0, 0, 0, 0);
    let endOfPrevWeek = new Date(now.getTime());
    endOfPrevWeek.setHours(0, 0, 0, 0);
    
    if (isManual) {
      // Just test with current week if manual trigger
      startOfPrevWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endOfPrevWeek = now;
    }

    const prevWeekLogs = await prisma.xPLog.groupBy({
      by: ['userId'],
      _sum: { amount: true },
      where: { timestamp: { gte: startOfPrevWeek, lt: endOfPrevWeek } },
      orderBy: { _sum: { amount: 'desc' } },
      take: 3
    });

    if (prevWeekLogs.length === 0) return;

    const rewards = [3, 2, 1];

    for (let i = 0; i < prevWeekLogs.length; i++) {
       const uId = prevWeekLogs[i].userId;
       const days = rewards[i];
       if (!days) break;

       const expireTime = new Date();
       expireTime.setDate(expireTime.getDate() + days);

       const existingSub = await prisma.subscription.findFirst({
         where: { userId: uId }
       });

       if (existingSub) {
         await prisma.subscription.update({
           where: { id: existingSub.id },
           data: { type: "VIP", expiresAt: expireTime }
         });
       } else {
         await prisma.subscription.create({
           data: { userId: uId, type: "VIP", expiresAt: expireTime }
         });
       }

       await prisma.profile.update({
         where: { userId: uId },
         data: { membershipType: "VIP" }
       });

       await prisma.notification.create({
         data: {
           userId: uId,
           type: "WEEKLY_REWARD",
           data: JSON.stringify({ message: `شما مقام ${i+1} را در رده بندی هفتگی کسب کردید و ${days} روز اشتراک VIP هدیه گرفتید!`, rank: i+1, daysVIP: days, showModal: true }),
           isRead: false
         }
       });
    }
  }

  static async getUserRank(userId: string) {
    const now = new Date();
    const nextMonday = new Date();
    nextMonday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7);
    nextMonday.setHours(0, 0, 0, 0);
    if (nextMonday <= now) nextMonday.setDate(nextMonday.getDate() + 7);

    const startOfWeek = new Date(nextMonday.getTime() - 7 * 24 * 60 * 60 * 1000);

    const allLogs = await prisma.xPLog.groupBy({
      by: ['userId'],
      _sum: { amount: true },
      where: { timestamp: { gte: startOfWeek } },
      orderBy: { _sum: { amount: 'desc' } }
    });

    const index = allLogs.findIndex(l => l.userId === userId);
    const profile = await prisma.profile.findUnique({ where: { userId } });

    const rank = index === -1 ? allLogs.length + 1 : index + 1;
    const myPoints = index === -1 ? 0 : (allLogs[index]._sum.amount || 0);

    // Points to reach top 10
    let pointsToTop10 = 0;
    if (rank > 10 && allLogs.length >= 10) {
      pointsToTop10 = ((allLogs[9]._sum.amount || 0) - myPoints) + 1;
    }

    return {
      rank,
      points: myPoints,
      level: profile?.level || 1,
      pointsToTop10: Math.max(0, pointsToTop10)
    };
  }
}
