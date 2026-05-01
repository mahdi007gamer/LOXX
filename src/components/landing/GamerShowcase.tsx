import React from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { NeonCard } from "../ui/NeonCard";
import { User, Trophy, ShieldCheck, Zap } from "lucide-react";

export const GamerShowcase = () => {
  const { scrollYProgress } = useScroll();
  const x = useTransform(scrollYProgress, [0.3, 0.6], [100, 0]);
  const rotate = useTransform(scrollYProgress, [0.3, 0.6], [5, 0]);

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center gap-16 lg:flex-row">
          {/* Character Illustration Area */}
          <motion.div 
            style={{ x, rotate }}
            className="relative w-full max-w-md lg:w-1/2"
          >
            <div className="relative aspect-square overflow-hidden rounded-[2rem] border-2 border-neon-blue/30 bg-dark-card shadow-[0_0_50px_rgba(0,229,255,0.2)]">
                {/* Simulated Gamer Illustration using icons and effects */}
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon-blue/10 via-dark-bg to-neon-pink/10">
                   <div className="relative">
                      <motion.div 
                        animate={{ 
                           scale: [1, 1.1, 1],
                           opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute -inset-10 blur-3xl bg-neon-blue/20 rounded-full" 
                      />
                      <User size={180} className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]" />
                      
                      {/* Floating tech bits */}
                      <motion.div 
                        animate={{ y: [0, -20, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute -top-10 -right-10 p-4 bg-neon-pink/20 rounded-2xl border border-neon-pink/30 text-neon-pink"
                      >
                         <Trophy size={32} />
                      </motion.div>
                   </div>
                </div>
                
                {/* Overlay Textures */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent" />
            </div>
            
            {/* Corner Details */}
            <div className="absolute -bottom-6 -left-6 z-10 rounded-2xl border border-neon-pink/50 bg-dark-bg/80 p-6 backdrop-blur-xl shadow-2xl">
               <div className="flex items-center gap-3">
                  <div className="h-4 w-4 animate-pulse rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                  <span className="text-lg font-bold text-white">۱۲,۴۸۰ گیمر آنلاین</span>
               </div>
            </div>
          </motion.div>

          <div className="flex-1 space-y-8 text-right lg:text-right">
             <motion.div
               initial={{ opacity: 0, x: -50 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
             >
                <h2 className="text-4xl font-black text-white sm:text-5xl lg:text-6xl">
                  به دنیای <span className="neon-text-pink">نامحدود</span> لوکس ملحق شوید
                </h2>
                <p className="mt-8 text-xl leading-relaxed text-gray-400">
                  لوکس فقط یک پلتفرم نیست؛ یک اکوسیستم کامل برای گیمرهایی است که به دنبال پیشرفت، رقابت و برقراری ارتباط با دیگران هستند.
                </p>
             </motion.div>

             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {[
                  { icon: ShieldCheck, label: "امنیت حرفه‌ای", val: "تایید هویت دو مرحله‌ای" },
                  { icon: Zap, label: "سرعت خیره‌کننده", val: "سرورهای ایران با کمترین پینگ" }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-start gap-3 rounded-2xl border border-white/5 bg-white/5 p-6 hover:bg-white/10 transition-colors">
                     <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-neon-blue/10 text-neon-blue">
                        <item.icon size={24} />
                     </div>
                     <h4 className="font-bold text-white">{item.label}</h4>
                     <p className="text-xs text-gray-500">{item.val}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};
