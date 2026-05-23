import axios from "axios";
import https from "https";
import http from "http";

const BALE_TOKEN = process.env.BALE_BOT_TOKEN!;
const BALE_API_URL = `https://tapi.bale.ai/bot${BALE_TOKEN}`;

const baleApi = axios.create({
  baseURL: BALE_API_URL,
  proxy: false,
  httpAgent: new http.Agent(),
  httpsAgent: new https.Agent()
});

export class BaleService {
  static async sendMessage(chatId: string | number, text: string, replyMarkup?: any) {
    if (!BALE_TOKEN) return null;
    try {
      const response = await baleApi.post("/sendMessage", {
        chat_id: String(chatId),
        text,
        reply_markup: replyMarkup
      });
      return response.data;
    } catch (error) {
      console.error("Bale API error:", error);
      return null;
    }
  }

  static async deleteMessage(chatId: string | number, messageId: number) {
    if (!BALE_TOKEN) return false;
    try {
      await baleApi.post("/deleteMessage", {
        chat_id: String(chatId),
        message_id: messageId
      });
      return true;
    } catch (error) {
      console.error("Bale API error (deleteMessage):", error);
      return false;
    }
  }

  static async sendWelcomeMessage(chatId: string | number) {
    const text = "💎 به بازوی رسمی پلتفرم LOXX خوش آمدید!\n\nاین بازو برای تایید هویت و امنیت حساب کاربری شما طراحی شده است.\n\n✨ ویژگی‌ها:\n✅ تایید شماره همراه\n✅ کدهای ورود دو مرحله‌ای\n✅ اعلان‌های امنیتی\n\nاگر از سایت ثبت‌نام کرده‌اید، از لینک مخصوص برای تایید استفاده کنید.";
    return this.sendMessage(chatId, text);
  }

  static async sendVerificationRequest(chatId: string | number) {
    const text = "خوش آمدید! برای تایید هویت و فعالسازی حساب کاربری لبرخی، لطفاً دکمه زیر را برای اشتراک‌گذاری شماره همراه خود فشار دهید:";
    const replyMarkup = {
      keyboard: [
        [
          {
            text: "📲 تایید شماره همراه",
            request_contact: true
          }
        ]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    };

    return this.sendMessage(chatId, text, replyMarkup);
  }

  static async sendOTPViaBot(chatId: string | number, code: string) {
    const text = `👑 کد ورود شما به پلتفرم لوکس:\n\n✨ 『 ${code} 』 ✨\n\n🔒 این کد مختص شماست و تا ۱۰ دقیقه دیگر اعتبار دارد.\n\n🎮 ورود به دنیای حرفه‌ای‌ها...`;
    return this.sendMessage(chatId, text);
  }

  static async setWebhook(url: string) {
    try {
      await baleApi.post("/setWebhook", {
          url: `${url}/api/v1/webhooks/bale`
      });
      console.log(`Bale Webhook set to ${url}/api/v1/webhooks/bale`);
    } catch (error) {
      console.error("Failed to set Bale webhook:", error);
    }
  }
}
