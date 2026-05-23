import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.ts";
import prisma from "../utils/prisma.ts";

import { sendRealtimeWarning } from "../sockets/index.ts";

export class ReportController {
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { reportedUserId, targetId, targetType, reason } = req.body;
      const reporterId = req.user!.userId;

      // Check if already reported
      const existing = await prisma.report.findFirst({
        where: { reporterId, targetId, targetType }
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
          reportedUser: { select: { username: true } }
        }
      });
      res.json({ status: "success", data: reports });
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
