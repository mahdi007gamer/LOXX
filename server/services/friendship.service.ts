import prisma from "../utils/prisma.js";

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
      return {
        userId: friend.id,
        username: friend.username,
        displayName: friend.profile?.displayName,
        status: "offline", // Default, updated via WebSocket
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
        targetId: userId,
        status: "PENDING"
      },
      include: {
        requester: { include: { profile: true } }
      }
    });

    return requests.map(r => ({
      id: r.id,
      senderId: r.requesterId,
      senderUsername: r.requester.username,
      senderDisplayName: r.requester.profile?.displayName,
      createdAt: r.createdAt
    }));
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
}
