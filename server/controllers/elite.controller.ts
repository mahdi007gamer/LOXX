import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import prisma from "../utils/prisma";

export class EliteGroupController {
  
  static async createGroup(req: AuthenticatedRequest, res: Response) {
    try {
      const { title } = req.body;
      const userId = req.user!.userId;

      // Check if user is VIP or PLUS
      const profile = await prisma.profile.findUnique({ where: { userId } });
      const membership = profile?.membershipType || "STANDARD";
      
      if (membership !== "VIP" && membership !== "PLUS") {
        return res.status(403).json({ status: "error", error: { message: "فقط کاربران PLUS و VIP می‌توانند گروه بسازند" } });
      }

      const groupCount = await prisma.channel.count({
        where: { ownerId: userId, type: "ELITE" }
      });

      if (groupCount >= (membership === "VIP" ? 5 : 2)) {
        return res.status(400).json({ status: "error", error: { message: "شما به سقف مجاز ساخت گروه رسیده‌اید" } });
      }

      const channel = await prisma.channel.create({
        data: {
          title,
          type: "ELITE",
          ownerId: userId,
          inviteCode: membership === "VIP" ? Math.random().toString(36).substring(2, 10) : null,
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
      if (!channel || channel.type !== "ELITE") {
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

      if (!channel || channel.type !== "ELITE") {
        return res.status(404).json({ status: "error", error: { message: "گروه یافت نشد" } });
      }

      if (channel.ownerId !== userId) {
        return res.status(403).json({ status: "error", error: { message: "شما مدیر این گروه نیستید" } });
      }

      const membership = channel.owner?.profile?.membershipType || "PLUS";
      const maxMembers = membership === "VIP" ? 50 : 5;

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
          await prisma.notification.create({
            data: {
              userId: targetUser.id,
              type: "ELITE_INVITE",
              senderId: userId,
              referenceId: channel.id,
              data: JSON.stringify({ groupName: channel.title, avatarUrl: channel.avatarUrl })
            }
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

      const membership = channel.owner?.profile?.membershipType || "PLUS";
      const maxMembers = membership === "VIP" ? 50 : 5;

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
      if (!channel || channel.type !== "ELITE") {
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
          type: "ELITE",
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

      if (!channel || channel.type !== "ELITE") {
        return res.status(404).json({ status: "error", error: { message: "گروه یافت نشد" } });
      }

      if (channel.ownerId !== userId) {
        return res.status(403).json({ status: "error", error: { message: "شما مدیر این گروه نیستید" } });
      }

      const membership = channel.owner?.profile?.membershipType || "PLUS";
      const maxMembers = membership === "VIP" ? 50 : 5;

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

      if (!channel || channel.type !== "ELITE") {
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
       if (!channel || channel.type !== "ELITE") return res.status(404).json({ status: "error", error: { message: "گروه یافت نشد" } });
       
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

      if (!channel || channel.type !== "ELITE") {
        return res.status(404).json({ status: "error", error: { message: "گروه یافت نشد" } });
      }

      if (channel.ownerId !== userId) {
        return res.status(403).json({ status: "error", error: { message: "شما مدیر این گروه نیستید" } });
      }

      if (channel.owner?.profile?.membershipType !== "VIP") {
        return res.status(403).json({ status: "error", error: { message: "فقط کاربران VIP می‌توانند لینک دعوت بسازند" } });
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

      const channel = await prisma.channel.findUnique({
        where: { inviteCode, type: "ELITE" },
        include: { members: true }
      });

      if (!channel) {
         return res.status(404).json({ status: "error", error: { message: "لینک دعوت نامعتبر است" } });
      }

      if (channel.members.some(m => m.userId === userId)) {
         return res.json({ status: "success", message: "شما از قبل عضو گروه هستید", data: { groupId: channel.id } });
      }

      if (channel.members.length >= 50) {
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
}
