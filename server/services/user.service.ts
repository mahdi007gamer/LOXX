import prisma from "../utils/prisma.ts";
import argon2 from "argon2";

export class UserService {
  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        badges: {
          include: { badge: true }
        },
        subscriptions: {
          orderBy: { expiresAt: "desc" },
          take: 1
        },
        _count: {
          select: {
            hostedLobbies: true,
            lobbyMembers: true,
            sentFriendReq: { where: { status: "ACCEPTED" } },
            recvFriendReq: { where: { status: "ACCEPTED" } }
          }
        }
      }
    });

    if (!user) return null;

    // Check for expired subscription
    const membership = await this.checkAndFixMembership(user.id, user.profile?.membershipType || "NONE", user.subscriptions[0]?.expiresAt || null);

    const friendsCount = (user._count.sentFriendReq || 0) + (user._count.recvFriendReq || 0);
    const labsJoined = user.profile?.totalLobbiesJoined || 0;
    const labsCreated = user._count.hostedLobbies || 0;
    const daysSinceJoin = Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    return {
      ...user,
      profile: {
        ...user.profile,
        membershipType: membership.type
      },
      badges: user.badges.map(ub => ({
        ...ub.badge,
        isPinned: ub.isPinned,
        earnedAt: ub.earnedAt
      })),
      stats: {
        friendsCount,
        lobbiesJoined: labsJoined,
        lobbiesCreated: labsCreated,
        daysSinceJoin,
        membershipExpiresAt: membership.expiresAt
      }
    };
  }

  private static async checkAndFixMembership(userId: string, currentType: string, expiresAt: Date | null) {
    if (currentType !== "NONE" && expiresAt) {
      if (new Date(expiresAt) < new Date()) {
        await prisma.profile.update({
          where: { userId },
          data: { 
            membershipType: "NONE",
            vipMetadata: null
          }
        });
        return { type: "NONE", expiresAt };
      }
    }
    return { type: currentType, expiresAt };
  }

  static async getProfileByUsername(identifier: string) {
    // Try to find by username, ID, or Display Name
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { id: identifier },
          { profile: { displayName: identifier } }
        ]
      },
      include: {
        profile: true,
        badges: {
          include: { badge: true }
        },
        subscriptions: {
          orderBy: { expiresAt: "desc" },
          take: 1
        },
        _count: {
          select: {
            hostedLobbies: true,
            lobbyMembers: true,
            sentFriendReq: { where: { status: "ACCEPTED" } },
            recvFriendReq: { where: { status: "ACCEPTED" } }
          }
        }
      }
    });

    if (!user) return null;

    // Check expiry for others viewing this profile too
    const membership = await this.checkAndFixMembership(user.id, user.profile?.membershipType || "NONE", user.subscriptions[0]?.expiresAt || null);

    const friendsCount = (user._count.sentFriendReq || 0) + (user._count.recvFriendReq || 0);
    const labsJoined = user.profile?.totalLobbiesJoined || 0;
    const labsCreated = user._count.hostedLobbies || 0;
    const daysSinceJoin = Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    return {
      ...user,
      profile: {
        ...user.profile,
        membershipType: membership.type
      },
      badges: user.badges.map(ub => ({
        ...ub.badge,
        isPinned: ub.isPinned,
        earnedAt: ub.earnedAt
      })),
      stats: {
        friendsCount,
        lobbiesJoined: labsJoined,
        lobbiesCreated: labsCreated,
        daysSinceJoin
      }
    };
  }

  static async updateProfile(userId: string, data: any) {
    if (data.pinnedBadges) {
      await prisma.userBadge.updateMany({
        where: { userId },
        data: { isPinned: false }
      });
      await prisma.userBadge.updateMany({
        where: { userId, badgeId: { in: data.pinnedBadges } },
        data: { isPinned: true }
      });
    }

    if (data.badge_pins) {
      const { badgeId, isPinned } = data.badge_pins;
      await prisma.userBadge.update({
        where: { userId_badgeId: { userId, badgeId } },
        data: { isPinned }
      });
    }
    return prisma.profile.update({
      where: { userId },
      data: {
        displayName: data.displayName || data.display_name,
        bio: data.bio,
        region: data.region,
        avatarUrl: data.avatarUrl,
        bannerUrl: data.bannerUrl,
        vipMetadata: typeof data.vipMetadata === "object" ? JSON.stringify(data.vipMetadata) : data.vipMetadata,
        lastActivity: new Date()
      }
    });
  }

  static async changePassword(userId: string, current: string, next: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const valid = await argon2.verify(user.passwordHash, current);
    if (!valid) throw new Error("رمز عبور فعلی اشتباه است");

    const hashedPassword = await argon2.hash(next);
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword }
    });
  }

  static async getDashboardStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        profile: true,
        subscriptions: {
          orderBy: { expiresAt: "desc" },
          take: 1
        },
        _count: {
          select: {
            sentFriendReq: { where: { status: "ACCEPTED" } },
            recvFriendReq: { where: { status: "ACCEPTED" } },
            lobbyMembers: true,
            userGames: true,
            notifications: { where: { isRead: false } }
          }
        }
      }
    });

    const friendsCount = (user?._count.sentFriendReq || 0) + (user?._count.recvFriendReq || 0);
    const expiresAt = user?.subscriptions[0]?.expiresAt || null;

    return {
      joinedAt: user?.createdAt,
      lobbiesCount: user?.profile?.totalLobbiesJoined || 0,
      friendsCount,
      gamesCount: user?._count.userGames || 0,
      xp: user?.profile?.xp || 0,
      level: user?.profile?.level || 1,
      unreadNotifications: user?._count.notifications || 0,
      membershipExpiresAt: expiresAt
    };
  }

  static async toggleGame(userId: string, gameId: string) {
    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) throw new Error("Game not found");

    const existing = await prisma.userGame.findUnique({
      where: { userId_gameId: { userId, gameId } }
    });

    if (existing) {
      await prisma.userGame.delete({
        where: { userId_gameId: { userId, gameId } }
      });
      return { added: false };
    } else {
      await prisma.userGame.create({
        data: { userId, gameId }
      });

      if (game.badgeId) {
        const badgeExists = await prisma.userBadge.findUnique({
          where: { userId_badgeId: { userId, badgeId: game.badgeId } }
        });
        if (!badgeExists) {
          await prisma.userBadge.create({
            data: { userId, badgeId: game.badgeId }
          });
        }
      }

      return { added: true };
    }
  }

  static async getTotalCount() {
    return prisma.user.count();
  }

  static async getMyGames(userId: string) {
    return prisma.userGame.findMany({
      where: { userId },
      include: { game: true }
    });
  }
}
