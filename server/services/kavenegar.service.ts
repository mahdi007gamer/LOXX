import axios from "axios";
import https from "https";
import http from "http";

const KAVENEGAR_API_KEY = process.env.KAVENEGAR_API_KEY || "6A42677659444F74536B77467678745132456C4F364D494A43617572757639424775454243317A313974453D";
const KAVENEGAR_SENDER = process.env.KAVENEGAR_SENDER || "2000660110";
const KAVENEGAR_TEMPLATE = process.env.KAVENEGAR_TEMPLATE || "template";

export class KavenegarService {
  /**
   * Sends an OTP (verification code) via Kavenegar.
   * Uses verify/lookup.json (pattern matching) for high-speed delivery bypassing blacklists.
   * If lookup fails or isn't fully configured, falls back to direct SMS send.json via the sender number.
   * @param phone Recipient's phone number
   * @param token OTP verification code
   */
  static async sendOTP(phone: string, token: string): Promise<boolean> {
    const formattedPhone = this.formatPhone(phone);
    console.log(`[KavenegarService] Attempting to send OTP Code ${token} to ${formattedPhone}`);

    if (!KAVENEGAR_API_KEY) {
      console.log("-----------------------------------------");
      console.log(`[Kavenegar SMS SIMULATOR]`);
      console.log(`To: ${formattedPhone}`);
      console.log(`Message: کد شما در پلتفرم لوکس ${token}`);
      console.log(`(KAVENEGAR_API_KEY is not defined in environment variables)`);
      console.log("-----------------------------------------");
      return true;
    }

    // Try Lookup API (Pattern/Template) first as it delivers instantly and handles AD-blocks
    try {
      const lookupUrl = `https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json`;
      console.log(`[KavenegarService] Calling Lookup API for pattern template: "${KAVENEGAR_TEMPLATE}"`);
      
      const response = await axios.get(lookupUrl, {
        params: {
          receptor: formattedPhone,
          token: token,
          template: KAVENEGAR_TEMPLATE
        },
        timeout: 8000
      });

      if (response.data && response.data.return && response.data.return.status === 200) {
        console.log(`[KavenegarService] Lookup SMS sent successfully via template:`, response.data.entries);
        return true;
      } else {
        throw new Error(response.data?.return?.message || "Invalid status code from Kavenegar");
      }
    } catch (lookupError: any) {
      console.warn(`[KavenegarService] Lookup template failed, falling back to standard send API. Error:`, lookupError.message);
      
      // Fallback: Send standard SMS via the purchased sender number "10009000400099"
      try {
        const sendUrl = `https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/sms/send.json`;
        const messageText = `کد شما در پلتفرم لوکس ${token}`;
        
        const response = await axios.get(sendUrl, {
          params: {
            sender: KAVENEGAR_SENDER,
            receptor: formattedPhone,
            message: messageText
          },
          timeout: 8000
        });

        if (response.data && response.data.return && response.data.return.status === 200) {
          console.log(`[KavenegarService] Standard fallback SMS sent successfully with sender: ${KAVENEGAR_SENDER}`);
          return true;
        } else {
          console.error(`[KavenegarService] All SMS delivery methods failed.`, response.data);
          return false;
        }
      } catch (sendError: any) {
        console.error(`[KavenegarService] Kavenegar standard API connection error:`, sendError.message);
        return false;
      }
    }
  }

  /**
   * Formats the Persian or prefix phone number to the standard Kavenegar receptor format (e.g. 0912xxxxxxx or 0098912xxxxxxx)
   */
  private static formatPhone(phone: string): string {
    let p = phone.trim();
    // Convert Persian/Arabic digits to English
    const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    for (let i = 0; i < 10; i++) {
      p = p.replace(persianDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
    }

    p = p.replace(/[^\d]/g, "");

    // standard formatting for Kavenegar receptor:
    // Ensure standard 09xxxxxxxxx
    if (p.startsWith("98") && p.length > 10) {
      p = "0" + p.substring(2);
    } else if (p.startsWith("0098") && p.length > 12) {
      p = "0" + p.substring(4);
    }
    
    if (!p.startsWith("0") && p.length === 10) {
      p = "0" + p;
    }

    return p;
  }
}
