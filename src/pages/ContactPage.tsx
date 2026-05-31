import React from "react";
import { motion } from "motion/react";
import { Phone, Mail, MapPin, Send, MessageSquare, Shield, HelpCircle } from "lucide-react";
import { Sidebar } from "../components/layout/Sidebar";
import { Footer } from "../components/landing/Footer";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { cn } from "../lib/utils";

export const ContactPage = () => {
  const { isSidebarCollapsed } = useAuth();
  const { direction } = useLanguage();
  const isRtl = direction === "rtl";

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />
      <div 
        className={cn(
          "flex-1 min-w-0 pb-32 md:pb-8 overflow-y-auto custom-scrollbar transition-all duration-300",
          isRtl 
            ? (!isSidebarCollapsed ? "md:mr-64" : "md:mr-20")
            : (!isSidebarCollapsed ? "md:ml-64" : "md:ml-20")
        )}
      >
        {/* Background Grid Accent */}
        <div className="absolute inset-0 -z-10 h-[50vh] bg-[linear-gradient(rgba(160,32,240,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(160,32,240,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        
        <div className="max-w-4xl mx-auto px-4 pt-28 pb-12" dir={isRtl ? "rtl" : "ltr"}>
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-blue/20 bg-neon-blue/5 text-neon-blue text-xs font-black tracking-widest uppercase italic mb-2">
              <MessageSquare size={14} className="animate-pulse" />
              <span>{isRtl ? "پشتیبانی شبانه روزی لوکس" : "LOXX 24/7 SUPPORT CONSOLE"}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic">
              {isRtl ? "ارتباط با ما" : "CONTACT US"}
            </h1>
            <p className="text-gray-400 font-medium max-w-xl mx-auto leading-relaxed">
              {isRtl 
                ? "پلتفرم گیمینگ لوکس همواره آماده شنیدن نظرات، پیشنهادات، انتقادات و پاسخگویی به سوالات شما گیمرهای عزیز است. از راه‌های زیر با ما در ارتباط باشید."
                : "LOXX gaming platform is always ready to receive your reviews, requests, and feedback. Feel free to connect with our operations team anytime via below methods."}
            </p>
          </motion.div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Telegram Channel Option */}
            <motion.div 
              initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 hover:border-neon-sky/30 hover:bg-white/[0.04] hover:shadow-[0_0_20px_rgba(0,229,255,0.15)] transition-all duration-300 flex items-start gap-4"
            >
              <div className="p-4 rounded-2xl bg-[#00e5ff]/10 text-neon-sky border border-[#00e5ff]/20">
                <Send size={24} />
              </div>
              <div className="space-y-2 mt-1 flex-1">
                <h3 className="text-lg font-black text-white">
                  {isRtl ? "کانال تلگرام" : "Telegram Channel"}
                </h3>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  {isRtl 
                    ? "جوین شدن به کانال رسمی ما جهت اطلاع از مسابقات و جوایز حامیان"
                    : "Join our official telegram workspace to keep updated on grand tournaments and support achievements"}
                </p>
                <div className="pt-2">
                  <a 
                    href="https://t.me/loxxiran" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 text-xs text-neon-sky font-bold hover:underline"
                  >
                    <span>@loxxiran</span>
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Support Email */}
            <motion.div 
              initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 hover:border-neon-pink/30 hover:bg-white/[0.04] hover:shadow-[0_0_20px_rgba(255,0,153,0.15)] transition-all duration-300 flex items-start gap-4"
            >
              <div className="p-4 rounded-2xl bg-[#ff0099]/10 text-neon-pink border border-[#ff0099]/20">
                <Mail size={24} />
              </div>
              <div className="space-y-2 mt-1 flex-1">
                <h3 className="text-lg font-black text-white">
                  {isRtl ? "پست الکترونیکی" : "Email Support"}
                </h3>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  {isRtl 
                    ? "ارسال تیکت مستقیم، ایمیل‌های سازمانی و درخواست‌های همکاری"
                    : "Send direct tickets, corporate proposals and partnership proposals to our desk."}
                </p>
                <div className="pt-2">
                  <a 
                    href="mailto:info@loxx.ir" 
                    className="inline-flex items-center gap-1.5 text-xs text-neon-pink font-bold hover:underline"
                  >
                    <span>info@loxx.ir</span>
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Phone Number */}
            <motion.div 
              initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 hover:border-[#10b981]/30 hover:bg-white/[0.04] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 flex items-start gap-4"
            >
              <div className="p-4 rounded-2xl bg-[#10b981]/10 text-emerald-400 border border-[#10b981]/20">
                <Phone size={24} />
              </div>
              <div className="space-y-2 mt-1 flex-1">
                <h3 className="text-lg font-black text-white">
                  {isRtl ? "شماره تماس پشتیبانی" : "Support Hotline"}
                </h3>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  {isRtl 
                    ? "پاسخگویی سریع ۲۴ ساعته در هفت روز هفته برای حل مشکلات لابی"
                    : "Fast round-the-clock telephone desk for instant lobby issues resolution."}
                </p>
                <div className="pt-2">
                  <a 
                    href="tel:09930893466" 
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold hover:underline"
                    dir="ltr"
                  >
                    <span>0993 089 3466</span>
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Address */}
            <motion.div 
              initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-8 hover:border-neon-purple/30 hover:bg-white/[0.04] hover:shadow-[0_0_20px_rgba(160,32,240,0.15)] transition-all duration-300 flex items-start gap-4"
            >
              <div className="p-4 rounded-2xl bg-[#a020f0]/10 text-neon-purple border border-[#a020f0]/20">
                <MapPin size={24} />
              </div>
              <div className="space-y-2 mt-1 flex-1">
                <h3 className="text-lg font-black text-white">
                  {isRtl ? "آدرس فیزیکی دفتر" : "Headquarters Address"}
                </h3>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  {isRtl 
                    ? "مراجعه حضوری با هماهنگی قبلی یا ارسال مکاتبات و بسته‌های پستی"
                    : "For legal documentation, corporate submissions and post courier parcels."}
                </p>
                <p className="text-xs text-white/90 font-bold pt-1 leading-relaxed">
                  {isRtl 
                    ? "کاشان، خیابان امیرکبیر، کوی سلمان، پلاک ۳۵" 
                    : "No 35, Salman Alley, Amirkabir St, Kashan, Iran"}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Core About LOXX Text Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-8 md:p-12 mb-16 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/5 blur-[120px] rounded-full -mr-20 -mt-20 -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-neon-blue/5 blur-[120px] rounded-full -ml-20 -mb-20 -z-10" />
            
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue border border-neon-blue/20">
                <Shield size={18} />
              </div>
              <h2 className="text-2xl font-black text-white italic">
                {isRtl ? "درباره پلتفرم امن لوکس (LOXX)" : "ABOUT THE SECURE LOXX PLATFORM"}
              </h2>
            </div>

            <p className="text-sm leading-relaxed text-gray-300 text-justify font-medium mb-6">
              {isRtl 
                ? "پلتفرم لوکس با کادری مجرب و متشکل از برترین توسعه‌دهندگان، معماران سیستم و برنامه‌نویسان گیم، پاسخگوی نیازهای کاربران ایرانی است. ما در لوکس با برقراری زیرساختی کاملا بهینه و بومی‌سازی شده، امکان رقابت عادلانه، ثبت دستاوردها، گفتگوهای متقابل و تجربه ایمن کاربران از سرویس‌ها را مهیا ساخته‌ایم."
                : "LOXX platform, powered by leading developers, gaming system engineers and designers, fulfills the needs of modern gamers. We establish fully optimized, low-latency, secure infrastructure providing fair matchmaking tournaments, continuous track of match achievements, interactive channels and premium services."}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-xs text-gray-400 font-bold border-t border-white/5 pt-6">
              <span className="flex items-center gap-1.5">
                <Shield size={14} className="text-neon-blue" /> 
                {isRtl ? "امنیت تضمین‌شده کاربران" : "Guaranteed Privacy"}
              </span>
              <span className="flex items-center gap-1.5">
                <HelpCircle size={14} className="text-neon-pink" /> 
                {isRtl ? "پشتیبانی مستقیم سیستم" : "Direct Console Support"}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare size={14} className="text-emerald-400" /> 
                {isRtl ? "ارتباط بیواسطه در سراسر کشور" : "Lag-free Nationwide Communication"}
              </span>
            </div>
          </motion.div>
        </div>
        <Footer />
      </div>
    </div>
  );
};
