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
        isMuted: f.isMuted,
        avatarUrl: friend.profile?.avatarUrl,
        bannerUrl: friend.profile?.bannerUrl,
        membership: friend.profile?.membershipType,
        vipMetadata: friend.profile?.vipMetadata ? JSON.parse(friend.profile.vipMetadata.toString()) : undefined,
        level: friend.profile?.level || 1
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
    const friendRequests = await prisma.friendship.findMany({
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

    const eliteInvites = await prisma.notification.findMany({
      where: {
        userId,
        type: "ELITE_INVITE"
      },
      include: {
        user: { include: { profile: true } }
      }
    });

    const formattedFriendReqs = friendRequests.map(r => {
      const isIncoming = r.targetId === userId;
      const otherUser = isIncoming ? r.requester : r.target;
      return {
        id: r.id,
        userId: otherUser.id,
        username: otherUser.username,
        displayName: otherUser.profile?.displayName || otherUser.username,
        reqType: "friend",
        type: isIncoming ? "incoming" : "outgoing",
        createdAt: r.createdAt,
        avatarUrl: otherUser.profile?.avatarUrl,
        bannerUrl: otherUser.profile?.bannerUrl,
        membership: otherUser.profile?.membershipType,
        vipMetadata: otherUser.profile?.vipMetadata ? JSON.parse(otherUser.profile.vipMetadata.toString()) : undefined,
        level: otherUser.profile?.level || 1
      };
    });

    const formattedEliteReqs = eliteInvites.map(n => {
      const parsedData = JSON.parse(n.data || "{}");
      return {
        id: n.id,
        userId: "elite-group",
        username: "Elite Group",
        displayName: parsedData.groupName || "گروه نخبگان",
        reqType: "elite_invite", // Important to distinguish
        type: "incoming",
        createdAt: n.createdAt,
        avatarUrl: parsedData.avatarUrl || "",
        bannerUrl: undefined,
        membership: "VIP",
        vipMetadata: undefined,
        level: 1,
        channelId: n.referenceId
      };
    });

    return [...formattedFriendReqs, ...formattedEliteReqs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  static async getFriendActivities(userId: string) {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: "ACCEPTED" },
          { targetId: userId, status: "ACCEPTED" }
        ]
      }
    });

    const friendIds = friendships.map(f => f.requesterId === userId ? f.targetId : f.requesterId);

    const activities = await prisma.activity.findMany({
      where: { userId: { in: friendIds } },
      include: { user: { select: { id: true, username: true, profile: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return activities;
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
