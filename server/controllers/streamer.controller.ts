import { Request, Response } from "express";
import prisma from "../utils/prisma.ts";
import { AuthenticatedRequest } from "../middleware/auth.middleware.ts";

export class StreamerController {
  static async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      let user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: {
          streamerStats: true,
          withdrawals: { orderBy: { createdAt: 'desc' }, take: 20 },
          referredPayments: {
            where: { status: "APPROVED" },
            include: { user: { select: { username: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20
          }
        }
      });
      
      if (!user) return res.status(404).json({ status: "error", message: "User not found" });

      if (!user.streamerStats && user.role === "STREAMER") {
        const stats = await prisma.streamerStats.create({
          data: {
            userId: user.id,
            discountCode: user.username.toUpperCase(),
          }
        });
        user = { ...user, streamerStats: stats } as any;
      }
      
      const payload = {
        ...(user.streamerStats || {}),
        withdrawalRequests: user.withdrawals,
        paymentsRef: user.referredPayments
      };

      res.json({ status: "success", data: payload });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  static async updateInfo(req: AuthenticatedRequest, res: Response) {
    try {
      const { paymentInfo, discountCode } = req.body;
      const stats = await prisma.streamerStats.update({
        where: { userId: req.user!.userId },
        data: { paymentInfo, discountCode: discountCode ? discountCode.toUpperCase() : undefined }
      });
      res.json({ status: "success", data: stats });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  static async requestWithdrawal(req: AuthenticatedRequest, res: Response) {
    try {
      const { amount } = req.body;
      if (!amount || amount < 50000) {
        return res.status(400).json({ status: "error", message: "Minimum withdrawal is 50,000" });
      }

      const stats = await prisma.streamerStats.findUnique({ where: { userId: req.user!.userId } });
      if (!stats || stats.balance < amount) {
        return res.status(400).json({ status: "error", message: "Insufficient balance" });
      }

      const pendingReq = await prisma.withdrawalRequest.findFirst({
        where: { streamerId: req.user!.userId, status: "PENDING" }
      });

      if (pendingReq) {
        return res.status(400).json({ status: "error", message: "You already have a pending withdrawal request" });
      }

      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      
      const transactions = [
        prisma.streamerStats.update({
          where: { userId: req.user!.userId },
          data: { balance: { decrement: amount } }
        }),
        prisma.withdrawalRequest.create({
          data: {
            streamerId: req.user!.userId,
            amount,
            status: "PENDING"
          }
        })
      ];
      
      if (admin) {
        transactions.push(
          prisma.notification.create({
            data: {
              userId: admin.id,
              type: "SYSTEM",
              data: JSON.stringify({
                title: "درخواست تسویه استریمر",
                message: `درخواست تسویه به مبلغ ${amount.toLocaleString()} تومان ثبت شد.`
              })
            }
          }) as any
        );
      }

      await prisma.$transaction(transactions);

      if (admin) {
        const { emitNotification } = require("../utils/socket.ts");
        emitNotification(admin.id, "SYSTEM", {
          title: "درخواست تسویه استریمر",
          message: `درخواست تسویه به مبلغ ${amount.toLocaleString()} تومان ثبت شد.`
        });
      }

      res.json({ status: "success", message: "Withdrawal request submitted" });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
}
