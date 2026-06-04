import axios from "axios";
import https from "https";
import http from "http";
import _module from "module";
import path from "path";

const requireFunc = typeof require !== "undefined"
  ? require
  : _module.createRequire(path.join(process.cwd(), "package.json"));

const Kavenegar = requireFunc("kavenegar");

export class KavenegarService {
  /**
   * Sends an OTP (verification code) via Kavenegar.
   * Uses verify/lookup.json (pattern matching) for high-speed delivery bypassing blacklists.
   * If lookup fails or isn't fully configured, falls back to direct SMS send.json via the sender number.
   * @param phone Recipient's phone number
   * @param token OTP verification code
   */
  static async sendOTP(phone: string, token: string): Promise<boolean> {
    const KAVENEGAR_API_KEY = process.env.KAVENEGAR_API_KEY || "6A42677659444F74536B77467678745132456C4F364D494A43617572757639424775454243317A313974453D";
    const KAVENEGAR_SENDER = process.env.KAVENEGAR_SENDER || "2000660110";
    const KAVENEGAR_TEMPLATE = process.env.KAVENEGAR_TEMPLATE || "template";

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

    const api = Kavenegar.KavenegarApi({ apikey: KAVENEGAR_API_KEY });

    return new Promise((resolve) => {
      console.log(`[KavenegarService] Calling Lookup API for pattern template: "${KAVENEGAR_TEMPLATE}" to ${formattedPhone}`);

      api.VerifyLookup({
        receptor: formattedPhone,
        token: token,
        template: KAVENEGAR_TEMPLATE
      }, function(entries: any, status: number, message: string) {
        if (status === 200) {
          console.log(`[KavenegarService] Lookup SMS queued successfully by Kavenegar:`, entries);
          resolve(true);
        } else {
          console.error(`[KavenegarService] Lookup template failed. Status: ${status}, Message: ${message}`);
          
          console.log(`[KavenegarService] Falling back to standard send API with sender: "${KAVENEGAR_SENDER}"`);
          const messageText = `کد شما در پلتفرم لوکس: ${token}`;
          
          api.Send({
            message: messageText,
            sender: KAVENEGAR_SENDER,
            receptor: formattedPhone
          }, function(fallbackEntries: any, fallbackStatus: number, fallbackMessage: string) {
            if (fallbackStatus === 200) {
              console.log(`[KavenegarService] Standard fallback SMS queued successfully.`);
              resolve(true);
            } else {
              console.error(`[KavenegarService] Standard fallback SMS failed. Status: ${fallbackStatus}, Message: ${fallbackMessage}`);
              resolve(false);
            }
          });
        }
      });
    });
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
