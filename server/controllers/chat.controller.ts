import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.ts";
import prisma from "../utils/prisma.ts";

function isMessageMediaIncomplete(content: string | null | undefined): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  if (trimmed === "") return true;

  if (trimmed.includes("[IMAGE]:")) {
    const parts = trimmed.split("[IMAGE]:");
    const mediaUrl = parts[parts.length - 1]?.trim();
    if (!mediaUrl || mediaUrl.length < 5) {
      return true;
    }
  }

  if (trimmed.includes("[GIF]:")) {
    const parts = trimmed.split("[GIF]:");
    const mediaUrl = parts[parts.length - 1]?.trim();
    if (!mediaUrl || mediaUrl.length < 5) {
      return true;
    }
  }
  return false;
}

export class ChatController {
  static async getMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { type, limit = 50, before } = req.query;
      const userId = req.user!.userId;

      let where: any = {};

      if (type === 'channel') {
        where = { channelId: id };
      } else if (type === 'lobby') {
        where = { lobbyId: id };
      } else if (type === 'user') {
        // Direct Messages: messages between me and the target user
        where = {
          OR: [
            { senderId: userId, receiverId: id },
            { senderId: id, receiverId: userId }
          ]
        };
      } else {
        return res.status(400).json({ status: "error", error: { message: "Invalid chat type" } });
      }

      if (before) {
        where.id = { lt: parseInt(before as string) };
      }

      const messages = await prisma.message.findMany({
        where,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            include: {
              profile: true,
              badges: {
                include: { badge: true }
              }
            }
          },
          replyTo: {
            include: {
              sender: {
                include: { profile: true }
              }
            }
          }
        }
      });

      // Filter and delete corrupt messages
      const corruptIds: number[] = [];
      const validMessages = messages.filter(m => {
        if (isMessageMediaIncomplete(m.content)) {
          corruptIds.push(m.id);
          return false;
        }
        return true;
      });

      if (corruptIds.length > 0) {
        prisma.message.deleteMany({
          where: { id: { in: corruptIds } }
        }).catch(err => console.error("Failed to delete corrupt database messages:", err));
      }

      // Format for frontend
      const formatted = validMessages.map(m => ({
        id: m.id.toString(),
        from: {
          userId: m.sender.id,
          username: m.sender.username,
          membership: m.sender.profile?.membershipType || "NONE",
          level: m.sender.profile?.level || 1,
          avatar: m.sender.profile?.avatarUrl,
          bannerUrl: m.sender.profile?.bannerUrl,
          vipMetadata: m.sender.profile?.vipMetadata,
          badges: m.sender.badges.map(ub => ({ ...ub.badge, isPinned: ub.isPinned }))
        },
        targetType: type,
        targetId: m.channelId || m.lobbyId || m.receiverId,
        content: m.isDeleted ? "این پیام حذف شده است." : m.content,
        isDeleted: m.isDeleted,
        createdAt: m.createdAt.getTime(),
        replyToId: m.replyToId ? m.replyToId.toString() : undefined,
        replyTo: m.replyTo ? {
          id: m.replyTo.id.toString(),
          user: m.replyTo.sender.username,
          text: m.replyTo.isDeleted ? "این پیام حذف شده است." : m.replyTo.content
        } : undefined,
        reactions: m.reactions ? JSON.parse(m.reactions as string) : []
      })).reverse();

      res.json({ status: "success", data: formatted });
    } catch (error: any) {
      console.error("Fetch messages error:", error);
      res.status(500).json({ status: "error", error: { message: error.message } });
    }
  }

  static async getRecentDms(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      
      // Find latest message for each conversation
      // This is slightly complex in Prisma, so we'll fetch recent messages and filter in memory for now
      // Or use direct raw query if needed. Let's start simple.
      
      const recentMessages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: { not: null } },
            { receiverId: userId }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          sender: { include: { profile: true } },
          receiver: { include: { profile: true } }
        }
      });

      const dialogues = new Map();
      recentMessages.forEach(m => {
        const otherId = m.senderId === userId ? m.receiverId : m.senderId;
        if (!otherId || dialogues.has(otherId)) return;
        
        const otherUser = m.senderId === userId ? m.receiver : m.sender;
        dialogues.set(otherId, {
          userId: otherId,
          username: otherUser?.username,
          displayName: otherUser?.profile?.displayName,
          avatarUrl: otherUser?.profile?.avatarUrl,
          lastMessage: m.content,
          lastTime: m.createdAt,
          unread: false // Should be implemented with a separate counter
        });
      });

      res.json({ status: "success", data: Array.from(dialogues.values()) });
    } catch (error: any) {
      res.status(500).json({ status: "error", error: { message: error.message } });
    }
  }

  static async getUnreadCounts(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { readStates = {} } = req.body;

      const userGames = await prisma.userGame.findMany({
        where: { userId }
      });
      const gameChannelIds = userGames.map(ug => ug.gameId);
      const channelIds = ["general", "news", ...gameChannelIds];

      const counts: Record<string, number> = {};

      await Promise.all(channelIds.map(async (cid) => {
        const lastReadId = readStates[cid] ? parseInt(String(readStates[cid])) : 0;
        
        if (lastReadId === 0) {
          counts[cid] = 0;
          return;
        }

        const count = await prisma.message.count({
          where: { 
            channelId: cid,
            id: { gt: lastReadId }
          }
        });
        counts[cid] = count;
      }));

      res.json({ status: "success", data: counts });
    } catch (error: any) {
      console.error("Failed to get unread counts:", error);
      res.status(500).json({ status: "error", error: { message: error.message } });
    }
  }
}
