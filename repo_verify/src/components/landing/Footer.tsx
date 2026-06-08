import React from "react";
import { Link } from "react-router-dom";
import { Gamepad2, Twitter, Github, MessageSquare, Instagram, Globe } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../../context/LanguageContext";

export const Footer = () => {
 const { direction } = useLanguage();
 const isRtl = direction === "rtl";

 return (
 <footer className="relative overflow-hidden border-t border-white/10 bg-dark-bg/80 pb-12 pt-20" dir={isRtl ? "rtl" : "ltr"}>
 {/* Background Grid Lines */}
 <div className="absolute inset-x-0 bottom-0 -z-10 h-64 bg-[linear-gradient(rgba(160,32,240,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(160,32,240,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:linear-gradient(to_top,black,transparent)]" />

 <div className="container mx-auto max-w-7xl px-4">
 <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
 {/* Brand Col */}
 <div className="space-y-6">
 <Link to="/" className="flex items-center gap-3 group">
 <img src="/logo.png" alt="LOXX" className="h-10 w-auto drop-shadow-[0_0_10px_rgba(0,229,255,0.3)] transition-transform group-hover:scale-110" />
 <span className="text-2xl font-black text-white">LOXX</span>
 </Link>
 <p className="text-sm leading-relaxed text-gray-400 font-medium">
 {isRtl 
 ? "لوکس اولین و پیشرفته ترین پلتفرم فارسی گیمینگ" 
 : "LOXX: The premier fully optimized, lag-free and secure bilingual gaming platform."}
 </p>
 <div className="flex flex-col gap-3 pt-2">
 <span className="text-[10px] text-gray-600 font-extrabold uppercase">
 {isRtl ? "شبکه‌های اجتماعی و مجوزها" : "SOCIALS & CERTIFICATIONS"}
 </span>
 <div className="flex gap-3 items-center flex-wrap">
 <a 
 href="https://ble.ir/loxxir" 
 target="_blank" 
 rel="noopener noreferrer"
 className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all duration-300 group/bale cursor-pointer"
 title={isRtl ? "کانال بله لوکس" : "LOXX Bale Channel"}
 >
 <svg 
 viewBox="0 0 24 24" 
 fill="currentColor" 
 className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover/bale:scale-110"
 >
 <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.98 4.27L1.15 21.8c-.28.82.55 1.65 1.37 1.37l5.53-1.83C9.35 21.78 10.66 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
 </svg>
 <span className="text-xs font-black ">
 {isRtl ? "کانال رسمی بله" : "Official Bale.ir Channel"}
 </span>
 </a>

 {/* eNamad Trust Seal */}
 <a 
 referrerPolicy="origin" 
 target="_blank" 
 href="https://trustseal.enamad.ir/?id=735467&Code=c4De5lsIGSFVCL5jyQCXrTXX9hVa9lWB"
 className="inline-block bg-white/90 p-1.5 rounded-2xl hover:bg-white transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.5)] cursor-pointer"
 >
 <img 
 referrerPolicy="origin" 
 src="https://trustseal.enamad.ir/logo.aspx?id=735467&Code=c4De5lsIGSFVCL5jyQCXrTXX9hVa9lWB" 
 alt="نماد اعتماد الکترونیکی" 
 className="h-10 w-10 object-contain block"
 style={{ cursor: "pointer" }}
 />
 </a>
 </div>
 </div>
 </div>

 {/* Links 1 */}
 <div>
 <h4 className="mb-6 font-bold text-white">
 {isRtl ? "پلتفرم" : "PLATFORM"}
 </h4>
 <ul className="space-y-4 text-sm text-gray-500">
 <li><Link to="/lobbies" className="hover:text-neon-blue transition-colors">{isRtl ? "اتاق‌های بازی" : "Game Hubs"}</Link></li>
 <li><Link to="/lobbies" className="hover:text-neon-blue transition-colors">{isRtl ? "لابی‌های فعال" : "Active Lobbies"}</Link></li>
 <li><Link to="/chat" className="hover:text-neon-blue transition-colors">{isRtl ? "چت سراسری" : "Global Chat"}</Link></li>
 <li><Link to="/ranking" className="hover:text-neon-blue transition-colors">{isRtl ? "رتبه‌بندی کاربران" : "Hall of Champions"}</Link></li>
 </ul>
 </div>

 {/* Links 2 */}
 <div>
 <h4 className="mb-6 font-bold text-white">
 {isRtl ? "پشتیبانی" : "SUPPORT"}
 </h4>
 <ul className="space-y-4 text-sm text-gray-500">
 <li><Link to="/faq" className="hover:text-neon-pink transition-colors">{isRtl ? "سوالات متداول" : "FAQs"}</Link></li>
 <li><Link to="/settings/support" className="hover:text-neon-pink transition-colors">{isRtl ? "گزارش خطا" : "Report Bugs"}</Link></li>
 <li><Link to="/terms" className="hover:text-neon-pink transition-colors">{isRtl ? "قوانین و مقررات" : "Terms & Policies"}</Link></li>
 <li><Link to="/settings/support" className="hover:text-neon-pink transition-colors">{isRtl ? "تماس با ما" : "Contact Operations"}</Link></li>
 </ul>
 </div>

 {/* Newsletter */}
 <div className="space-y-4">
 <h4 className="font-bold text-white">
 {isRtl ? "خبرنامه" : "NEWSLETTER"}
 </h4>
 <p className="text-xs text-gray-500">
 {isRtl ? "با عضویت در خبرنامه از جدیدترین رویدادها مطلع شوید." : "Get instant dispatch of upcoming tournaments and features."}
 </p>
 <div className="flex gap-2">
 <input 
 type="email" 
 placeholder={isRtl ? "ایمیل شما..." : "Your email..."}
 className="flex-1 rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs text-white focus:border-neon-pink/50 focus:outline-none"
 />
 <button className="rounded-lg bg-neon-pink px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(255,0,153,0.3)]">
 {isRtl ? "عضویت" : "Subscribe"}
 </button>
 </div>
 </div>
 </div>

 {/* Copyright */}
 <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-8 sm:flex-row">
 <p className="text-xs text-gray-600">
 {isRtl 
 ? "© ۲۰۲۶ تمامی حقوق برای پلتفرم لوکس محفوظ است." 
 : "© 2026 LOXX Platform. All rights reserved."}
 </p>
 <div className="flex items-center gap-6">
 <Link to="/privacy" className="text-xs text-gray-600 hover:text-white">{isRtl ? "حریم خصوصی" : "Privacy"}</Link>
 <Link to="/privacy" className="text-xs text-gray-600 hover:text-white">{isRtl ? "امنیت" : "Security"}</Link>
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
