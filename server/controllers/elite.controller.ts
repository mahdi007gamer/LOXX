import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import prisma from "../utils/prisma";

export class EliteGroupController {
  
  static async createGroup(req: AuthenticatedRequest, res: Response) {
    try {
      const { title } = req.body;
      const userId = req.user!.userId;

      // Check if user is VIP
      const profile = await prisma.profile.findUnique({ where: { userId } });
      if (profile?.membershipType !== "VIP") {
        return res.status(403).json({ status: "error", error: { message: "Only VIP users can create Elite groups" } });
      }

      const groupCount = await prisma.channel.count({
        where: { ownerId: userId, type: "ELITE" }
      });

      if (groupCount >= 3) {
        return res.status(400).json({ status: "error", error: { message: "شما نمی‌توانید بیش از ۳ گروه نخبگان بسازید" } });
      }

      const channel = await prisma.channel.create({
        data: {
          title,
          type: "ELITE",
          ownerId: userId,
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
        include: { members: true }
      });

      if (!channel || channel.type !== "ELITE") {
        return res.status(404).json({ status: "error", error: { message: "گروه یافت نشد" } });
      }

      if (channel.ownerId !== userId) {
        return res.status(403).json({ status: "error", error: { message: "شما مدیر این گروه نیستید" } });
      }

      if (channel.members.length >= 10) {
        return res.status(400).json({ status: "error", error: { message: "گروه نمی‌تواند بیش از ۱۰ عضو داشته باشد" } });
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
}
