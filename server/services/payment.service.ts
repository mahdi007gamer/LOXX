import prisma from "../utils/prisma.ts";

export class PaymentService {
  static async createPaymentRequest(userId: string, type: "PLUS" | "VIP", receiptImageUrl: string) {
    const amounts = {
      PLUS: 199000,
      VIP: 599000
    };

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
        amount: amounts[type],
        receiptImageUrl,
        status: "PENDING"
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

  static async approvePayment(paymentId: string) {
    const payment = await prisma.paymentRequest.findUnique({
      where: { id: paymentId }
    });

    if (!payment) throw new Error("PAYMENT_NOT_FOUND");

    await prisma.paymentRequest.update({
      where: { id: paymentId },
      data: { status: "APPROVED" }
    });

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
