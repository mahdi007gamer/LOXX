import axios from "axios";

const BALE_TOKEN = process.env.BALE_BOT_TOKEN || "1410315386:3st5Z7C7F7dGn1JV9r8kKEZ5AL879ABRbHg";
const BALE_API_URL = `https://tapi.bale.ai/bot${BALE_TOKEN}`;

export class BaleService {
  static async sendMessage(chatId: string | number, text: string, replyMarkup?: any) {
    try {
      await axios.post(`${BALE_API_URL}/sendMessage`, {
        chat_id: String(chatId),
        text,
        reply_markup: replyMarkup
      });
      return true;
    } catch (error) {
      console.error("Bale API error:", error);
      return false;
    }
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
    const text = `کد تایید ورود شما:\n\n${code}\n\nاین کد تا ۱۰ دقیقه دیگر معتبر است.`;
    return this.sendMessage(chatId, text);
  }

  static async setWebhook(url: string) {
    try {
      await axios.post(`${BALE_API_URL}/setWebhook`, {
          url: `${url}/api/v1/webhooks/bale`
      });
      console.log(`Bale Webhook set to ${url}/api/v1/webhooks/bale`);
    } catch (error) {
      console.error("Failed to set Bale webhook:", error);
    }
  }
}
