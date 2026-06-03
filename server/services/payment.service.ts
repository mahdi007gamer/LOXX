import prisma from "../utils/prisma.ts";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

export class PaymentService {
  static async verifyPromoCode(code: string) {
    const streamer = await prisma.streamerStats.findUnique({
      where: { discountCode: code }
    });
    
    if (!streamer) {
      throw new Error("INVALID_PROMO_CODE");
    }
    
    return {
      discountPercent: streamer.userDiscountPercent,
      message: `تخفیف ${streamer.userDiscountPercent}% اختصاصی ${code} با موفقیت اعمال شد.`
    };
  }

  static async createPaymentRequest(userId: string, type: "PLUS" | "VIP", receiptImageUrl: string, promoCode?: string) {
    let amount = type === "PLUS" ? 199000 : 599000;
    let streamerId: string | undefined = undefined;

    if (promoCode) {
      const streamer = await prisma.streamerStats.findUnique({
        where: { discountCode: promoCode }
      });
      if (streamer) {
        amount = amount * (1 - streamer.userDiscountPercent / 100);
        streamerId = streamer.userId;
      }
    }

    const existing = await prisma.paymentRequest.findFirst({
      where: { userId, status: "PENDING" }
    });

    if (existing) {
      await prisma.paymentRequest.update({
        where: { id: existing.id },
        data: { status: "REJECTED" }
      });
    }

    return prisma.paymentRequest.create({
      data: {
        userId,
        type,
        amount,
        receiptImageUrl,
        status: "PENDING",
        discountCode: promoCode,
        streamerId
      }
    });
  }

  static async cancelPaymentRequest(userId: string) {
    const pending = await prisma.paymentRequest.findFirst({
      where: { userId, status: "PENDING" }
    });

    if (!pending) throw new Error("NO_PENDING_PAYMENT");

    return prisma.paymentRequest.delete({
      where: { id: pending.id }
    });
  }

  static async getPaymentStatus(userId: string) {
    return prisma.paymentRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  static async getAllPendingPayments() {
    return prisma.paymentRequest.findMany({
      where: { status: "PENDING" },
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: "asc" }
    });
  }

  static async getAllHistoryPayments() {
    return prisma.paymentRequest.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      include: { user: { include: { profile: true } } },
      orderBy: { updatedAt: "desc" },
      take: 100
    });
  }

  static async approvePayment(paymentId: string) {
    const payment = await prisma.paymentRequest.findUnique({
      where: { id: paymentId }
    });

    if (!payment) throw new Error("PAYMENT_NOT_FOUND");

    await prisma.paymentRequest.update({
      where: { id: paymentId },
      data: { status: "APPROVED" }
    });
    
    // Add Streamer Commission
    if (payment.streamerId) {
      const streamer = await prisma.streamerStats.findUnique({ where: { userId: payment.streamerId } });
      if (streamer) {
        const commission = payment.amount * (streamer.streamerCommissionPercent / 100);
        
        await prisma.$transaction([
          prisma.streamerStats.update({
            where: { userId: streamer.userId },
            data: {
              totalEarned: { increment: commission },
              balance: { increment: commission }
            }
          }),
          prisma.notification.create({
            data: {
              userId: streamer.userId,
              type: "SYSTEM",
              data: JSON.stringify({
                title: "پورسانت جدید!",
                message: `پورسانت ارجاع به مبلغ ${commission.toLocaleString()} تومان برای شما ثبت شد.`
              })
            }
          })
        ]);
        
        // Push notification real-time
        const { emitNotification } = require("../utils/socket.ts");
        emitNotification(streamer.userId, "SYSTEM", {
          title: "پورسانت جدید!",
          message: `پورسانت ارجاع به مبلغ ${commission.toLocaleString()} تومان برای شما ثبت شد.`
        });
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const existingSub = await prisma.subscription.findFirst({
      where: { userId: payment.userId }
    });

    if (existingSub) {
      let newExpiresAt = existingSub.expiresAt > now ? new Date(existingSub.expiresAt.getTime() + 30 * 24 * 60 * 60 * 1000) : expiresAt;
      
      await prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          type: payment.type,
          expiresAt: newExpiresAt
        }
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: payment.userId,
          type: payment.type,
          expiresAt: expiresAt
        }
      });
    }

    await prisma.profile.update({
      where: { userId: payment.userId },
      data: { membershipType: payment.type }
    }).catch(() => {});

    return { status: "success" };
  }

  static async rejectPayment(paymentId: string) {
    return prisma.paymentRequest.update({
      where: { id: paymentId },
      data: { status: "REJECTED" }
    });
  }
}
