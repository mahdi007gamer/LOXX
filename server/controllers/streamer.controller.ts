import { Request, Response } from "express";
import prisma from "../utils/prisma.ts";
import { AuthenticatedRequest } from "../middleware/auth.middleware.ts";

export class StreamerController {
  static async getInviteByAlias(req: Request, res: Response) {
    try {
      const invite = await prisma.streamerInvite.findUnique({
        where: { alias: req.params.alias }
      });
      if (!invite) return res.status(404).json({ status: "error", message: "Invite not found" });
      res.json({ status: "success", data: invite });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

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

  static async submitCooperation(req: Request, res: Response) {
    try {
      const { alias } = req.params;
      const { fullName, phone, wantsCooperate, feedback } = req.body;

      if (!fullName || !phone) {
        return res.status(400).json({ status: "error", message: "نام و شماره تماس الزامی است." });
      }

      // Check for any active (PENDING or READ) proposal for this alias and phone
      const existingProposal = await prisma.streamerCooperationProposal.findFirst({
        where: {
          alias,
          phone,
          status: { in: ["PENDING", "READ"] }
        }
      });

      if (existingProposal) {
        return res.status(400).json({ status: "error", message: "یک درخواست فعال با این شماره تماس قبلاً ثبت شده است و در دست بررسی است." });
      }

      const proposal = await prisma.streamerCooperationProposal.create({
        data: {
          alias,
          fullName,
          phone,
          wantsCooperate: wantsCooperate === undefined ? true : !!wantsCooperate,
          feedback,
          status: "PENDING"
        }
      });

      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      if (admin) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: "SYSTEM",
            data: JSON.stringify({
              title: "درخواست همکاری استریمر جدید",
              message: `درخواست همکاری جدید از طرف ${fullName} (${alias}) ثبت شد.`
            })
          }
        });

        try {
          const { emitNotification } = await import("../utils/socket.ts");
          emitNotification(admin.id, "SYSTEM", {
            title: "درخواست همکاری استریمر جدید",
            message: `درخواست همکاری جدید از طرف ${fullName} (${alias}) ثبت شد.`
          });
        } catch (e) {
          // ignore
        }
      }

      res.json({ status: "success", data: proposal });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  static async getActiveProposalForAlias(req: Request, res: Response) {
    try {
      const { alias } = req.params;
      const { phone } = req.query;

      const whereClause: any = { alias };
      if (phone) {
        whereClause.phone = String(phone);
      } else {
        whereClause.status = { in: ["PENDING", "READ"] };
      }

      const proposal = await prisma.streamerCooperationProposal.findFirst({
        where: whereClause,
        orderBy: { createdAt: "desc" }
      });

      res.json({ status: "success", data: proposal });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  static async getCooperationProposals(req: AuthenticatedRequest, res: Response) {
    try {
      const proposals = await prisma.streamerCooperationProposal.findMany({
        orderBy: { createdAt: "desc" }
      });
      res.json({ status: "success", data: proposals });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  static async updateCooperationStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const proposal = await prisma.streamerCooperationProposal.update({
        where: { id },
        data: { status }
      });

      res.json({ status: "success", data: proposal });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  static async deleteCooperationProposal(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await prisma.streamerCooperationProposal.delete({
        where: { id }
      });
      res.json({ status: "success", message: "درخواست همکاری با موفقیت حذف شد." });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
}
