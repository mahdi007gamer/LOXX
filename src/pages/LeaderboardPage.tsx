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
import axios from "axios";
import { rankingSocket } from "../lib/socket";

const SCORING_RULES = [
  { icon: <Gamepad2 size={20} />, label: "Match Play", points: "+20 XP", detail: "Per match started" },
  { icon: <Trophy size={20} />, label: "Victory", points: "+50 XP", detail: "Per match won" },
  { icon: <Flame size={20} />, label: "Win Streak", points: "+10 XP", detail: "Bonus after 3 wins" },
];

import { Gamepad2 } from "lucide-react";

export const LeaderboardPage = () => {
  const [timeLeftStr, setTimeLeftStr] = useState("2d 14h 05m");
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("loxx_token");
        const res = await axios.get("/api/v1/ranking", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTopUsers(res.data.top_users || []);
        setTimeLeftStr(res.data.reset_in);
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Listen for real-time ticks
    rankingSocket.on("ranking.tick", (data: any) => {
      setTopUsers(data.top_users);
      setTimeLeftStr(data.reset_in);
    });

    return () => {
      rankingSocket.off("ranking.tick");
    };
  }, []);

  if (loading) {
      return (
          <div className="flex min-h-screen items-center justify-center bg-dark-bg text-neon-blue">
              <div className="flex flex-col items-center gap-4">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Zap size={48} />
                  </motion.div>
                  <p className="font-black italic uppercase tracking-widest">Loading Leaderboard...</p>
              </div>
          </div>
      );
  }

  // Split top users for podium
  const podium = topUsers.slice(0, 3);
  const remaining = topUsers.slice(3, 10); // Show top 10

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
                    <span className="text-xl font-black text-white italic">{timeLeftStr}</span>
                 </div>
               </div>
               <p className="text-[10px] text-neon-pink font-black uppercase tracking-widest italic">تا ریست امتیازات هفتگی</p>
            </div>
          </header>

          {/* Top 3 Rankings (Podium) */}
          <div className="mb-24 flex flex-col sm:flex-row items-center sm:items-end justify-center gap-6 md:gap-10 relative">
             <div className="absolute inset-0 bg-neon-blue/5 blur-[120px] rounded-full pointer-events-none" />
             
             {/* Rank 2 */}
             {podium[1] && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="order-2 sm:order-1 relative z-10 w-full max-w-[280px]">
                  <NeonCard variant="blue" className="flex flex-col items-center p-6 text-center bg-[#0a0a0f]/80 backdrop-blur-xl border-white/5 hover:border-neon-blue/30 transition-all pt-12">
                   <div className="h-28 w-28 rounded-full border-4 border-gray-400/20 bg-white/5 mb-4 flex items-center justify-center text-gray-400 relative group p-1 shrink-0">
                      <div className="absolute -top-2 -right-2 h-10 w-10 rounded-2xl bg-gray-400/30 flex items-center justify-center text-gray-200 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] z-30 backdrop-blur-xl">
                         <Medal size={20} />
                      </div>
                      <div className="w-full h-full rounded-full bg-dark-bg flex items-center justify-center overflow-hidden border border-white/5">
                        <User size={48} className="relative z-10 text-gray-500" />
                      </div>
                   </div>
                   <h3 className="text-xl font-black text-white uppercase italic tracking-tight">{podium[1].username}</h3>
                   <p className="text-neon-blue font-black text-lg mt-1">{podium[1].points.toLocaleString()}</p>
                 </NeonCard>
               </motion.div>
             )}

             {/* Rank 1 */}
             {podium[0] && (
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="order-1 sm:order-2 relative z-20 w-full max-w-[320px]">
                 <NeonCard variant="purple" className="flex flex-col items-center p-10 text-center relative border-yellow-400/40 bg-[#12051a]/90 shadow-[0_0_60px_rgba(250,204,21,0.2)] rounded-[40px] pt-16">
                   <div className="absolute -top-14 inset-x-0 mx-auto w-fit text-7xl drop-shadow-[0_15px_25px_rgba(250,204,21,0.5)] z-40">👑</div>
                   <div className="relative mb-8 flex items-center justify-center">
                      <div className="h-36 w-36 rounded-full border-4 border-yellow-400/80 bg-dark-bg flex items-center justify-center text-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.4)] relative z-10 p-1">
                         <div className="w-full h-full rounded-full bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
                            <User size={80} />
                         </div>
                      </div>
                   </div>
                   <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{podium[0].username}</h3>
                   <p className="text-4xl text-yellow-400 font-black italic mt-2 tracking-tight">{podium[0].points.toLocaleString()}</p>
                 </NeonCard>
               </motion.div>
             )}

             {/* Rank 3 */}
             {podium[2] && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="order-3 relative z-10 w-full max-w-[280px]">
                 <NeonCard variant="pink" className="flex flex-col items-center p-6 text-center bg-[#0a0a0f]/80 backdrop-blur-xl border-white/5 hover:border-neon-pink/30 transition-all pt-12">
                   <div className="h-28 w-28 rounded-full border-4 border-orange-400/20 bg-white/5 mb-4 flex items-center justify-center text-orange-400 relative group p-1 shrink-0">
                      <div className="absolute -top-2 -right-2 h-10 w-10 rounded-2xl bg-orange-400/30 flex items-center justify-center text-orange-200 border border-white/20 shadow-[0_0_15px_rgba(251,146,60,0.1)] z-30 backdrop-blur-xl">
                         <Medal size={20} />
                      </div>
                      <div className="w-full h-full rounded-full bg-dark-bg flex items-center justify-center overflow-hidden border border-white/5">
                        <User size={48} className="relative z-10 text-gray-500" />
                      </div>
                   </div>
                   <h3 className="text-xl font-black text-white uppercase italic tracking-tight">{podium[2].username}</h3>
                   <p className="text-neon-pink font-black text-lg mt-1">{podium[2].points.toLocaleString()}</p>
                 </NeonCard>
               </motion.div>
             )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
               <h2 className="text-xl font-black text-white uppercase italic tracking-tighter mb-6">لیست برترین‌ها</h2>
               {remaining.map((player, i) => (
                 <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                   <div className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.05] hover:border-neon-blue/20">
                      <div className="flex items-center gap-4 md:gap-6 min-w-0">
                         <span className="w-6 text-center font-mono text-lg font-bold text-gray-700">#{player.rank}</span>
                         <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                           <User size={24} />
                         </div>
                         <h4 className="font-black text-white group-hover:text-neon-blue transition-colors truncate uppercase text-sm md:text-base italic">{player.username}</h4>
                      </div>
                      <div className="text-left">
                         <p className="text-[9px] text-gray-500 uppercase font-black italic mb-0.5">امتیازات</p>
                         <p className="font-black text-lg md:text-xl text-white italic tracking-tighter">{player.points.toLocaleString()}</p>
                      </div>
                   </div>
                 </motion.div>
               ))}
               {!topUsers.length && <p className="text-gray-500 font-bold italic text-center p-8 bg-white/5 rounded-3xl border border-dashed border-white/10">قهرمانی هنوز ثبت نشده است...</p>}

               <GlowButton variant="blue" className="w-full py-4 text-xs font-black uppercase italic tracking-widest mt-8">
                 نمایش ۵۰ نفر برتر
               </GlowButton>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl bg-white/[0.03] border border-white/5 p-6 md:p-8 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Target size={120} className="rotate-12" />
                </div>
                
                <h3 className="text-xl font-black text-white uppercase italic mb-6 relative z-10">چطور امتیاز بگیریم؟</h3>
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
                       <p className="text-[10px] text-neon-blue font-black uppercase tracking-widest italic mb-1">وضعیت شما</p>
                       <h3 className="text-white font-black italic text-xl">رتبه ۱۲# کل</h3>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] text-gray-400 font-black uppercase mb-1">امتیازات</p>
                       <p className="text-white font-black italic text-xl">۴,۲۸۰</p>
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
                   <p className="text-[9px] text-gray-500 font-bold">برای رسیدن به ۱۰ نفر برتر:</p>
                   <p className="text-[10px] text-white font-black">۱۲۰ امتیاز نیاز است</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
