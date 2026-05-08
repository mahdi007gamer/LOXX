import prisma from "../utils/prisma.ts";
import argon2 from "argon2";

export class UserService {
  static async getMe(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });
  }

  static async getProfileByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      include: { profile: true }
    });
  }

  static async updateProfile(userId: string, data: any) {
    return prisma.profile.update({
      where: { userId },
      data: {
        displayName: data.display_name,
        bio: data.bio,
        region: data.region,
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

    return {
      joinedAt: user?.createdAt,
      lobbiesCount: user?.profile?.totalLobbiesJoined || 0,
      friendsCount,
      gamesCount: user?._count.userGames || 0,
      xp: user?.profile?.xp || 0,
      level: user?.profile?.level || 1,
      unreadNotifications: user?._count.notifications || 0
    };
  }

  static async toggleGame(userId: string, gameId: string) {
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
      return { added: true };
    }
  }

  static async getMyGames(userId: string) {
    return prisma.userGame.findMany({
      where: { userId },
      include: { game: true }
    });
  }
}
