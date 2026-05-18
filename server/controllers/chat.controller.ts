import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.ts";
import prisma from "../utils/prisma.ts";

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

      // Format for frontend
      const formatted = messages.reverse().map(m => ({
        id: m.id.toString(),
        text: m.content,
        timestamp: m.createdAt.toISOString(),
        senderId: m.senderId,
        senderName: m.sender.profile?.displayName || m.sender.username,
        senderAvatar: m.sender.profile?.avatarUrl,
        senderLevel: m.sender.profile?.level || 1,
        badges: m.sender.badges.map(usb => ({ ...usb.badge, isPinned: usb.isPinned })),
        self: m.senderId === userId,
        targetId: m.channelId || m.lobbyId || m.receiverId,
        targetType: type,
        replyTo: m.replyTo ? {
          id: m.replyTo.id.toString(),
          user: m.replyTo.sender.profile?.displayName || m.replyTo.sender.username,
          text: m.replyTo.content
        } : undefined
      }));

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
}
