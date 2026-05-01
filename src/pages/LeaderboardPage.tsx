import React from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { Trophy, Medal, Star, ArrowUp, User } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";

const TOP_PLAYERS = [
  { id: 1, name: "Sina_King", rank: 1, points: "۱۲,۴۵۰", winRate: "۸۴٪", avatar: "👑", color: "text-yellow-400" },
  { id: 2, name: "Ali_Gamer", rank: 2, points: "۱۱,۹۰۰", winRate: "۷۶٪", avatar: "🥈", color: "text-gray-300" },
  { id: 3, name: "Sara_Player", rank: 3, points: "۱۰,۲۰۰", winRate: "۷۲٪", avatar: "🥉", color: "text-orange-400" },
];

const RANKINGS = [
  { id: 4, name: "Mohammad_Pro", rank: 4, points: "۹,۸۰۰", winRate: "۶۸٪", trend: "up" },
  { id: 5, name: "Arash_Zero", rank: 5, points: "۹,۴۵۰", winRate: "۶۵٪", trend: "down" },
  { id: 6, name: "Reza_Gamer", rank: 6, points: "۹,۱۰۰", winRate: "۶۳٪", trend: "up" },
  { id: 7, name: "Tina_X", rank: 7, points: "۸,۹۰۰", winRate: "۶۰٪", trend: "stable" },
  { id: 8, name: "Gamer_Boy", rank: 8, points: "۸,۵۰۰", winRate: "۵۸٪", trend: "up" },
];

export const LeaderboardPage = () => {
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className="flex-1 px-4 py-8 md:mr-64 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-black text-white">برترین گیمرها</h1>
            <p className="mt-2 text-gray-400">رقابت برای رسیدن به قله لوکس</p>
          </header>

          {/* Top 3 Podium */}
          <div className="mb-16 grid grid-cols-1 items-end gap-6 sm:grid-cols-3">
             {/* Rank 2 */}
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="order-2 sm:order-1"
             >
               <NeonCard variant="blue" className="flex flex-col items-center p-8 text-center sm:h-[280px]">
                 <div className="mb-4 text-4xl">{TOP_PLAYERS[1].avatar}</div>
                 <div className="h-16 w-16 rounded-full bg-white/10 mb-4 flex items-center justify-center text-gray-300">
                    <User size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-white">{TOP_PLAYERS[1].name}</h3>
                 <p className="text-sm text-gray-400">{TOP_PLAYERS[1].points} امتیاز</p>
                 <div className="mt-4 rounded-full bg-gray-300/10 px-3 py-1 text-xs font-bold text-gray-300">رتبه ۲</div>
               </NeonCard>
             </motion.div>

             {/* Rank 1 */}
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="order-1 sm:order-2"
             >
               <NeonCard variant="purple" className="flex flex-col items-center p-10 text-center sm:h-[340px] relative border-yellow-400/50">
                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-5xl drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                   {TOP_PLAYERS[0].avatar}
                 </div>
                 <div className="h-24 w-24 rounded-full border-4 border-yellow-400/30 bg-white/10 mb-6 flex items-center justify-center text-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.2)]">
                    <User size={48} />
                 </div>
                 <h3 className="text-2xl font-black text-white">{TOP_PLAYERS[0].name}</h3>
                 <p className="text-lg text-neon-purple font-bold">{TOP_PLAYERS[0].points} امتیاز</p>
                 <div className="mt-6 rounded-full bg-yellow-400 px-6 py-1.5 text-sm font-black text-dark-bg shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                   قهرمان فصل
                 </div>
               </NeonCard>
             </motion.div>

             {/* Rank 3 */}
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="order-3"
             >
               <NeonCard variant="pink" className="flex flex-col items-center p-8 text-center sm:h-[280px]">
                 <div className="mb-4 text-4xl">{TOP_PLAYERS[2].avatar}</div>
                 <div className="h-16 w-16 rounded-full bg-white/10 mb-4 flex items-center justify-center text-orange-400">
                    <User size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-white">{TOP_PLAYERS[2].name}</h3>
                 <p className="text-sm text-gray-400">{TOP_PLAYERS[2].points} امتیاز</p>
                 <div className="mt-4 rounded-full bg-orange-400/10 px-3 py-1 text-xs font-bold text-orange-400">رتبه ۳</div>
               </NeonCard>
             </motion.div>
          </div>

          {/* List View */}
          <div className="space-y-4">
             {RANKINGS.map((player, i) => (
               <motion.div
                 key={player.id}
                 initial={{ opacity: 0, x: 20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1 }}
               >
                 <div className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.05] hover:border-white/10">
                    <div className="flex items-center gap-6">
                       <span className="w-8 text-center font-mono text-xl font-bold text-gray-500">#{player.rank}</span>
                       <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                         <User size={24} />
                       </div>
                       <div>
                         <h4 className="font-bold text-white group-hover:text-neon-blue transition-colors">{player.name}</h4>
                         <p className="text-xs text-gray-500">نرخ برد: {player.winRate}</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-12">
                       <div className="text-left hidden sm:block">
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">تغییرات</p>
                          <div className={cn(
                            "flex items-center gap-1 text-xs font-medium",
                            player.trend === 'up' ? "text-green-500" : player.trend === 'down' ? "text-neon-pink" : "text-gray-400"
                          )}>
                             {player.trend === 'up' && <ArrowUp size={12} />}
                             <span>{player.trend === 'up' ? 'رشد مثبت' : player.trend === 'down' ? 'نزول' : 'پایدار'}</span>
                          </div>
                       </div>
                       <div className="text-left">
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">امتیاز</p>
                          <p className="font-mono text-lg font-bold text-white">{player.points}</p>
                       </div>
                    </div>
                 </div>
               </motion.div>
             ))}
          </div>
        </div>
      </main>
    </div>
  );
};
