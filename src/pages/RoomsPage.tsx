import React from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { Gamepad2, Users, Star, Target, Zap, Swords } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "../context/AuthContext";

const GAMES = [
  { name: "Counter Strike 2", players: "۱۲.۴k", category: "Shooter", variant: "blue", icon: "🔫" },
  { name: "Dota 2", players: "۸.۹k", category: "MOBA", variant: "pink", icon: "⚔️" },
  { name: "League of Legends", players: "۱۵.۲k", category: "MOBA", variant: "purple", icon: "🧙" },
  { name: "Valorant", players: "۹.۷k", category: "Tactical", variant: "blue", icon: "⚡" },
  { name: "Apex Legends", players: "۵.۱k", category: "Battle Royale", variant: "pink", icon: "🔥" },
  { name: "Rainbow Six Siege", players: "۳.۸k", category: "Tactical", variant: "blue", icon: "🧱" },
  { name: "Rocket League", players: "۶.۴k", category: "Sports", variant: "purple", icon: "⚽" },
  { name: "Warzone", players: "۱۱.۹k", category: "Battle Royale", variant: "pink", icon: "💣" },
];

export const RoomsPage = () => {
  const { isSidebarCollapsed } = useAuth();
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className={cn("flex-1 px-4 py-8 lg:px-8 pb-24 md:pb-8 transition-all duration-300", !isSidebarCollapsed ? "md:mr-64" : "md:mr-20")}>
        <div className="container mx-auto max-w-6xl">
          <header className="mb-8 md:mb-12 text-center md:text-right">
            <h1 className="text-2xl md:text-4xl font-black text-white">اتاق‌های بازی</h1>
            <p className="mt-1 md:mt-2 text-xs md:text-base text-gray-400">بازی مورد علاقه خود را انتخاب کنید و وارد لابی شوید</p>
          </header>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {GAMES.map((game, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <NeonCard 
                  variant={game.variant as any} 
                  className="group flex flex-col items-center text-center p-8 h-[280px]"
                >
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 text-4xl shadow-xl transition-transform group-hover:scale-110 group-hover:rotate-6">
                    {game.icon}
                  </div>
                  
                  <h3 className="mb-1 text-xl font-black text-white">{game.name}</h3>
                  <p className="mb-4 text-xs text-gray-500 uppercase tracking-widest">{game.category}</p>
                  
                  <div className="mt-auto flex items-center gap-2 text-sm">
                    <Users size={14} className={cn(
                      game.variant === 'blue' ? 'text-neon-blue' : game.variant === 'pink' ? 'text-neon-pink' : 'text-neon-purple'
                    )} />
                    <span className="font-bold text-white">{game.players}</span>
                    <span className="text-gray-500">آنلاین</span>
                  </div>
                </NeonCard>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
             <NeonCard variant="blue" className="flex items-center gap-6 p-8">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-neon-blue/10 text-neon-blue">
                   <Swords size={32} />
                </div>
                <div>
                   <h4 className="text-xl font-bold text-white">بازی‌های تیمی</h4>
                   <p className="text-sm text-gray-400">یک لابی تیمی بسازید و دوستانتان را به چالش دعوت کنید.</p>
                   <GlowButton variant="blue" size="sm" className="mt-4">شروع رقابت</GlowButton>
                </div>
             </NeonCard>
             <NeonCard variant="pink" className="flex items-center gap-6 p-8">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-neon-pink/10 text-neon-pink">
                   <Zap size={32} />
                </div>
                <div>
                   <h4 className="text-xl font-bold text-white">بازی سریع</h4>
                   <p className="text-sm text-gray-400">به صورت رندوم وارد یکی از لابی‌های در حال انتظار شوید.</p>
                   <GlowButton variant="pink" size="sm" className="mt-4">ورود سریع</GlowButton>
                </div>
             </NeonCard>
          </div>
        </div>
      </main>
    </div>
  );
};
