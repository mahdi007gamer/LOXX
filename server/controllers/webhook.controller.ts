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

    const getBaseUrl = () => {
      // Priority 1: APP_URL env var
      if (process.env.APP_URL && process.env.APP_URL.includes("loxx.ir")) {
         return process.env.APP_URL.replace(/\/$/, "");
      }
      
      // Priority 2: Use Request headers but avoid loopback/IPs if we know the domain
      const protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
      const host = req.get("host") || "";
      
      if (host.includes("127.0.0.1") || host.includes("localhost") || !host) {
         return "https://loxx.ir";
      }
      
      return `${protocol}://${host}`;
    };

    // 1. Handle /start verification / login
    if (text === "/start") {
      await BaleService.sendWelcomeMessage(chatId);
    } else if (text.startsWith("/start ")) {
      const token = text.split(" ")[1];
      
      // Send temporary message - Professional branding
      const tempMsg = await BaleService.sendMessage(chatId, "🛡️ **سیستم امنیت متمرکز LOXX**\n\nدرخواست شما دریافت شد. در حال بررسی وضعیت بیومتریک و اعتبار دسترسی شما به پلتفرم فین‌تک-گیمینگ لوکس هستیم...");
      
      try {
        // Look up by verificationToken (UUID)
        const user = await prisma.user.findFirst({
          where: { verificationToken: token }
        });

        if (user) {
          // Link baleId
          await prisma.user.update({
            where: { id: user.id },
            data: { baleId: String(fromId) }
          });

          if (user.isVerified) {
            // Already verified, send success with login link
            const oneTimeToken = await AuthService.generateOneTimeLoginToken(user.id);
            const callbackUrl = `${getBaseUrl()}/auth/bale/callback?token=${oneTimeToken}`;
            
            await BaleService.sendMessage(chatId, "✨ **تاییدیه هویت صادر شد**\n\nخوش آمدید. حساب کاربری شما در وضعیت **Verified** قرار دارد. با کلیک بر روی دکمه زیر می‌توانید به صورت ایمن وارد پلتفرم شوید:", {
              inline_keyboard: [[{ text: "🚀 ورود ایمن به LOXX", url: callbackUrl }]]
            });
          } else {
            // Not verified yet, send contact request
            const requestText = "🔒 **احراز هویت دومرحله‌ای الزامی است**\n\nبرای دسترسی به تمامی امکانات پلتفرم (بازار، کلوپ‌های نخبگان و رقابت‌های جایزه‌دار)، تایید شماره همراه الزامی است.\n\nلطفاً با فشردن دکمه زیر، اشتراک‌گذاری شماره همراه خود را تایید کنید:";
            const replyMarkup = {
              keyboard: [[{ text: "📲 اشتراک‌گذاری و تایید شماره", request_contact: true }]],
              resize_keyboard: true,
              one_time_keyboard: true
            };
            await BaleService.sendMessage(chatId, requestText, replyMarkup);
          }
        } else {
          await BaleService.sendMessage(chatId, "⚠️ **اعتبارنامه نامعتبر**\n\nمتأسفانه این لینک شناسایی نشد یا منقضی شده است. لطفاً برای دریافت لینک جدید به سایت لوکس مراجعه کنید.");
        }
      } catch (e) {
        console.error("[Bale Webhook] Error during /start processing:", e);
        await BaleService.sendMessage(chatId, "💥 **اختلال در ارتباط**\n\nمتأسفانه مشکلی در پردازش درخواست شما رخ داد. تیم فنی در حال بررسی است.");
      } finally {
        if (tempMsg && tempMsg.result) {
          await BaleService.deleteMessage(chatId, tempMsg.result.message_id);
        }
      }
    } 
    // 2. Handle contact sharing (Verification)
    else if (message.contact) {
      const contact = message.contact;
      const phone = AuthService.normalizePhone(contact.phone_number);
      
      // Send temporary message
      const tempMsg = await BaleService.sendMessage(chatId, "⚡️ **در حال پردازش نهایی...**");

      try {
        const user = await prisma.user.findUnique({
          where: { baleId: String(fromId) }
        });

        if (user) {
          // Verify user
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              phone: user.phone || phone, 
              isVerified: true, 
              verificationToken: null 
            }
          });
          
          const oneTimeToken = await AuthService.generateOneTimeLoginToken(user.id);
          const callbackUrl = `${getBaseUrl()}/auth/bale/callback?token=${oneTimeToken}`;

          await BaleService.sendMessage(chatId, "👑 **تایید نهایی با موفقیت انجام شد**\n\nحساب هوشمند شما با موفقیت به سطح **LoXX Verified** ارتقا یافت.\n\nاکنون تمامی محدودیت‌های تجاری و رقابتی برای شما برداشته شده است:", {
            inline_keyboard: [[{ text: "🎮 ورود به دنیای لوکس", url: callbackUrl }]]
          });
        } else {
           await BaleService.sendMessage(chatId, "❌ **عدم تطابق اطلاعات**\n\nکاربری با این مشخصات یافت نشد. لطفاً در سایت ثبت‌نام کنید.");
        }
      } catch (e) {
        console.error("[Bale Webhook] Error during contact processing:", e);
        await BaleService.sendMessage(chatId, "❌ **خطا در تایید هویت**\n\nعملیات با شکست مواجه شد.");
      } finally {
        if (tempMsg && tempMsg.result) {
          await BaleService.deleteMessage(chatId, tempMsg.result.message_id);
        }
      }
    }

    res.sendStatus(200);
  }
}
