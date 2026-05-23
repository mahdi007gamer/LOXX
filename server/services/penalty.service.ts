import prisma from "../utils/prisma.ts";

export class PenaltyService {
  static async checkPenalty(userId: string, types: string[]): Promise<{ isBanned: boolean, message?: string }> {
    const penalties = await prisma.penalty.findMany({
      where: {
        userId,
        type: { in: [...types, "GLOBAL_BAN"] },
        expiresAt: { gt: new Date() }
      }
    });

    if (penalties.length > 0) {
      const global = penalties.find(p => p.type === "GLOBAL_BAN");
      if (global) {
        return { isBanned: true, message: `حساب شما به دلیل تخلف تا تاریخ ${global.expiresAt.toLocaleString("fa-IR")} کاملا مسدود است.` };
      }
      
      const specific = penalties[0];
      let msg = "شما در این بخش مسدود هستید";
      if (specific.type === "CHAT_BAN") msg = "شما از ارسال پیام در چت مسدود هستید";
      if (specific.type === "LOBBY_BAN") msg = "شما از فعالیت در لابی مسدود هستید";

      return { isBanned: true, message: `${msg} (پایان: ${specific.expiresAt.toLocaleString("fa-IR")})` };
    }
    return { isBanned: false };
  }
}
