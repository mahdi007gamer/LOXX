import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { 
  Trophy, Medal, Star, ArrowUp, User, Clock, 
  Crown, Zap, Flame, Target, MessageCircle, 
  UserPlus, Info
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";

const TOP_PLAYERS = [
  { id: 1, name: "Sina_King", rank: 1, points: 12450, winRate: "84%", avatar: "👑", status: "VIP", color: "text-yellow-400" },
  { id: 2, name: "Ali_Gamer", rank: 2, points: 11900, winRate: "76%", avatar: "🥈", status: "PLUS", color: "text-gray-300" },
  { id: 3, name: "Sara_Player", rank: 3, points: 10200, winRate: "72%", avatar: "🥉", status: "PLUS", color: "text-orange-400" },
];

const RANKINGS = [
  { id: 4, name: "Mohammad_Pro", rank: 4, points: 9800, status: "NONE", trend: "up" },
  { id: 5, name: "Arash_Zero", rank: 5, points: 9450, status: "NONE", trend: "down" },
  { id: 6, name: "Reza_Gamer", rank: 6, points: 9100, status: "PLUS", trend: "up" },
  { id: 7, name: "Tina_X", rank: 7, points: 8900, status: "NONE", trend: "stable" },
  { id: 8, name: "Gamer_Boy", rank: 8, points: 8500, status: "NONE", trend: "up" },
];

const SCORING_RULES = [
  { icon: <Crown size={16} />, label: "ساخت لابی موفق", points: "+30", detail: "پر شدن کامل اعضا" },
  { icon: <Target size={16} />, label: "تکمیل بازی", points: "+25", detail: "انجام کامل دست بازی" },
  { icon: <UserPlus size={16} />, label: "دعوت دوستان", points: "+20", detail: "دعوت موفق به لابی" },
  { icon: <Zap size={16} />, label: "ساخت لابی", points: "+15", detail: "شروع لابی جدید" },
  { icon: <Flame size={16} />, label: "پیوستن به لابی", points: "+10", detail: "عضویت در تیم دیگران" },
  { icon: <MessageCircle size={16} />, label: "فعالیت در چت", points: "+2", detail: "ارسال پیام و تعامل" },
];

export const LeaderboardPage = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 12, minutes: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59 };
        return prev;
      });
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#050507]">
      <Sidebar />
      <main className="flex-1 px-4 py-8 md:mr-64 lg:px-8 pb-32 md:pb-8">
        <div className="container mx-auto max-w-6xl">
          <header className="mb-12 flex flex-col items-center justify-between gap-8 md:flex-row md:mb-16">
            <div className="text-center md:text-right">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-neon-blue/20 flex items-center justify-center text-neon-blue shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                  <Trophy size={24} />
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter italic uppercase">قهرمانان هفته لوکس</h1>
              </div>
              <p className="text-gray-500 font-bold max-w-md">هر هفته ۳ نفر برتر لابی‌های لوکس جوایز ویژه و اشتراک VIP دریافت می‌کنند.</p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-3">
               <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 px-6 shadow-2xl backdrop-blur-md">
                 <Clock className="text-neon-pink animate-pulse" size={20} />
                 <div className="flex items-center gap-4">
                   <div className="text-center">
                     <span className="block text-2xl font-black text-white">{timeLeft.days}</span>
                     <span className="text-[10px] text-gray-400 uppercase font-bold">روز</span>
                   </div>
                   <div className="h-8 w-[1px] bg-white/10" />
                   <div className="text-center">
                     <span className="block text-2xl font-black text-white">{timeLeft.hours}</span>
                     <span className="text-[10px] text-gray-400 uppercase font-bold">ساعت</span>
                   </div>
                   <div className="h-8 w-[1px] bg-white/10" />
                   <div className="text-center">
                     <span className="block text-2xl font-black text-white">{timeLeft.minutes}</span>
                     <span className="text-[10px] text-gray-400 uppercase font-bold">دقیقه</span>
                   </div>
                 </div>
               </div>
               <p className="text-[10px] text-neon-pink font-black uppercase tracking-widest italic">تا ریست امتیازات هفتگی</p>
            </div>
          </header>

          {/* Top 3 Rankings */}
          <div className="mb-24 flex flex-col sm:flex-row items-center sm:items-end justify-center gap-6 md:gap-10 relative">
             <div className="absolute inset-0 bg-neon-blue/5 blur-[120px] rounded-full pointer-events-none" />
             
             {/* Rank 2 */}
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="order-2 sm:order-1 relative z-10 w-full max-w-[280px]"
             >
                <NeonCard variant="blue" className="flex flex-col items-center p-6 text-center bg-[#0a0a0f]/80 backdrop-blur-xl border-white/5 hover:border-neon-blue/30 transition-all pt-10">
                 <div className="h-28 w-28 rounded-full border-4 border-gray-400/20 bg-white/5 mb-4 flex items-center justify-center text-gray-400 relative group p-1">
                    <div className="absolute -top-1 -right-1 h-10 w-10 rounded-2xl bg-gray-400/20 flex items-center justify-center text-gray-300 border border-white/10 shadow-xl z-20 backdrop-blur-md">
                       <Medal size={20} />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-gray-400/5 blur-[20px] opacity-0 group-hover:opacity-100 transition-all" />
                    <div className="w-full h-full rounded-full bg-dark-bg flex items-center justify-center overflow-hidden border border-white/5">
                      <User size={48} className="relative z-10 text-gray-500" />
                    </div>
                 </div>
                 <h3 className="text-xl font-black text-white uppercase italic tracking-tight">{TOP_PLAYERS[1].name}</h3>
                 <p className="text-neon-blue font-black text-lg mt-1">{TOP_PLAYERS[1].points.toLocaleString()}</p>
                 <div className="mt-6 flex flex-col gap-1 italic w-full">
                    <span className="text-[10px] text-gray-500 font-black uppercase mb-1">جایزه:</span>
                    <span className="text-xs text-white font-bold bg-white/5 px-4 py-2 rounded-xl border border-white/5 shadow-xl block">۳ روز اشتراک VIP</span>
                 </div>
               </NeonCard>
             </motion.div>

             {/* Rank 1 */}
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="order-1 sm:order-2 relative z-20 w-full max-w-[320px]"
             >
               <NeonCard variant="purple" className="flex flex-col items-center p-10 text-center relative border-yellow-400/40 bg-[#12051a]/90 shadow-[0_0_60px_rgba(250,204,21,0.2)] rounded-[40px] pt-16">
                 <motion.div 
                   animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
                   transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute -top-12 left-1/2 -translate-x-1/2 text-7xl drop-shadow-[0_10px_20px_rgba(250,204,21,0.5)] z-30 pointer-events-none"
                 >
                   👑
                 </motion.div>
                 
                 <div className="relative mb-8 flex items-center justify-center">
                    {/* Centered Dash Circle */}
                    <motion.div 
                       animate={{ rotate: 360 }}
                       transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                       className="absolute -inset-3 border-2 border-dashed border-yellow-400/30 rounded-full"
                    />
                    <motion.div 
                       animate={{ rotate: -360 }}
                       transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                       className="absolute -inset-1 border border-yellow-400/20 rounded-full opacity-30"
                    />
                    
                    <div className="h-36 w-36 rounded-full border-4 border-yellow-400/80 bg-dark-bg flex items-center justify-center text-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.4)] relative z-10 p-1">
                       <div className="w-full h-full rounded-full bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
                          <User size={80} />
                       </div>
                    </div>
                 </div>
                 
                 <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                    {TOP_PLAYERS[0].name}
                 </h3>
                 <p className="text-4xl text-yellow-400 font-black italic mt-2 tracking-tight">{TOP_PLAYERS[0].points.toLocaleString()}</p>
                 
                 <div className="mt-8 rounded-2xl bg-yellow-400 px-10 py-3.5 text-sm font-black text-dark-bg shadow-[0_15px_30px_rgba(250,204,21,0.4)] uppercase italic tracking-widest">
                   WEEKLY CHAMPION
                 </div>
                 
                 <div className="mt-10 flex flex-col items-center border-t border-white/5 pt-6 w-full">
                    <span className="text-[10px] text-gray-500 font-black uppercase mb-4 tracking-widest">پاداش ویژه قهرمانی</span>
                    <div className="flex gap-4">
                       <div className="h-12 w-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 shadow-xl" title="7 Days VIP"><Clock size={24} /></div>
                       <div className="h-12 w-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 shadow-xl" title="Golden Crown Badge"><Crown size={24} /></div>
                       <div className="h-12 w-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 shadow-xl" title="Featured"><Star size={24} /></div>
                    </div>
                 </div>
               </NeonCard>
             </motion.div>

             {/* Rank 3 */}
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="order-3 relative z-10 w-full max-w-[280px]"
             >
               <NeonCard variant="pink" className="flex flex-col items-center p-6 text-center bg-[#0a0a0f]/80 backdrop-blur-xl border-white/5 hover:border-neon-pink/30 transition-all pt-10">
                 <div className="h-28 w-28 rounded-full border-4 border-orange-400/20 bg-white/5 mb-4 flex items-center justify-center text-orange-400 relative group p-1">
                    <div className="absolute -top-1 -right-1 h-10 w-10 rounded-2xl bg-orange-400/20 flex items-center justify-center text-orange-400 border border-white/10 shadow-xl z-20 backdrop-blur-md">
                       <Medal size={20} />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-orange-400/5 blur-[20px] opacity-0 group-hover:opacity-100 transition-all" />
                    <div className="w-full h-full rounded-full bg-dark-bg flex items-center justify-center overflow-hidden border border-white/5">
                      <User size={48} className="relative z-10 text-gray-500" />
                    </div>
                 </div>
                 <h3 className="text-xl font-black text-white uppercase italic tracking-tight">{TOP_PLAYERS[2].name}</h3>
                 <p className="text-neon-pink font-black text-lg mt-1">{TOP_PLAYERS[2].points.toLocaleString()}</p>
                 <div className="mt-6 flex flex-col gap-1 italic w-full">
                    <span className="text-[10px] text-gray-500 font-black uppercase mb-1">جایزه:</span>
                    <span className="text-xs text-white font-bold bg-white/5 px-4 py-2 rounded-xl border border-white/5 shadow-xl block">۱ روز اشتراک VIP</span>
                 </div>
               </NeonCard>
             </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Ranking Pool</h2>
                 <div className="flex gap-2">
                    <button className="px-4 py-1.5 rounded-lg bg-neon-blue text-dark-bg text-[10px] font-black uppercase">Weekly</button>
                    <button className="px-4 py-1.5 rounded-lg bg-white/5 text-gray-500 text-[10px] font-black uppercase hover:text-white transition-all">Monthly</button>
                    <button className="px-4 py-1.5 rounded-lg bg-white/5 text-gray-500 text-[10px] font-black uppercase hover:text-white transition-all">All Time</button>
                 </div>
               </div>

               {RANKINGS.map((player, i) => (
                 <motion.div
                   key={player.id}
                   initial={{ opacity: 0, x: 20 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: i * 0.05 }}
                 >
                   <div className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.05] hover:border-neon-blue/20">
                      <div className="flex items-center gap-4 md:gap-6 min-w-0">
                         <span className="w-6 text-center font-mono text-lg font-bold text-gray-700">#{player.rank}</span>
                         <div className="relative shrink-0">
                           <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:scale-105 transition-all">
                             <User size={24} />
                           </div>
                           {player.status !== "NONE" && (
                             <div className={cn(
                               "absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full flex items-center justify-center text-[8px] border-2 border-dark-bg shadow-lg font-black",
                               player.status === "VIP" ? "bg-yellow-400 text-dark-bg" : "bg-neon-blue text-dark-bg"
                             )}>
                               {player.status === "VIP" ? <Crown size={10} /> : <Zap size={10} />}
                             </div>
                           )}
                         </div>
                         <div className="min-w-0">
                           <div className="flex items-center gap-2">
                             <h4 className="font-black text-white group-hover:text-neon-blue transition-colors truncate uppercase text-sm md:text-base italic">{player.name}</h4>
                             {player.status === "VIP" && <span className="h-4 w-8 bg-yellow-400/10 text-yellow-500 text-[8px] flex items-center justify-center rounded font-black border border-yellow-400/20">VIP</span>}
                           </div>
                           <div className="flex items-center gap-2 mt-0.5">
                              <div className={cn(
                                "flex items-center gap-1 text-[9px] font-bold uppercase",
                                player.trend === 'up' ? "text-green-500" : player.trend === 'down' ? "text-neon-pink" : "text-gray-500"
                              )}>
                                 {player.trend === 'up' && <ArrowUp size={10} />}
                                 <span>{player.trend === 'up' ? 'Hot' : player.trend === 'down' ? 'Cooling' : 'Stable'}</span>
                              </div>
                           </div>
                         </div>
                      </div>

                      <div className="text-left">
                         <p className="text-[9px] text-gray-500 uppercase font-black italic mb-0.5">Points</p>
                         <p className="font-black text-lg md:text-xl text-white italic tracking-tighter">{player.points.toLocaleString()}</p>
                      </div>
                   </div>
                 </motion.div>
               ))}

               <GlowButton variant="blue" className="w-full py-4 text-xs font-black uppercase italic tracking-widest mt-8">
                  نمایش ۵۰ نفر برتر
               </GlowButton>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl bg-white/[0.03] border border-white/5 p-6 md:p-8 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Target size={120} className="rotate-12" />
                </div>
                
                <h3 className="text-xl font-black text-white uppercase italic mb-6 relative z-10">How to Score?</h3>
                <div className="space-y-4 relative z-10">
                  {SCORING_RULES.map((rule, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 group-hover:bg-neon-blue/10 group-hover:text-neon-blue transition-all">
                        {rule.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white uppercase italic">{rule.label}</span>
                          <span className="text-xs font-black text-neon-blue">{rule.points}</span>
                        </div>
                        <p className="text-[10px] text-gray-600 font-bold">{rule.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 rounded-2xl bg-neon-blue/5 border border-neon-blue/10">
                  <div className="flex items-center gap-3 text-neon-blue mb-2">
                    <Info size={16} />
                    <span className="text-xs font-black uppercase italic">نکته مهم</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-bold">
                    امتیازات هر هفته ساعت ۰۰:۰۰ دوشنبه ریست می‌شوند. فعالیت‌های غیرطبیعی و تقلب باعث مسدود شدن دائمی اکانت خواهد شد.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-white/10 p-6 relative overflow-hidden">
                 <div className="flex items-center justify-between relative z-10">
                    <div>
                       <p className="text-[10px] text-neon-blue font-black uppercase tracking-widest italic mb-1">Your Stats</p>
                       <h3 className="text-white font-black italic text-xl">#12 overall</h3>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Points</p>
                       <p className="text-white font-black italic text-xl">4,280</p>
                    </div>
                 </div>
                 
                 <div className="mt-4 h-2 w-full bg-white/5 rounded-full overflow-hidden relative z-10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "65%" }}
                      className="absolute inset-y-0 left-0 bg-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.5)]"
                    />
                 </div>
                 <div className="mt-2 flex items-center justify-between relative z-10">
                   <p className="text-[9px] text-gray-500 font-bold">برای رسیدن به Top 10:</p>
                   <p className="text-[10px] text-white font-black">120 points needed</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
