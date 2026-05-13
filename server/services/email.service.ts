import nodemailer from "nodemailer";

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.loxx.ir",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "code@loxx.ir",
      pass: process.env.SMTP_PASS,
    },
    tls: {
       rejectUnauthorized: false
    }
  });

  static async sendMail(to: string, subject: string, html: string) {
    const sender = process.env.SMTP_USER || "code@loxx.ir";
    
    if (!process.env.SMTP_PASS) {
      console.log("SMTP Password not configured, logging email to console:");
      console.log(`From: ${sender}\nTo: ${to}\nSubject: ${subject}\nContent: ${html}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"LOXX Security" <${sender}>`,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  }

  static async sendVerificationEmail(email: string, token: string) {
    const link = `https://loxx.ir/verify?token=${token}`;
    const html = `
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Tahoma', sans-serif; background-color: #050508; color: #ffffff; padding: 0; margin: 0; }
          .container { max-width: 600px; margin: 20px auto; background: #0a0a0f; border: 1px solid #1a1a24; border-top: 4px solid #00e5ff; border-radius: 16px; overflow: hidden; }
          .header { padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, #001219, #0a0a0f); }
          .content { padding: 40px; text-align: center; }
          .footer { padding: 20px; text-align: center; font-size: 11px; color: #444; border-top: 1px solid #1a1a24; }
          .code-box { background: rgba(0, 229, 255, 0.05); border: 1px dashed #00e5ff; border-radius: 12px; padding: 20px; margin: 30px 0; font-family: monospace; font-size: 32px; letter-spacing: 5px; color: #00e5ff; font-weight: bold; }
          .button { display: inline-block; padding: 16px 40px; background: #00e5ff; color: #000; text-decoration: none; border-radius: 12px; font-weight: 900; text-transform: uppercase; font-style: italic; box-shadow: 0 10px 20px rgba(0, 229, 255, 0.2); }
          .title { font-size: 24px; font-weight: 900; margin-bottom: 10px; color: #f0f0f0; }
          .text { color: #888; font-size: 14px; line-height: 1.8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0; font-size: 48px; letter-spacing: -2px; font-style: italic; font-weight: 900; color: #fff;">LOXX<span style="color:#00e5ff;">.</span></h1>
          </div>
          <div class="content">
            <h2 class="title">تایید هویت حساب کاربری</h2>
            <p class="text">خوش آمدید! برای شروع ماجراجویی در دنیای لوکس، ابتدا باید هویت خود را تایید کنید.</p>
            
            <div style="margin: 40px 0;">
              <a href="${link}" class="button">فعالسازی حساب کاربری</a>
            </div>
            
            <p class="text" style="font-size: 12px;">یا از لینک زیر استفاده کنید:<br>
            <a href="${link}" style="color: #444; text-decoration: none;">${link}</a></p>
          </div>
          <div class="footer">
            &copy; 2026 LOXX Platform. تمامی حقوق محفوظ است.
          </div>
        </div>
      </body>
      </html>
    `;
    await this.sendMail(email, "تایید حساب کاربری - LOXX Security", html);
  }

  static async sendOTP(email: string, code: string) {
    const html = `
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Tahoma', sans-serif; background-color: #050508; color: #ffffff; padding: 0; margin: 0; }
          .container { max-width: 600px; margin: 20px auto; background: #0a0a0f; border: 1px solid #1a1a24; border-top: 4px solid #ff00ff; border-radius: 16px; overflow: hidden; }
          .header { padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, #190019, #0a0a0f); }
          .content { padding: 40px; text-align: center; }
          .footer { padding: 20px; text-align: center; font-size: 11px; color: #444; border-top: 1px solid #1a1a24; }
          .code-box { background: rgba(255, 0, 255, 0.05); border: 1px dashed #ff00ff; border-radius: 12px; padding: 20px; margin: 30px 0; font-family: monospace; font-size: 42px; letter-spacing: 12px; color: #ff00ff; font-weight: bold; }
          .title { font-size: 24px; font-weight: 900; margin-bottom: 10px; color: #f0f0f0; }
          .text { color: #888; font-size: 14px; line-height: 1.8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0; font-size: 48px; letter-spacing: -2px; font-style: italic; font-weight: 900; color: #fff;">LOXX<span style="color:#ff00ff;">.</span></h1>
          </div>
          <div class="content">
            <h2 class="title">کد امنیتی ورود</h2>
            <p class="text">شما در حال ورود به بخش حفاظت شده هستید. از کد زیر برای احراز هویت استفاده کنید:</p>
            
            <div class="code-box">${code}</div>
            
            <p class="text" style="font-size: 12px;">این کد تا ۱۰ دقیقه دیگر منقضی خواهد شد.</p>
          </div>
          <div class="footer">
            اگر شما این درخواست را ارسال نکرده‌اید، فوراً رمز عبور خود را تغییر دهید.
          </div>
        </div>
      </body>
      </html>
    `;
    await this.sendMail(email, "کد امنیتی ورود - LOXX", html);
  }
}
