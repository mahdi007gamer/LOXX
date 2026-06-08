import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.ts";
import prisma from "../utils/prisma.ts";

import { sendRealtimeWarning } from "../sockets/index.ts";

export class ReportController {
  static async myTickets(req: AuthenticatedRequest, res: Response) {
    try {
      const tickets = await prisma.report.findMany({
        where: { reporterId: req.user!.userId, targetType: 'TICKET' },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ status: "success", data: tickets });
    } catch (err: any) {
      res.status(500).json({ status: "error", error: { message: err.message } });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { reportedUserId, targetId, targetType, reason } = req.body;
      const reporterId = req.user!.userId;

      // Check if already reported
      const existing = await prisma.report.findFirst({
        where: targetType === 'TICKET' 
          ? { reporterId, targetType: "TICKET", status: "PENDING" }
          : { reporterId, targetId, targetType, status: "PENDING" }
      });

      if (existing) {
        return res.status(400).json({ status: "error", error: { message: "شما قبلاً این مورد را گزارش کرده‌اید." } });
      }

      await prisma.report.create({
        data: { reporterId, reportedUserId, targetId, targetType, reason }
      });

      res.json({ status: "success", message: "گزارش شما با موفقیت ثبت شد." });
    } catch (err: any) {
      if (err.code === 'P2002') {
        return res.status(400).json({ status: "error", error: { message: "شما قبلاً این مورد را گزارش کرده‌اید." } });
      }
      res.status(500).json({ status: "error", error: { message: err.message } });
    }
  }

  static async listAdminReports(req: AuthenticatedRequest, res: Response) {
    try {
      const reports = await prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { username: true } },
          reportedUser: { 
            include: { profile: true } 
          }
        }
      });

      // Enhance reports with target data
      const enhancedReports = await Promise.all(reports.map(async (r) => {
         let targetData = null;
         if (r.targetType === "MESSAGE" && r.targetId) {
            const msg = await prisma.message.findUnique({
               where: { id: parseInt(r.targetId) },
               select: { content: true, isDeleted: true }
            });
            targetData = msg;
         }
         return {
           ...r,
           targetData
         };
      }));

      res.json({ status: "success", data: enhancedReports });
    } catch (err: any) {
      res.status(500).json({ status: "error", error: { message: err.message } });
    }
  }

  static async applyAction(req: AuthenticatedRequest, res: Response) {
    try {
      const { reportId } = req.params;
      const { action, penaltyType, durationMinutes, reason } = req.body; // action: 'DELETE_MESSAGE', 'PENALIZE', 'DISMISS'
      
      const report = await prisma.report.findUnique({ where: { id: reportId } });
      if (!report) return res.status(404).json({ status: "error", error: { message: "Report not found" } });

      if (action === 'DELETE_MESSAGE' && report.targetType === 'MESSAGE' && report.targetId) {
        await prisma.message.update({
          where: { id: Number(report.targetId) },
          data: { isDeleted: true, content: "این پیام توسط مدیریت حذف شد." }
        }).catch(() => {});
        
        if (report.reportedUserId) {
          sendRealtimeWarning(report.reportedUserId, "یکی از پیام‌های شما به دلیل گزارش کاربران توسط سیستم حذف شد.");
        }
      }

      if (action === 'CLEAR_ASSET' && report.reportedUserId) {
        const { assetType } = req.body;
        if (assetType === 'AVATAR' || assetType === 'BANNER') {
          await prisma.profile.update({
            where: { userId: report.reportedUserId },
            data: { [assetType === 'AVATAR' ? 'avatarUrl' : 'bannerUrl']: null }
          });
        } else if (assetType === 'VIP_BG') {
          const profile = await prisma.profile.findUnique({ where: { userId: report.reportedUserId } });
          if (profile?.vipMetadata) {
            try {
              const meta = JSON.parse(profile.vipMetadata);
              meta.bgImage = null;
              await prisma.profile.update({
                where: { userId: report.reportedUserId },
                data: { vipMetadata: JSON.stringify(meta) }
              });
            } catch(e) {}
          }
        }
        await prisma.notification.create({
          data: {
            userId: report.reportedUserId,
            type: "WARNING",
            data: JSON.stringify({ message: "تصویر/بنر پروفایل شما به دلیل تخلف ظاهری حذف شد." }),
            isRead: false
          }
        });
        sendRealtimeWarning(report.reportedUserId, "تصویر پروفایل شما به دلیل عدم رعایت قوانین حذف شد.");
      }

      if (action === 'PENALIZE' && report.reportedUserId) {
        if (!penaltyType || !durationMinutes) return res.status(400).json({ status: "error", error: { message: "Missing penalty parameters" } });
        
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(durationMinutes));

        await prisma.penalty.create({
          data: {
            userId: report.reportedUserId,
            type: penaltyType, // CHAT_BAN, LOBBY_BAN, GLOBAL_BAN, WARNING
            reason,
            expiresAt
          }
        });

        if (penaltyType === "WARNING") {
          // Send notification
           await prisma.notification.create({
             data: {
               userId: report.reportedUserId,
               type: "WARNING",
               data: JSON.stringify({ message: reason || "شما یک اخطار از مدیریت دریافت کردید." }),
               isRead: false
             }
           });
        }
        
        // Always send real-time socket notice
        sendRealtimeWarning(report.reportedUserId, reason || `شما در رابطه با تخلف گزارش شده، اعمال قانون شدید (${penaltyType}).`);
      }

      if (action === 'RESPOND_TICKET') {
        const { adminResponse } = req.body;
        await prisma.report.update({
          where: { id: reportId },
          data: { status: "ACTIONED", adminResponse }
        });
        
        // Notify user about ticket response
        if (report.reporterId) {
           await prisma.notification.create({
             data: {
               userId: report.reporterId,
               type: "SYSTEM_MSG",
               data: JSON.stringify({ message: "پاسخ جدید برای تیکت/گزارش شما ارسال شد." }),
               isRead: false
             }
           });
        }
        return res.json({ status: "success", message: "Response saved" });
      }
      
      if (action === 'REJECT_TICKET') {
        await prisma.report.update({
           where: { id: reportId },
           data: { status: "REJECTED", adminResponse: req.body.adminResponse || null }
        });
        return res.json({ status: "success", message: "Ticket rejected" });
      }

      await prisma.report.update({
        where: { id: reportId },
        data: { status: "ACTIONED" }
      });

      res.json({ status: "success", message: "Action applied" });
    } catch (err: any) {
      res.status(500).json({ status: "error", error: { message: err.message } });
    }
  }

  static async deleteMessageAdmin(req: AuthenticatedRequest, res: Response) {
    try {
      const { messageId } = req.params;
      await prisma.message.update({
        where: { id: Number(messageId) },
        data: { isDeleted: true, content: "این پیام توسط مدیریت حذف شد." }
      });
      res.json({ status: "success" });
    } catch(err: any) {
      res.status(500).json({ status: "error", error: { message: err.message } });
    }
  }
}
