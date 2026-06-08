import React from "react";
import { motion } from "motion/react";
import { NeonCard } from "../ui/NeonCard";
import { MessageSquare, Users, Target, Zap } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useLanguage } from "../../context/LanguageContext";

export const FeatureSection = () => {
 const { direction } = useLanguage();
 const isRtl = direction === "rtl";

 const features = [
 {
 title: isRtl ? "چت سراسری بلادرنگ" : "Real-time Global Chat",
 desc: isRtl 
 ? "با تمام گیمرهای ایران به صورت لحظه‌ای تبادل نظر کنید. محیطی امن و کاملاً فارسی."
 : "Trade tactics and banter with players nationwide in real-time. Secure and moderated.",
 icon: MessageSquare,
 color: "blue" as const,
 glow: "bg-neon-blue",
 },
 {
 title: isRtl ? "مدیریت لابی حرفه‌ای" : "High-tier Lobby Hubs",
 desc: isRtl 
 ? "برای بازی‌های محبوب خود لابی بسازید یا به لابی دیگران بپیوندید. هماهنگی تیم در سریع‌ترین زمان."
 : "Instantly create or join active game rooms for your favorites. Fast-track your squad coordination.",
 icon: Target,
 color: "pink" as const,
 glow: "bg-neon-pink",
 },
 {
 title: isRtl ? "جامعه گیمرهای فعال" : "Vibrant Gamer Society",
 desc: isRtl 
 ? "دوستان جدید پیدا کنید، تیم تشکیل دهید و در رقابت‌های هفتگی شرکت کنید."
 : "Team up with like-minded players, expand your friends list, and field contenders to weekly matches.",
 icon: Users,
 color: "purple" as const,
 glow: "bg-neon-purple",
 },
 {
 title: isRtl ? "سرعت و پایداری بالا" : "Supercharged Performance",
 desc: isRtl 
 ? "زیرساخت قدرتمند با کمترین تاخیر ممکن برای تجربه‌ای روان در بازی‌ها."
 : "Squeeze the frame rates with optimized low-ping servers tailored for seamless gaming.",
 icon: Zap,
 color: "blue" as const,
 glow: "bg-neon-blue",
 },
 ];

 return (
 <section className="relative py-32 overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
 <div className="container mx-auto max-w-6xl px-4">
 <div className="mb-20 text-center">
 <motion.h2 
 initial={{ opacity: 0, scale: 0.9 }}
 whileInView={{ opacity: 1, scale: 1 }}
 viewport={{ once: true }}
 className="text-4xl font-black text-white sm:text-5xl"
 >
 {isRtl ? (
 <>قابلیت‌های منحصر به فرد <span className="neon-text-blue">لوکس</span></>
 ) : (
 <>State-of-the-Art <span className="neon-text-blue">LOXX</span> Features</>
 )}
 </motion.h2>
 <motion.div 
 initial={{ width: 0 }}
 whileInView={{ width: "100px" }}
 viewport={{ once: true }}
 className="mx-auto mt-6 h-1 w-24 rounded-full bg-gradient-to-r from-neon-blue to-neon-pink shadow-[0_0_15px_rgba(0,229,255,0.5)]" 
 />
 </div>

 <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
 {features.map((feature, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.1 }}
 >
 <NeonCard 
 variant={feature.color} 
 className="group relative flex items-start gap-6 p-8 transition-all hover:bg-white/[0.05]"
 >
 <div className={cn(
 "relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white transition-all duration-500 group-hover:scale-110",
 feature.color === "blue" && "group-hover:neon-border-blue group-hover:text-neon-blue",
 feature.color === "pink" && "group-hover:neon-border-pink group-hover:text-neon-pink",
 feature.color === "purple" && "group-hover:shadow-[0_0_20px_rgba(160,32,240,0.5)] group-hover:text-neon-purple",
 )}>
 <feature.icon size={32} />
 <div className={cn(
 "absolute inset-0 -z-10 blur-xl opacity-0 transition-opacity group-hover:opacity-40",
 feature.glow
 )} />
 </div>
 
 <div className={cn("flex-1 min-w-0", isRtl ? "text-right" : "text-left")}>
 <h3 className="mb-3 text-2xl font-bold text-white transition-colors group-hover:text-white">
 {feature.title}
 </h3>
 <p className="leading-relaxed text-gray-400 group-hover:text-gray-300">
 {feature.desc}
 </p>
 </div>
 </NeonCard>
 </motion.div>
 ))}
 </div>
 </div>
 </section>
 );
};
