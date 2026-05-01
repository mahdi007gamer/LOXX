import React from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { 
  Trophy, 
  Target, 
  Users, 
  MessageSquare,
  ChevronLeft,
  Star,
  Activity
} from "lucide-react";
import { motion } from "motion/react";

export const DashboardPage = () => {
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className="flex-1 px-4 py-8 md:mr-64 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <header className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-black text-white">سلام، خوش اومدی! 👋</h1>
              <p className="text-gray-400">امروز آماده‌ چالش‌های جدیدی؟</p>
            </div>
            <GlowButton variant="purple" className="flex gap-2">
              <Target size={18} />
              <span>ساخت لابی جدید</span>
            </GlowButton>
          </header>

          {/* Quick Stats */}
          <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "رتبه جهانی", val: "#۱۲۴", icon: Trophy, color: "blue" },
              { label: "بازی‌های برده", val: "۸۴", icon: Star, color: "pink" },
              { label: "دوستان آنلاین", val: "۱۲", icon: Users, color: "purple" },
              { label: "سطح انرژی", val: "۸۵٪", icon: Activity, color: "blue" },
            ].map((stat, i) => (
              <NeonCard key={i} variant={stat.color as any} className="flex items-center gap-4 p-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 ${
                  stat.color === 'blue' ? 'text-neon-blue' : stat.color === 'pink' ? 'text-neon-pink' : 'text-neon-purple'
                }`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                  <p className="text-xl font-black text-white">{stat.val}</p>
                </div>
              </NeonCard>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Active Lobbies */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">لابی‌های فعال</h2>
                <button className="text-sm text-neon-blue hover:underline">مشاهده همه</button>
              </div>
              <div className="space-y-4">
                {[
                  { game: "Counter Strike 2", players: "۴/۵", rank: "Global", type: "رقابتی" },
                  { game: "Dota 2", players: "۲/۵", rank: "Immortal", type: "دوستانه" },
                  { game: "League of Legends", players: "۳/۵", rank: "Diamond", type: "تورنمنت" },
                ].map((item, i) => (
                  <NeonCard key={i} variant="blue" className="flex items-center justify-between p-4" hover={true}>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded bg-neon-blue/10 flex items-center justify-center text-neon-blue font-bold">
                        CS
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{item.game}</h4>
                        <p className="text-xs text-gray-400">{item.type} • سطح {item.rank}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-left">
                        <p className="text-xs text-gray-400">ظرفیت</p>
                        <p className="font-bold text-neon-blue">{item.players}</p>
                      </div>
                      <GlowButton variant="blue" size="sm">عضویت</GlowButton>
                    </div>
                  </NeonCard>
                ))}
              </div>
            </div>

            {/* Friends Activity */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">فعالیت دوستان</h2>
              <NeonCard variant="purple" className="space-y-6">
                {[
                  { name: "Ali_Gamer", status: "در حال بازی CS2", color: "blue" },
                  { name: "Sina_King", status: "آنلاین", color: "green" },
                  { name: "Sara_Player", status: "۵ دقیقه پیش", color: "gray" },
                ].map((friend, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-white/10" />
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-dark-card ${
                        friend.color === 'blue' ? 'bg-neon-blue' : friend.color === 'green' ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{friend.name}</p>
                      <p className="text-xs text-gray-400">{friend.status}</p>
                    </div>
                  </div>
                ))}
                <GlowButton variant="purple" className="w-full text-xs" size="sm">
                  مشاهده همه دوستان
                </GlowButton>
              </NeonCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
