import { Request, Response } from "express";
import prisma from "../utils/prisma.ts";
import { BaleService } from "../services/bale.service.ts";

export class WebhookController {
  static async handleBale(req: Request, res: Response) {
    const update = req.body;
    console.log("[Bale Webhook] Received update:", JSON.stringify(update));

    if (!update.message) return res.sendStatus(200);

    const message = update.message;
    const chatId = message.chat.id;
    const fromId = message.from.id;
    const text = message.text || "";

    // 1. Handle /start verification
    if (text.startsWith("/start ")) {
      const token = text.split(" ")[1];
      const user = await prisma.user.findFirst({
        where: { verificationToken: token }
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { baleId: String(fromId) }
        });
        await BaleService.sendVerificationRequest(chatId);
      } else {
        await BaleService.sendMessage(chatId, "لینک نامعتبر یا منقضی شده است.");
      }
    } 
    // 2. Handle contact sharing
    else if (message.contact) {
      const contact = message.contact;
      const phone = contact.phone_number;
      
      const user = await prisma.user.findUnique({
        where: { baleId: String(fromId) }
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            phone, 
            isVerified: true, 
            verificationToken: null 
          }
        });
        await BaleService.sendMessage(chatId, "✅ حساب کاربری شما با موفقیت تایید شد. اکنون می‌توانید از تمامی امکانات استفاده کنید.");
      } else {
         await BaleService.sendMessage(chatId, "خطا: ابتدا باید از طریق سایت ثبت‌نام کنید.");
      }
    }

    res.sendStatus(200);
  }
}
