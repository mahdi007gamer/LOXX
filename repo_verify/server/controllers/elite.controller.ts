import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import prisma from "../utils/prisma";

import { emitNotification } from "../utils/socket.ts";

export class EliteGroupController {
  
  static async createGroup(req: AuthenticatedRequest, res: Response) {
    try {
      const { title } = req.body;
      const userId = req.user!.userId;

      // Check if user is VIP or PLUS
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      });
      const membership = user?.profile?.membershipType || "NONE";
      const role = user?.role || "USER";

      const isVIP = membership === "VIP" || role === "ADMIN" || role === "STREAMER";
      const isPlus = membership === "PLUS";

      // Max groups allowed to create
      const maxGroupsAllowed = isVIP ? 2 : 1;

      // Count current owned groups (ELITE & PRO both are groups)
      const ownedCount = await prisma.channel.count({
        where: {
          ownerId: userId,
          type: { in: ["ELITE", "PRO"] }
        }
      });

      if (ownedCount >= maxGroupsAllowed) {
        if (isPlus) {
          return res.status(403).json({ 
            status: "error", 
            error: { message: "کاربران PLUS حداکثر می‌توانند ۱ گروه بسازند" } 
          });
        } else if (isVIP) {
          return res.status(403).json({ 
            status: "error", 
            error: { message: "کاربران VIP حداکثر می‌توانند ۲ گروه بسازند" } 
          });
        } else {
          return res.status(403).json({ 
            status: "error", 
            error: { message: "کاربران معمولی حداکثر می‌توانند ۱ گروه بسازند. برای ایجاد گروه‌های بیشتر، اشتراک تهیه کنید." } 
          });
        }
      }

      const channelType = isVIP ? "ELITE" : "PRO";

      const channel = await prisma.channel.create({
        data: {
          title,
          type: channelType,
          ownerId: userId,
          inviteCode: true ? Math.random().toString(36).substring(2, 10) : null,
          members: {
            create: {
              userId,
              role: "OWNER"
            }
          }
        }
      });

      res.json({ status: "success", data: channel });
    } catch (err: any) {
      res.status(500).json({ status: "error", error: { message: err.message } });
    }
  }

  static async updateGroup(req: AuthenticatedRequest, res: Response) {
    try {
      const { groupId } = req.params;
      const { title, avatarUrl } = req.body;
      const userId = req.user!.userId;

      const channel = await prisma.channel.findUnique({ where: { id: groupId } });
      if (!channel || (channel.type !== "ELITE" && channel.type !== "PRO")) {
        return res.status(404).json({ status: "error", error: { message: "گروه یافت نشد" } });
      }

      if (channel.ownerId !== userId) {
        return res.status(403).json({ status: "error", error: { message: "شما مدیر این گروه نیستید" } });
      }

      const updated = await prisma.channel.update({
        where: { id: groupId },
        data: {
          ...(title && { title }),
          ...(avatarUrl !== undefined && { avatarUrl }),
        }
      });

      res.json({ status: "success", data: updated });
    } catch (err: any) {
      res.status(500).json({ status: "error", error: { message: err.message } });
    }
  }

  static async inviteMember(req: AuthenticatedRequest, res: Response) {
    try {
      const { groupId, userIds } = req.body;
      const userId = req.user!.userId;

      const channel = await prisma.channel.findUnique({
        where: { id: groupId },
        include: { 
          members: true,
          owner: { include: { profile: true } }
        }
      });

      if (!channel || (channel.type !== "ELITE" && channel.type !== "PRO")) {
        return res.status(404).json({ status: "error", error: { message: "گروه یافت نشد" } });
      }

      if (channel.ownerId !== userId) {
        return res.status(403).json({ status: "error", error: { message: "شما مدیر این گروه نیستید" } });
      }

      const membership = channel.owner?.profile?.membershipType || "NONE";
      const ownerRole = channel.owner?.role || "USER";

      const isVIP = membership === "VIP" || ownerRole === "ADMIN" || ownerRole === "STREAMER";
      const isPlus = membership === "PLUS";

      const maxMembers = isVIP ? 100 : (isPlus ? 50 : 10);

      if (channel.members.length + (userIds?.length || 1) > maxMembers) {
        return res.status(400).json({ status: "error", error: { message: `این گروه نمی‌تواند بیش از ${maxMembers} عضو داشته باشد` } });
      }

      const targetUsers = await prisma.user.findMany({ where: { id: { in: userIds } } });
      if (!targetUsers.length) {
        return res.status(404).json({ status: "error", error: { message: "کاربری یافت نشد" } });
      }

      for (const targetUser of targetUsers) {
        if (channel.members.some(m => m.userId === targetUser.id)) {
           continue;
        }

        // Check if they are friends
        const isFriend = await prisma.friendship.findFirst({
          where: {
            status: "ACCEPTED",
            OR: [
              { requesterId: userId, targetId: targetUser.id },
              { requesterId: targetUser.id, targetId: userId }
            ]
          }
        });

        if (isFriend) {
          // Create a notification
          const notif = await prisma.notification.create({
            data: {
              userId: targetUser.id,
              type: "ELITE_INVITE",
              senderId: userId,
              referenceId: channel.id,
              data: JSON.stringify({ groupName: channel.title, avatarUrl: channel.avatarUrl })
            }
          });
          emitNotification(targetUser.id, "GROUP_INVITE", {
            message: `شما به گروه ${channel.title} دعوت شدید`,
            channelId: channel.id
          });
        }
      }

      res.json({ status: "success", message: "دعوتنامه‌ها ارسال شدند" });
    } catch (err: any) {
      res.status(500).json({ status: "error", error: { message: err.message } });
    }
  }

  static async acceptInvite(req: AuthenticatedRequest, res: Response) {
    try {
      const { notificationId } = req.body;
      const userId = req.user!.userId;

      const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
      if (!notification || notification.userId !== userId || notification.type !== "ELITE_INVITE") {
        return res.status(404).json({ status: "error", error: { message: "دعوتنامه یافت نشد" } });
      }

      const channelId = notification.referenceId!;
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: { 
          members: true,
          owner: { include: { profile: true } }
        }
      });

      if (!channel) {
        return res.status(404).json({ status: "error", error: { message: "گروه تخریب شده است" } });
      }

      const membership = channel.owner?.profile?.membershipType || "NONE";
      const ownerRole = channel.owner?.role || "USER";

      const isVIP = membership === "VIP" || ownerRole === "ADMIN" || ownerRole === "STREAMER";
      const isPlus = membership === "PLUS";

      const maxMembers = isVIP ? 100 : (isPlus ? 50 : 10);

      if (channel.members.length >= maxMembers) {
        return res.status(400).json({ status: "error", error: { message: "ظرفیت گروه پر شده است" } });
      }

      if (!channel.members.some(m => m.userId === userId)) {
        await prisma.channelMember.create({
          data: { channelId, userId, role: "MEMBER" }
        });
      }

      // Delete the notification
      await prisma.notification.delete({ where: { id: notificationId } });

      res.json({ status: "success", message: "شما با موفقیت به گروه پیوستید" });
    } catch(err: any) {
      res.status(500).json({ status: "error", error: { message: err.message } });
    }
  }

  static async leaveGroup(req: AuthenticatedRequest, res: Response) {
    try {
      const { groupId } = req.body;
      const userId = req.user!.userId;

      const channel = await prisma.channel.findUnique({ where: { id: groupId } });
      if (!channel || (channel.type !== "ELITE" && channel.type !== "PRO")) {
         return res.status(404).json({ status: "error", error: { message: "گروه یافت نشد" } });
      }

      if (channel.ownerId === userId) {
         return res.status(400).json({ status: "error", error: { message: "شما مدیر گروه هستید، فقط می‌توانید گروه را حذف کنید" } });
      }

      await prisma.channelMember.delete({
         where: { channelId_userId: { channelId: groupId, userId } }
      });

      res.json({ status: "success", message: "با موفقیت از گروه خارج شدید" });
    } catch(err: any) {
      res.status(500).json({ status: "error", error: { message: err.message } });
    }
  }

  static async getGroups(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const channels = await prisma.channel.findMany({
        where: {
          type: { in: ["ELITE", "PRO"] },
          members: { some: { userId } }
        },
        include: {
          members: { include: { user: { include: { profile: true } } } }
        }
      });
      res.json({ status: "success", data: channels });
    } catch (err: any) {
      res.status(500).json({ status: "error", error: { message: err.message } });
    }
  }

  static async addMember(req: AuthenticatedRequest, res: Response) {
    try {
      const { groupId, username } = req.body;
      const userId = req.user!.userId;

      const channel = await prisma.channel.findUnique({
        where: { id: groupId },
        include: { 
          members: true,
          owner: { include: { profile: true } }
        }
      });

      if (!channel || (channel.type !== "ELITE" && channel.type !== "PRO")) {
        return res.status(404).json({ status: "error", error: { message: "گروه یافت نشد" } });
      }

      if (channel.ownerId !== userId) {
        return res.status(403).json({ status: "error", error: { message: "شما مدیر این گروه نیستید" } });
      }

      const membership = channel.owner?.profile?.membershipType || "NONE";
      const ownerRole = channel.owner?.role || "USER";

      const isVIP = membership === "VIP" || ownerRole === "ADMIN" || ownerRole === "STREAMER";
      const isPlus = membership === "PLUS";

      const maxMembers = isVIP ? 100 : (isPlus ? 50 : 10);

      if (channel.members.length >= maxMembers) {
        return res.status(400).json({ status: "error", error: { message: `گروه نمی‌تواند بیش از ${maxMembers} عضو داشته باشد` } });
      }

      const targetUser = await prisma.user.findUnique({ where: { username } });
      if (!targetUser) {
        return res.status(404).json({ status: "error", error: { message: "کاربر یافت نشد" } });
      }

      if (channel.members.some(m => m.userId === targetUser.id)) {
        return res.status(400).json({ status: "error", error: { message: "کاربر از قبل در گروه وجود دارد" } });
      }

      await prisma.channelMember.create({
        data: { channelId: groupId, userId: targetUser.id, role: "MEMBER" }
      });

      res.json({ status: "success", message: "عضو با موفقیت اضافه شد" });
    } catch (err: any) {
      res.status(500).json({ status: "error", error: { message: err.message } });
    }
  }

  static async removeMember(req: AuthenticatedRequest, res: Response) {
    try {
      const { groupId, memberId } = req.body;
      const userId = req.user!.userId;

      const channel = await prisma.channel.findUnique({
        where: { id: groupId },
        include: { members: true }
      });

      if (!channel || (channel.type !== "ELITE" && channel.type !== "PRO")) {
         return res.status(404).json({ status: "error", error: { message: "گروه یافت نشد" } });
      }

      if (channel.ownerId !== userId) {
         return res.status(403).json({ status: "error", error: { message: "شما مدیر این گروه نیستید" } });
      }

      if (memberId === userId) {
         return res.status(400).json({ status: "error", error: { message: "شما نمی‌توانید خود را حذف کنید" } });
      }

      await prisma.channelMember.delete({
         where: { channelId_userId: { channelId: groupId, userId: memberId } }
      });

      res.json({ status: "success", message: "عضو با موفقیت حذف شد" });
    } catch(err: any) {
      res.status(500).json({ status: "error", error: { message: err.message } });
    }
  }

  static async deleteGroup(req: AuthenticatedRequest, res: Response) {
     try {
       const { groupId } = req.params;
       const userId = req.user!.userId;

       const channel = await prisma.channel.findUnique({ where: { id: groupId } });
       if (!channel || (channel.type !== "ELITE" && channel.type !== "PRO")) return res.status(404).json({ status: "error", error: { message: "گروه یافت نشد" } });
       
       if (channel.ownerId !== userId) return res.status(403).json({ status: "error", error: { message: "شما مدیر این گروه نیستید" } });

       await prisma.channel.delete({ where: { id: groupId } });
       res.json({ status: "success", message: "گروه با موفقیت حذف شد" });
     } catch(err: any) {
       res.status(500).json({ status: "error", error: { message: err.message } });
     }
  }

  static async regenerateInviteLink(req: AuthenticatedRequest, res: Response) {
    try {
      const { groupId } = req.params;
      const userId = req.user!.userId;

      const channel = await prisma.channel.findUnique({
        where: { id: groupId },
        include: { owner: { include: { profile: true } } }
      });

      if (!channel || (channel.type !== "ELITE" && channel.type !== "PRO")) {
        return res.status(404).json({ status: "error", error: { message: "گروه یافت نشد" } });
      }

      if (channel.ownerId !== userId) {
        return res.status(403).json({ status: "error", error: { message: "شما مدیر این گروه نیستید" } });
      }

      const newInviteCode = Math.random().toString(36).substring(2, 10);
      await prisma.channel.update({
        where: { id: groupId },
        data: { inviteCode: newInviteCode }
      });

      res.json({ status: "success", data: { inviteCode: newInviteCode } });
    } catch(err: any) {
      res.status(500).json({ status: "error", error: { message: err.message } });
    }
  }

  static async joinViaInviteLink(req: AuthenticatedRequest, res: Response) {
    try {
      const { inviteCode } = req.body;
      const userId = req.user!.userId;

      const channel = await prisma.channel.findFirst({
        where: { inviteCode, type: { in: ["ELITE", "PRO"] } },
        include: { members: true, owner: { include: { profile: true } } }
      });

      if (!channel) {
         return res.status(404).json({ status: "error", error: { message: "لینک دعوت نامعتبر است" } });
      }

      const metadataObj = channel.metadata ? JSON.parse(channel.metadata) : {};
      if (metadataObj.bans?.includes(userId)) {
         return res.status(403).json({ status: "error", error: { message: "شما از این گروه اخراج شده‌اید و امکان بازگشت ندارید" } });
      }

      if (channel.members.some(m => m.userId === userId)) {
         return res.json({ status: "success", message: "شما از قبل عضو گروه هستید", data: { groupId: channel.id } });
      }

      const membershipType = channel.owner?.profile?.membershipType || "NONE";
      const ownerRole = channel.owner?.role || "USER";

      const isOwnerVIP = membershipType === "VIP" || ownerRole === "ADMIN" || ownerRole === "STREAMER";
      const isOwnerPlus = membershipType === "PLUS";

      const maxMembers = isOwnerVIP ? 100 : (isOwnerPlus ? 50 : 10);

      if (channel.members.length >= maxMembers) {
         return res.status(400).json({ status: "error", error: { message: "ظرفیت گروه پر شده است" } });
      }

      await prisma.channelMember.create({
         data: { channelId: channel.id, userId, role: "MEMBER" }
      });

      res.json({ status: "success", message: "با موفقیت به گروه پیوستید", data: { groupId: channel.id } });
    } catch(err: any) {
      res.status(500).json({ status: "error", error: { message: err.message } });
    }
  }

  static async pinMessage(req: AuthenticatedRequest, res: Response) {
     try {
        const { groupId } = req.params;
        const { messageId } = req.body;
        const userId = req.user!.userId;

        const channel = await prisma.channel.findUnique({ where: { id: groupId } });
        if (!channel || channel.ownerId !== userId) {
            return res.status(403).json({ status: "error", error: { message: "شما دسترسی ندارید" } });
        }

        let metadataObj = channel.metadata ? JSON.parse(channel.metadata) : {};
        metadataObj.pinnedMessageId = messageId;
        
        await prisma.channel.update({
            where: { id: groupId },
            data: { metadata: JSON.stringify(metadataObj) }
        });

        res.json({ status: "success", message: "پیام با موفقیت سنجاق شد" });
     } catch (err: any) {
        res.status(500).json({ status: "error", error: { message: err.message } });
     }
  }

  static async timeoutMember(req: AuthenticatedRequest, res: Response) {
     try {
        const { groupId } = req.params;
        const { targetUserId, durationMinutes } = req.body;
        const userId = req.user!.userId;

        const channel = await prisma.channel.findUnique({ where: { id: groupId } });
        if (!channel || channel.ownerId !== userId) {
            return res.status(403).json({ status: "error", error: { message: "شما دسترسی ندارید" } });
        }

        let metadataObj = channel.metadata ? JSON.parse(channel.metadata) : {};
        if (!metadataObj.timeouts) metadataObj.timeouts = {};
        
        // maximum 100 minutes
        const minutes = Math.min(Number(durationMinutes) || 10, 100);
        const expireAt = Date.now() + (minutes * 60 * 1000);
        
        metadataObj.timeouts[targetUserId] = expireAt;

        await prisma.channel.update({
            where: { id: groupId },
            data: { metadata: JSON.stringify(metadataObj) }
        });

        res.json({ status: "success", message: `کاربر برای ${minutes} دقیقه معلق شد` });
     } catch (err: any) {
        res.status(500).json({ status: "error", error: { message: err.message } });
     }
  }

  static async banMember(req: AuthenticatedRequest, res: Response) {
     try {
        const { groupId } = req.params;
        const { targetUserId } = req.body;
        const userId = req.user!.userId;

        const channel = await prisma.channel.findUnique({ where: { id: groupId } });
        if (!channel || channel.ownerId !== userId) {
            return res.status(403).json({ status: "error", error: { message: "شما دسترسی ندارید" } });
        }

        let metadataObj = channel.metadata ? JSON.parse(channel.metadata) : {};
        if (!metadataObj.bans) metadataObj.bans = [];
        
        if (!metadataObj.bans.includes(targetUserId)) {
            metadataObj.bans.push(targetUserId);
        }

        // Kick them from the channel too
        await prisma.channelMember.deleteMany({
            where: { channelId: groupId, userId: targetUserId }
        });

        await prisma.channel.update({
            where: { id: groupId },
            data: { metadata: JSON.stringify(metadataObj) }
        });

        res.json({ status: "success", message: "کاربر از گروه بن شد" });
     } catch (err: any) {
        res.status(500).json({ status: "error", error: { message: err.message } });
     }
  }
}
