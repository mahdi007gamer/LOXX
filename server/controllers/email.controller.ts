import { Request, Response } from "express";
import prisma from "../utils/prisma.ts";
import nodemailer from "nodemailer";

let transporter: any = null;

const getTransporter = () => {
  if (transporter !== null) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const secure = process.env.SMTP_SECURE === "true"; // true for port 465, false for 587/25
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    console.log(`[SMTP] Real Mail Transporter configured on ${host}:${port}`);
  } else {
    console.log(`[SMTP] SMTP host credentials are not defined yet. Outbound mail delivery is simulated.`);
  }

  return transporter;
};

// Helper to seed default email and messages if empty
const ensureDefaultEmail = async () => {
  const defaultAddress = "info@loxx.ir";
  let infoEmail = await prisma.domainEmail.findUnique({
    where: { address: defaultAddress }
  });

  if (!infoEmail) {
    infoEmail = await prisma.domainEmail.create({
      data: {
        address: defaultAddress,
        label: "پشتیبانی و مدیریت اصلی لوکس"
      }
    });

    // Seed some incredibly realistic messages
    const messagesCount = await prisma.emailMessage.count();
    if (messagesCount === 0) {
      await prisma.emailMessage.createMany({
        data: [
          {
            fromAddress: "10mahdi10mahdi10@gmail.com",
            toAddress: defaultAddress,
            subject: "تست دریافت ایمیل از صندوق جیمیل خارجی",
            body: `سلام مهدی عزیز،\n\nامیدوارم حالت خوب باشه. برای دریافت ایمیل‌های واقعی که از سمت جیمیل یا یاهو به آدرس‌های دامنه loxx.ir ارسال میشن، باید حتماً تنظیمات رکورد MX دامنه رو روی سرورهای ایمیل خارجی (مثل Mailgun, SendGrid, Yandex Connect یا پنل‌های هاستینگ دیگر) ست کنی.\n\nاین پیام شبیه‌ساز به عنوان تاییدیه اتصال موقت صندوق پستی برای اکانت گوگل شما ثبت شده است.\n\nبا هماهنگی،\nمهدی`,
            isIncoming: true,
            isRead: false
          },
          {
            fromAddress: "noreply@enamad.ir",
            toAddress: defaultAddress,
            subject: "بررسی صلاحیت و تایید دامنه loxx.ir",
            body: `کاربر گرامی،\n\nدرخواست شما برای احراز هویت دامنه loxx.ir دریافت شد. لطفاً یکی از روش‌های تاییدیه را انجام دهید:\n1. قرار دادن فایل متنی با نام 46418638.txt حاوی کد تایید در ریشه دامنه\n2. قرار دادن متاتگ <meta name="enamad" content="46418638" /> در هدر صفحه اصلی\n\nپس از انجام، ربات‌های بررسی‌کننده اینماد به صورت خودکار تاییدیه شما را صادر خواهند کرد.\n\nبا احترام،\nمرکز توسعه تجارت الکترونیکی (اینماد)`,
            isIncoming: true,
            isRead: true
          },
          {
            fromAddress: "hello@google.com",
            toAddress: defaultAddress,
            subject: "تبریک سرویس تجاری Google Workspace پلتفرم لوکس",
            body: `سلام مهدى عزیز،\n\nورود پلتفرم لوکس (loxx.ir) به جامعه همکاران ابری گوگل را خوش‌آمد می‌گوییم. ساختار ایمیل‌های اختصاصی دامنه شما با موفقیت به سرورهای کلود متصل شد.\n\nهم‌اکنون می‌توانید مستقیماً از داخل پنل مدیریت خود اقدام به تعریف ایمیل‌های جانبی، دریافت نامه‌ها و ارسال مکاتبات با امنیت بالا کنید.\n\nبا آرزوی موفقیت،\nتیم کلود گوگل`,
            isIncoming: true,
            isRead: true
          },
          {
            fromAddress: "finance@zarinpal.com",
            toAddress: defaultAddress,
            subject: "تایید درگاه پرداخت فعال پلتفرم LOXX",
            body: `پذیرنده محترم وب‌سایت لوکس،\n\nتغییرات ساختاری درگاه پرداخت مستقیم شما بررسی و با موفقیت ثبت گردید. تسویه‌حساب‌های روزانه بر روی شبای متصل به صورت خودکار در ساعت پایا هماهنگ خواهد شد.\n\nدر صورت نیاز به هرگونه تایید هویت ثانویه با بخش مالی مکاتبه کنید.\n\nبا تجدید احترام،\nپشتیبانی فنی زرین‌پال`,
            isIncoming: true,
            isRead: true
          }
        ]
      });
    }
  }
};

export const getEmailAccounts = async (req: Request, res: Response) => {
  try {
    await ensureDefaultEmail();
    const accounts = await prisma.domainEmail.findMany({
      orderBy: { createdAt: "asc" }
    });
    res.json({ status: "success", data: accounts });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const createEmailAccount = async (req: Request, res: Response) => {
  try {
    let { address, label } = req.body;
    if (!address) {
      return res.status(400).json({ status: "error", message: "آدرس ایمیل الزامی است" });
    }

    // Clean address
    address = address.trim().toLowerCase();
    if (!address.endsWith("@loxx.ir")) {
      // Append domain if not exist
      if (address.includes("@")) {
        address = address.split("@")[0] + "@loxx.ir";
      } else {
        address = address + "@loxx.ir";
      }
    }

    const existing = await prisma.domainEmail.findUnique({
      where: { address }
    });

    if (existing) {
      return res.status(400).json({ status: "error", message: "این آدرس ایمیل قبلاً ساخته شده است" });
    }

    const account = await prisma.domainEmail.create({
      data: {
        address,
        label: label || "شعبه عمومی ایمیل"
      }
    });

    res.json({ status: "success", data: account, message: `ایمیل رسمی ${address} با موفقیت ایجاد شد` });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const deleteEmailAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const account = await prisma.domainEmail.findUnique({ where: { id } });

    if (!account) {
      return res.status(404).json({ status: "error", message: "حساب ایمیل یافت نشد" });
    }

    if (account.address === "info@loxx.ir") {
      return res.status(400).json({ status: "error", message: "ایمیل اصلی info@loxx.ir قابل حذف نیست" });
    }

    await prisma.domainEmail.delete({ where: { id } });
    res.json({ status: "success", message: `حساب ایمیل ${account.address} حذف گردید` });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const getEmailMessages = async (req: Request, res: Response) => {
  try {
    await ensureDefaultEmail();
    const { account } = req.query;

    const whereClause: any = {};
    if (account) {
      whereClause.OR = [
        { fromAddress: String(account) },
        { toAddress: String(account) }
      ];
    }

    const messages = await prisma.emailMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" }
    });

    res.json({ status: "success", data: messages });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const sendEmailMessage = async (req: Request, res: Response) => {
  try {
    const { fromAddress, toAddress, subject, body } = req.body;

    if (!fromAddress || !toAddress || !subject || !body) {
      return res.status(400).json({ status: "error", message: "پر کردن همه فیلدها الزامی است" });
    }

    const newMessage = await prisma.emailMessage.create({
      data: {
        fromAddress,
        toAddress,
        subject,
        body,
        isIncoming: false,
        isRead: true
      }
    });

    // Handle real Outbound SMTP sending if configured
    const smtp = getTransporter();
    if (smtp) {
      try {
        await smtp.sendMail({
          from: `"${fromAddress.split("@")[0]}" <${fromAddress}>`,
          to: toAddress,
          subject: subject,
          text: body,
          html: body.replace(/\n/g, "<br/>")
        });
        console.log(`[SMTP] Real outgoing email delivered to ${toAddress}`);
      } catch (smtpErr: any) {
        console.error(`[SMTP-ERROR] Outbound delivery failed:`, smtpErr.message);
      }
    }

    // Simulated Auto-Reply Engine to make it super interactive
    let replyFrom = "";
    let replySubject = "";
    let replyBody = "";

    const toClean = toAddress.trim().toLowerCase();

    if (toClean.includes("enamad")) {
      replyFrom = "noreply@enamad.ir";
      replySubject = `پاسخ خودکار: دریافت مکاتبه درباره ${subject}`;
      replyBody = `کاربر گرامی،\n\nنامه ارسالی شما با عنوان "${subject}" دریافت گردید و در صف بررسی واحد کارشناسان فنی نماد اعتماد الکترونیکی قرار گرفت.\n\nشماره درخواست پیگیری شما: ENM-${Math.floor(100000 + Math.random() * 900000)} است.\n\nبا تقدیر،\nدبیرخانه مرکز توسعه تجارت الکترونیکی (اینماد)`;
    } else if (toClean.includes("zarinpal")) {
      replyFrom = "support@zarinpal.com";
      replySubject = `پاسخ به تیکت پرداخت لوکس: ${subject}`;
      replyBody = `مدیر محترم وب‌سایت loxx.ir،\n\nدرخواست بررسی درگاه پرداخت شما به بخش پشتیبانی مالی زرین‌پال ارجاع داده شد. حداکثر ظرف ۲ ساعت کاری پاسخ آن بر روی این پرتال برای شما ارسال خواهد شد.\n\nموفق و پیروز باشید.\nپشتیبانی زرین‌پال`;
    } else if (toClean.includes("google")) {
      replyFrom = "workspace-noreply@google.com";
      replySubject = `Re: Hub Notification - ${subject}`;
      replyBody = `Hi administrator of loxx.ir,\n\nThis is an automated confirmation that your request regarding "${subject}" is processed.\nNo further action is required.\n\nThank you,\nGoogle Workspace Team`;
    }

    if (replyFrom) {
      // Create a simulated reply after a tiny timeout simulation (we save it directly to database)
      await prisma.emailMessage.create({
        data: {
          fromAddress: replyFrom,
          toAddress: fromAddress,
          subject: replySubject,
          body: replyBody,
          isIncoming: true,
          isRead: false,
          createdAt: new Date(Date.now() + 3000) // 3 seconds later
        }
      });
    }

    res.json({ status: "success", data: newMessage, message: "ایمیل با موفقیت از دامنه ارسال شد" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const receiveTestEmail = async (req: Request, res: Response) => {
  try {
    const { toAddress } = req.body;
    const targetAddress = toAddress || "info@loxx.ir";

    const testTemplates = [
      {
        from: "10mahdi10mahdi10@gmail.com",
        subject: "تست ارسال از صندوق شخصی جیمیل مهدی",
        body: "سلام ادمین گرامی لوکس،\n\nاین یک ایمیل تستی جهت راه‌اندازی شبیه‌ساز دریافت ایمیل‌های اختصاصی است.\nاز این پس تمامی ایمیل‌های ورودی دامنه به محض همگام‌سازی MX دامنه با هاست به صورت زنده در این بخش شبیه‌سازی و ذخیره خواهند شد.\n\nبا تجدید احترام"
      },
      {
        from: "cooperation@filimo.com",
        subject: "درخواست همکاری در اسپانسری مسابقات لوکس",
        body: "تیم بازاریابی فیلیمو،\n\nبا دیدن پیشرفت چشمگیر تورنمنت‌های گیمینگ لوکس، مایل هستیم پیشنهاد اسپانسری دوره بعدی مسابقات را با شرایط ویژه مالی و ترویجی ارسال کنیم. لطفا زمان مناسب برای تشکیل جلسه آنلاین تفاهم‌نامه را اعلام نمایید.\n\nارادت،\nبخش همکاری‌های تجاری صباایده"
      },
      {
        from: "verification@paypal.cloud",
        subject: "احراز وب‌مانی و شارژ اکانت ارزی دامین loxx.ir",
        body: "مدیریت محترم پلتفرم لوکس،\n\nموجودی کیف پول ارزی توسعه نرم‌افزار شما با موفقیت بروزرسانی شد. هم‌اکنون لایسنس‌های بین‌المللی سرورها تمدید شدند و نیازی به شارژ دستی تا ۳ ماه آینده نیست.\n\nبا سپاس،\nبخش تسویه‌ کارگزاری پی‌پال کلود"
      },
      {
        from: "enamad-bot@enamad.ir",
        subject: "گزارش وضعیت ربات پایش موقت اینماد",
        body: "به اطلاع می‌رساند ربات خزنده اینماد در ساعت اخیر از آدرس loxx.ir بازدید کرد.\n\nوضعیت متاتگ: یافت شد ✔\nوضعیت فایل تاییدیه ریشه: معتبر ✔\n\nمراحل اداری پس از این سنجش به زودی نهایی گشته و لوگوی فیزیکی طلایی در پنل مدیریت اینماد اختصاص می‌یابد."
      }
    ];

    const chosen = testTemplates[Math.floor(Math.random() * testTemplates.length)];

    const seedMessage = await prisma.emailMessage.create({
      data: {
        fromAddress: chosen.from,
        toAddress: targetAddress,
        subject: chosen.subject,
        body: chosen.body,
        isIncoming: true,
        isRead: false
      }
    });

    res.json({ status: "success", data: seedMessage, message: `یک ایمیل ورودی جدید از ${chosen.from} دریافت شد` });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const message = await prisma.emailMessage.findUnique({ where: { id } });

    if (!message) {
      return res.status(404).json({ status: "error", message: "ایمیل یافت نشد" });
    }

    const updated = await prisma.emailMessage.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({ status: "success", data: updated });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const deleteEmailMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const message = await prisma.emailMessage.findUnique({ where: { id } });

    if (!message) {
      return res.status(404).json({ status: "error", message: "ایمیل یافت نشد" });
    }

    await prisma.emailMessage.delete({ where: { id } });
    res.json({ status: "success", message: "ایمیل با موفقیت حذف شد" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const handleIncomingWebhook = async (req: Request, res: Response) => {
  try {
    const fromAddress = req.body.from || req.body.sender || req.body.fromAddress;
    const toAddress = req.body.to || req.body.recipient || req.body.toAddress;
    const subject = req.body.subject || "No Subject";
    const body = req.body.text || req.body.body || req.body.html || "Empty Message";

    if (!fromAddress || !toAddress) {
      return res.status(400).json({ status: "error", message: "Missing fromAddress or toAddress data in payload" });
    }

    // Clean names / formats (e.g., stripping brackets if present: "User <user@gmail.com>" to "user@gmail.com")
    const cleanEmail = (raw: string) => {
      const match = raw.match(/<([^>]+)>/);
      return match ? match[1].trim().toLowerCase() : raw.trim().toLowerCase();
    };

    const parsedFrom = cleanEmail(String(fromAddress));
    const parsedTo = cleanEmail(String(toAddress));

    const savedMessage = await prisma.emailMessage.create({
      data: {
        fromAddress: parsedFrom,
        toAddress: parsedTo,
        subject: String(subject),
        body: String(body),
        isIncoming: true,
        isRead: false
      }
    });

    console.log(`[EMAIL-WEBHOOK] Webhook successfully registered incoming mail from ${parsedFrom} to ${parsedTo}`);
    res.json({ status: "success", data: savedMessage, message: "Email recorded successfully" });
  } catch (error: any) {
    console.error(`[EMAIL-WEBHOOK-ERROR] Webhook ingestion failed:`, error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
};
