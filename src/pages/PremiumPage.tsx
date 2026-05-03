import React from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { 
  Check, Crown, Zap, Star, Shield, 
  MessageSquare, Users, Image, Sparkles, 
  ArrowRight, Layout
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";

const PLAN_FEATURES = {
  plus: [
    { icon: <Image size={18} />, label: "Animated Avatar (GIF)", detail: "استفاده از گیف برای عکس پروفایل" },
    { icon: <Layout size={18} />, label: "Mini Profile Banner", detail: "بنر اختصاصی برای مینی پروفایل" },
    { icon: <MessageSquare size={18} />, label: "Exclusive Stickers", detail: "استکیرهای متحرک و خاص در چت" },
    { icon: <Sparkles size={18} />, label: "Special Reactions", detail: "ریاکشن‌های نئونی روی پیام‌ها" },
    { icon: <Users size={18} />, label: "Quick Invite", detail: "دعوت سریع تمام دوستان به لابی" },
    { icon: <Zap size={18} />, label: "Priority Lobbies", detail: "اولویت نمایش لابی در لیست" },
    { icon: <Shield size={18} />, label: "LOXX Plus Badge", detail: "نشان مخصوص پلاس کنار نام کاربر" },
  ],
  vip: [
    { icon: <Crown size={18} />, label: "Golden Animated Ring", detail: "حلقه طلایی متحرک دور پروفایل" },
    { icon: <Star size={18} />, label: "VIP Profile Banner", detail: "بنر اختصاصی و گیف در پروفایل" },
    { icon: <MessageSquare size={18} />, label: "Message Effects", detail: "افکت نوری هنگام ارسال پیام" },
    { icon: <Sparkles size={18} />, label: "Gradient Username", detail: "نام کاربری با رنگ‌های گرادینت" },
    { icon: <Shield size={18} />, label: "VIP Crown Badge", detail: "نشان تاج طلایی VIP" },
    { icon: <Users size={18} />, label: "VIP Only Lobbies", detail: "قابلیت ساخت لابی‌های اختصاصی VIP" },
    { icon: <Crown size={18} />, label: "All Plus features", detail: "شامل تمام امکانات نسخه پلاس" },
  ]
};

export const PremiumPage = () => {
  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#050507]">
      <Sidebar />
      <main className="flex-1 px-4 py-8 md:mr-64 lg:px-8 pb-32 md:pb-8">
        <div className="container mx-auto max-w-6xl">
          <header className="mb-16 text-center">
             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-purple/20 border border-neon-purple/30 text-neon-purple text-[10px] font-black uppercase tracking-widest mb-6 italic"
             >
               <Sparkles size={14} className="animate-pulse" />
               تجربه نسل جدید گیمینگ
             </motion.div>
             <h1 className="text-4xl md:text-7xl font-black text-white italic uppercase tracking-tighter mb-4">ارتقای سطح کاربری</h1>
             <p className="text-gray-500 max-w-2xl mx-auto font-bold">برای حمایت از لوکس و باز کردن قابلیت‌های استثنایی، یکی از اشتراک‌های ویژه را انتخاب کنید.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start mb-20">
            {/* LOXX PLUS */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <NeonCard variant="blue" className="p-8 md:p-12 bg-dark-card/50 backdrop-blur-2xl border-white/5 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all">
                    <Zap size={200} className="rotate-12" />
                 </div>
                 
                 <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                       <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">LOXX PLUS</h2>
                       <p className="text-neon-blue font-bold uppercase text-xs tracking-widest">تجربه ارتقا یافته</p>
                    </div>
                    <div className="text-right">
                       <span className="text-3xl font-black text-white italic">۴.۹۹$</span>
                       <span className="text-gray-500 text-xs font-bold block italic uppercase">ماهانه</span>
                    </div>
                 </div>

                 <div className="space-y-4 mb-10 relative z-10">
                    {PLAN_FEATURES.plus.map((feature, i) => (
                      <div key={i} className="flex gap-4 items-start">
                         <div className="h-6 w-6 shrink-0 rounded-full bg-neon-blue/10 flex items-center justify-center text-neon-blue">
                            <Check size={14} />
                         </div>
                         <div>
                            <p className="text-sm font-black text-white italic uppercase tracking-tight">{feature.label}</p>
                            <p className="text-[10px] text-gray-500 font-bold">{feature.detail}</p>
                         </div>
                      </div>
                    ))}
                 </div>

                 <GlowButton variant="blue" className="w-full py-5 text-sm font-black uppercase italic tracking-widest relative z-10">
                    دریافت پلاس <ArrowRight size={18} className="mr-2 inline" />
                 </GlowButton>
                 
                 <div className="mt-6 flex items-center justify-center gap-6 relative z-10">
                    <div className="flex items-center gap-2">
                       <div className="h-6 w-6 rounded-full border-2 border-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
                       <span className="text-[10px] text-gray-400 font-bold uppercase">Blue Ring</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-neon-blue font-black uppercase italic tracking-widest">PLUS BADGE</span>
                    </div>
                 </div>
              </NeonCard>
            </motion.div>

            {/* LOXX VIP */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <NeonCard variant="purple" className="p-8 md:p-12 bg-[#12051a]/50 backdrop-blur-2xl border-yellow-400/20 relative overflow-hidden group shadow-[0_0_60px_rgba(168,85,247,0.1)]">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all">
                    <Crown size={200} className="rotate-12" />
                 </div>
                 
                 <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                       <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">LOXX VIP</h2>
                       <p className="text-yellow-400 font-bold uppercase text-xs tracking-widest">سطح نخبگان لوکس</p>
                    </div>
                    <div className="text-right">
                       <span className="text-3xl font-black text-white italic">۹.۹۹$</span>
                       <span className="text-gray-500 text-xs font-bold block italic uppercase">ماهانه</span>
                    </div>
                 </div>

                 <div className="space-y-4 mb-10 relative z-10">
                    {PLAN_FEATURES.vip.map((feature, i) => (
                      <div key={i} className="flex gap-4 items-start">
                         <div className="h-6 w-6 shrink-0 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400">
                            <Check size={14} />
                         </div>
                         <div>
                            <p className="text-sm font-black text-white italic uppercase tracking-tight">{feature.label}</p>
                            <p className="text-[10px] text-gray-500 font-bold">{feature.detail}</p>
                         </div>
                      </div>
                    ))}
                 </div>

                 <GlowButton variant="pink" className="w-full py-5 text-sm font-black uppercase italic tracking-widest relative z-10 bg-gradient-to-r from-neon-purple to-neon-pink">
                    دریافت VIP <Crown size={18} className="mr-2 inline" />
                 </GlowButton>

                 <div className="mt-6 flex items-center justify-center gap-6 relative z-10">
                    <motion.div 
                      animate={{ boxShadow: ["0 0 10px rgba(250,204,21,0.3)", "0 0 25px rgba(250,204,21,0.6)", "0 0 10px rgba(250,204,21,0.3)"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="flex items-center gap-2"
                    >
                       <div className="h-6 w-6 rounded-full border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                       <span className="text-[10px] text-yellow-400 font-bold uppercase">Gold Ring</span>
                    </motion.div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-yellow-400 font-black uppercase italic tracking-widest">GOLD CROWN BADGE</span>
                    </div>
                 </div>
              </NeonCard>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
             <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-xl text-center">
                <div className="h-12 w-12 rounded-2xl bg-neon-blue/10 flex items-center justify-center text-neon-blue mx-auto mb-4">
                  <Shield size={24} />
                </div>
                <h4 className="text-white font-black uppercase italic mb-2">پرداخت امن</h4>
                <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">تمام تراکنش‌ها رمزنگاری شده و امن هستند.</p>
             </div>
             <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-xl text-center">
                <div className="h-12 w-12 rounded-2xl bg-neon-pink/10 flex items-center justify-center text-neon-pink mx-auto mb-4">
                  <Sparkles size={24} />
                </div>
                <h4 className="text-white font-black uppercase italic mb-2">فعال‌سازی آنی</h4>
                <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">اشتراک شما بلافاصله پس از خرید فعال خواهد شد.</p>
             </div>
             <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-xl text-center">
                <div className="h-12 w-12 rounded-2xl bg-neon-purple/10 flex items-center justify-center text-neon-purple mx-auto mb-4">
                  <Users size={24} />
                </div>
                <h4 className="text-white font-black uppercase italic mb-2">حمایت از لوکس</h4>
                <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">با خرید اشتراک به رشد پلتفرم کمک می‌کنید.</p>
             </div>
          </div>
          
          <div className="text-center p-12 rounded-[40px] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 relative overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.05),transparent_70%)]" />
             <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4 relative z-10">برنامه معرفی دوستان</h3>
             <p className="text-gray-500 max-w-sm mx-auto font-bold mb-8 relative z-10">
                اگر کسی با لینک دعوت شما ثبت نام کند، هر دوی شما ۳ روز اکانت PLUS رایگان دریافت می‌کنید.
             </p>
             <GlowButton variant="blue" className="px-10 py-4 text-xs font-black uppercase italic tracking-widest relative z-10">
                ایجاد لینک دعوت
             </GlowButton>
          </div>
        </div>
      </main>
    </div>
  );
};
