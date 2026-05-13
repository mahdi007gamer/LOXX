import { Request, Response } from "express";
import prisma from "../utils/prisma.ts";
import { BaleService } from "../services/bale.service.ts";
import { AuthService } from "../services/auth.service.ts";

export class WebhookController {
  static async handleBale(req: Request, res: Response) {
    const update = req.body;
    console.log("[Bale Webhook] Received update:", JSON.stringify(update));

    if (!update.message) return res.sendStatus(200);

    const message = update.message;
    const chatId = message.chat.id;
    const fromId = message.from.id;
    const text = message.text || "";

    // 1. Handle /start verification / login
    if (text === "/start") {
      await BaleService.sendWelcomeMessage(chatId);
    } else if (text.startsWith("/start ")) {
      const token = text.split(" ")[1];
      
      try {
        // Try to verify if it's a JWT from "Login with Bale"
        console.log("[Bale Webhook] Verifying JWT token...");
        const payload = AuthService.verifyBaleAuthToken(token);
        const phone = payload.phone;

        let user = await prisma.user.findUnique({ where: { phone } });

        if (user) {
          // Link baleId and verify
          await prisma.user.update({
            where: { id: user.id },
            data: { baleId: String(fromId), isVerified: true }
          });

          const sessionToken = AuthService.generateAccessToken(user.id);
          const callbackUrl = `${process.env.APP_URL}/auth/bale/callback?token=${sessionToken}`;

          await BaleService.sendMessage(chatId, `✅ حساب شما تایید شد.\n\nبرای ورود به سیستم روی لینک زیر کلیک کنید:`, {
            inline_keyboard: [[{ text: "🚀 ورود به لابی", url: callbackUrl }]]
          });
        } else {
          await BaleService.sendMessage(chatId, "⚠️ کاربری با این شماره یافت نشد. ابتدا در سایت ثبت‌نام کنید.");
        }
      } catch (e) {
        // Fallback to legacy UUID token verification (for registration link)
        console.log("[Bale Webhook] Legacy UUID fallback...");
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
          await BaleService.sendMessage(chatId, "❌ لینک نامعتبر یا منقضی شده است.");
        }
      }
    } 
    // 2. Handle contact sharing (Fallback/Manual verification)
    else if (message.contact) {
      const contact = message.contact;
      let phone = contact.phone_number;
      if (!phone.startsWith("0")) phone = "0" + phone.replace("+98", ""); // Normalize
      
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
        
        const sessionToken = AuthService.generateAccessToken(user.id);
        const callbackUrl = `${process.env.APP_URL}/auth/bale/callback?token=${sessionToken}`;

        await BaleService.sendMessage(chatId, "✅ حساب کاربری شما با موفقیت تایید شد.", {
          inline_keyboard: [[{ text: "🚀 ورود به سایت", url: callbackUrl }]]
        });
      } else {
         await BaleService.sendMessage(chatId, "خطا: ابتدا باید از طریق سایت ثبت‌نام کنید.");
      }
    }

    res.sendStatus(200);
  }
}
