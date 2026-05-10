import Kavenegar from "kavenegar";

const KAVENEGAR_API_KEY = "6A42677659444F74536B77467678745132456C4F364D494A43617572757639424775454243317A313974453D";
const SENDER = "10009000400099";

const api = Kavenegar.KavenegarApi({ apikey: KAVENEGAR_API_KEY });

export class SmsService {
  static async sendOtp(phone: string, code: string) {
    return new Promise((resolve, reject) => {
      // Use template-based sending for better delivery if possible, 
      // but the user requested explicit Send with message.
      api.Send({
        message: `کد تایید شما در پلتفرم لوکس: ${code}`,
        sender: SENDER,
        receptor: phone
      }, (response: any, status: any) => {
        if (status === 200) {
          resolve(response);
        } else {
          reject(new Error(`Kavenegar error: ${status}`));
        }
      });
    });
  }

  static async sendPasswordReset(phone: string, newCode: string) {
    return new Promise((resolve, reject) => {
      api.Send({
        message: `کد بازیابی رمز عبور شما: ${newCode}\nلوکس`,
        sender: SENDER,
        receptor: phone
      }, (response: any, status: any) => {
        if (status === 200) {
          resolve(response);
        } else {
          reject(new Error(`Kavenegar error: ${status}`));
        }
      });
    });
  }
}
