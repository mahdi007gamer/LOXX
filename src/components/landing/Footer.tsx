import React from "react";
import { Link } from "react-router-dom";
import { Gamepad2, Twitter, Github, MessageSquare, Instagram } from "lucide-react";
import { motion } from "motion/react";

export const Footer = () => {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-dark-bg/80 pb-12 pt-20">
      {/* Background Grid Lines */}
      <div className="absolute inset-x-0 bottom-0 -z-10 h-64 bg-[linear-gradient(rgba(160,32,240,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(160,32,240,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_top,black,transparent)]" />

      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Col */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <img src="/logo.png" alt="LOXX" className="h-10 w-auto drop-shadow-[0_0_10px_rgba(0,229,255,0.3)] transition-transform group-hover:scale-110" />
              <span className="text-2xl font-black tracking-tighter text-white">LOXX</span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-500">
              اولین و بزرگترین پلتفرم اجتماعی اختصاصی برای گیمرهای ایرانی. تجربه یک بازی حرفه‌ای با هماهنگی دقیق.
            </p>
            <div className="flex gap-4">
              {[Twitter, Instagram, Github].map((Icon, i) => (
                <button key={i} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-gray-500 transition-all hover:border-pink-500 hover:text-pink-500">
                  <Icon size={20} />
                </button>
              ))}
            </div>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="mb-6 font-bold text-white">پلتفرم</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/lobbies" className="hover:text-neon-blue transition-colors">اتاق‌های بازی</Link></li>
              <li><Link to="/lobbies" className="hover:text-neon-blue transition-colors">لابی‌های فعال</Link></li>
              <li><Link to="/chat" className="hover:text-neon-blue transition-colors">چت سراسری</Link></li>
              <li><Link to="/ranking" className="hover:text-neon-blue transition-colors">رتبه‌بندی کاربران</Link></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="mb-6 font-bold text-white">پشتیبانی</h4>
             <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/faq" className="hover:text-neon-pink transition-colors">سوالات متداول</Link></li>
              <li><Link to="/settings/support" className="hover:text-neon-pink transition-colors">گزارش خطا</Link></li>
              <li><Link to="/terms" className="hover:text-neon-pink transition-colors">قوانین و مقررات</Link></li>
              <li><Link to="/settings/support" className="hover:text-neon-pink transition-colors">تماس با ما</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-bold text-white">خبرنامه</h4>
            <p className="text-xs text-gray-500">با عضویت در خبرنامه از جدیدترین رویدادها مطلع شوید.</p>
            <div className="flex gap-2">
               <input 
                 type="email" 
                 placeholder="ایمیل شما..."
                 className="flex-1 rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs text-white focus:border-neon-pink/50 focus:outline-none"
               />
               <button className="rounded-lg bg-neon-pink px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(255,0,153,0.3)]">عضویت</button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-8 sm:flex-row">
           <p className="text-xs text-gray-600">© ۲۰۲۶ تمامی حقوق برای پلتفرم لوکس محفوظ است.</p>
           <div className="flex items-center gap-6">
              <Link to="/privacy" className="text-xs text-gray-600 hover:text-white">حریم خصوصی</Link>
              <Link to="/privacy" className="text-xs text-gray-600 hover:text-white">امنیت</Link>
           </div>
        </div>
      </div>

      {/* Pulsing Dot at bottom */}
      <motion.div 
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-neon-purple shadow-[0_0_10px_rgba(160,32,240,0.8)]" 
      />
    </footer>
  );
};
