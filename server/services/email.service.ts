import nodemailer from "nodemailer";

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
       rejectUnauthorized: false
    }
  });

  static async sendMail(to: string, subject: string, html: string) {
    if (!process.env.SMTP_USER) {
      console.log("SMTP not configured, logging email to console:");
      console.log(`To: ${to}\nSubject: ${subject}\nContent: ${html}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"Loxx Support" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  }

  static async sendVerificationEmail(email: string, token: string) {
    const link = `http://loxx.ir/verify?token=${token}`;
    const html = `
      <div dir="rtl" style="font-family: sans-serif; padding: 20px; background-color: #0d0d12; color: white;">
        <h1 style="color: #00e5ff;">تایید حساب کاربری لبرخی</h1>
        <p>کاربر گرامی، برای فعالسازی حساب خود در پلتفرم لoxx بر روی لینک زیر کلیک کنید:</p>
        <a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #00e5ff; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold;">تایید حساب کاربری</a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">اگر این درخواست توسط شما ارسال نشده است، این ایمیل را نادیده بگیرید.</p>
      </div>
    `;
    await this.sendMail(email, "تایید حساب کاربری - Loxx", html);
  }

  static async sendOTP(email: string, code: string) {
    const html = `
      <div dir="rtl" style="font-family: sans-serif; padding: 20px; background-color: #0d0d12; color: white;">
        <h1 style="color: #00e5ff;">کد تایید دو مرحله‌ای</h1>
        <p>کد تایید شما برای ورود به لoxx:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ff00ff; margin: 20px 0;">${code}</div>
        <p style="font-size: 12px; color: #666;">این کد تا ۱۰ دقیقه دیگر معتبر است.</p>
      </div>
    `;
    await this.sendMail(email, "کد تایید ورود - Loxx", html);
  }
}
