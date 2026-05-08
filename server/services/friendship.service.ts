import prisma from "../utils/prisma.ts";

export class FriendshipService {
  static async getFriends(userId: string) {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: "ACCEPTED" },
          { targetId: userId, status: "ACCEPTED" }
        ]
      },
      include: {
        requester: { include: { profile: true } },
        target: { include: { profile: true } }
      }
    });

    return friendships.map(f => {
      const friend = f.requesterId === userId ? f.target : f.requester;
      const isOnline = friend.profile?.lastActivity 
        ? (new Date().getTime() - new Date(friend.profile.lastActivity).getTime()) < 5 * 60 * 1000 
        : false;

      return {
        id: friend.id,
        username: friend.username,
        displayName: friend.profile?.displayName,
        status: isOnline ? "online" : "offline",
        activity: "Online",
        isFavorite: f.isFavorite,
        isMuted: f.isMuted
      };
    });
  }

  static async sendRequest(requesterId: string, targetId: string) {
    if (requesterId === targetId) throw new Error("Cannot add yourself");

    // Check if exists
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, targetId },
          { requesterId: targetId, targetId: requesterId }
        ]
      }
    });

    if (existing) throw new Error("Friendship already exists");

    return prisma.friendship.create({
      data: {
        requesterId,
        targetId,
        status: "PENDING"
      }
    });
  }

  static async getRequests(userId: string) {
    const requests = await prisma.friendship.findMany({
      where: {
        OR: [
          { targetId: userId, status: "PENDING" },
          { requesterId: userId, status: "PENDING" }
        ]
      },
      include: {
        requester: { include: { profile: true } },
        target: { include: { profile: true } }
      }
    });

    return requests.map(r => {
      const isIncoming = r.targetId === userId;
      const otherUser = isIncoming ? r.requester : r.target;
      return {
        id: r.id,
        userId: otherUser.id,
        username: otherUser.username,
        displayName: otherUser.profile?.displayName || otherUser.username,
        type: isIncoming ? "incoming" : "outgoing",
        createdAt: r.createdAt
      };
    });
  }

  static async sendRequestByUsername(requesterId: string, username: string) {
    const target = await prisma.user.findUnique({
      where: { username }
    });

    if (!target) throw new Error("کاربر یافت نشد");
    if (target.id === requesterId) throw new Error("نمی‌توانید به خودتان درخواست بدهید");

    // Check if exists
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, targetId: target.id },
          { requesterId: target.id, targetId: requesterId }
        ]
      }
    });

    if (existing) throw new Error("رابطه دوستی از قبل وجود دارد");

    return prisma.friendship.create({
      data: {
        requesterId,
        targetId: target.id,
        status: "PENDING"
      }
    });
  }

  static async respondRequest(userId: string, requestId: string, action: "ACCEPTED" | "BLOCKED" | "DECLINED") {
    if (action === "DECLINED") {
      return prisma.friendship.delete({ where: { id: requestId } });
    }

    return prisma.friendship.update({
      where: { id: requestId },
      data: { status: action }
    });
  }

  static async toggleFavorite(userId: string, targetId: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, targetId: targetId },
          { requesterId: targetId, targetId: userId }
        ]
      }
    });
    if (!friendship) throw new Error("Friendship not found");
    return prisma.friendship.update({
      where: { id: friendship.id },
      data: { isFavorite: !friendship.isFavorite }
    });
  }

  static async toggleMute(userId: string, targetId: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, targetId: targetId },
          { requesterId: targetId, targetId: userId }
        ]
      }
    });
    if (!friendship) throw new Error("Friendship not found");
    return prisma.friendship.update({
      where: { id: friendship.id },
      data: { isMuted: !friendship.isMuted }
    });
  }

  static async toggleBlock(userId: string, targetId: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, targetId: targetId },
          { requesterId: targetId, targetId: userId }
        ]
      }
    });
    if (!friendship) throw new Error("Friendship not found");
    const newStatus = friendship.status === "BLOCKED" ? "ACCEPTED" : "BLOCKED";
    return prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: newStatus }
    });
  }

  static async removeFriend(userId: string, targetId: string) {
    return prisma.friendship.deleteMany({
      where: {
        OR: [
          { requesterId: userId, targetId: targetId },
          { requesterId: targetId, targetId: userId }
        ]
      }
    });
  }
}
