import React from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { 
  User, 
  Settings, 
  Award, 
  Gamepad2, 
  Calendar, 
  Zap,
  Star,
  Target,
  Edit2,
  Share2
} from "lucide-react";
import { cn } from "@/src/lib/utils";

export const ProfilePage = () => {
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className="flex-1 px-4 py-8 md:mr-64 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          {/* Profile Header */}
          <div className="relative mb-8 overflow-hidden rounded-3xl bg-white/[0.02] border border-white/10">
            {/* Cover Image/Pattern */}
            <div className="h-48 w-full bg-gradient-to-r from-neon-blue/10 via-neon-purple/10 to-neon-pink/10" />
            
            <div className="px-8 pb-8">
              <div className="relative -mt-16 flex flex-col items-end gap-6 sm:flex-row">
                <div className="relative">
                  <div className="h-32 w-32 rounded-3xl border-4 border-dark-bg bg-dark-card shadow-2xl overflow-hidden">
                    <div className="flex h-full w-full items-center justify-center bg-neon-blue/20 text-neon-blue">
                      <User size={64} />
                    </div>
                  </div>
                  <button className="absolute -bottom-2 -left-2 rounded-xl bg-neon-blue p-2 text-dark-bg shadow-lg hover:scale-110 transition-transform">
                    <Edit2 size={16} />
                  </button>
                </div>

                <div className="flex-1 pt-4 text-right">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black text-white">Ali_Gamer_98</h1>
                    <div className="rounded-lg bg-neon-blue/10 px-2 py-0.5 text-[10px] font-bold text-neon-blue border border-neon-blue/30">
                      LEVEL 42
                    </div>
                  </div>
                  <p className="mt-1 text-gray-400">عاشق بازی‌های رقابتی و شوتر اول شخص</p>
                  
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span>عضویت از فروردین ۱۴۰۳</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Gamepad2 size={14} />
                      <span>۱۲۴ بازی انجام شده</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end">
                  <GlowButton variant="blue" size="sm" className="gap-2">
                    <Share2 size={16} />
                    <span>اشتراک‌گذاری</span>
                  </GlowButton>
                  <button className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-gray-400 hover:text-white transition-all">
                    <Settings id="settings-icon" size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column - Stats */}
            <div className="space-y-6">
              <NeonCard variant="blue" className="space-y-6">
                <h3 className="flex items-center gap-2 font-bold text-white">
                  <Target size={18} className="text-neon-blue" />
                  <span>آمار خلاصه</span>
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white/5 p-4 text-center">
                    <p className="text-[10px] text-gray-500">میزان برد</p>
                    <p className="text-xl font-black text-neon-blue">۶۸٪</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-4 text-center">
                    <p className="text-[10px] text-gray-500">K/D Ratio</p>
                    <p className="text-xl font-black text-neon-pink">۱.۴۵</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-gray-400">پیشرفت سطح</span>
                      <span className="text-neon-blue">۷۴٪</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/5">
                      <div className="h-full w-[74%] rounded-full bg-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
                    </div>
                  </div>
                </div>
              </NeonCard>

              <NeonCard variant="purple">
                <h3 className="mb-6 flex items-center gap-2 font-bold text-white">
                  <Award size={18} className="text-neon-purple" />
                  <span>افتخارات</span>
                </h3>
                <div className="grid grid-cols-4 gap-4">
                   {[1, 2, 3, 4, 5].map(b => (
                     <div key={b} className="aspect-square rounded-xl bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center text-neon-purple">
                        <Star size={20} fill="currentColor" />
                     </div>
                   ))}
                </div>
              </NeonCard>
            </div>

            {/* Right Column - Activity & Match History */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-bold text-white">تاریخچه بازی‌های اخیر</h3>
              <div className="space-y-4">
                {[
                  { game: "Counter Strike 2", result: "برد", score: "۱۶ - ۱۰", date: "۲ ساعت پیش", variant: "blue" },
                  { game: "Dota 2", result: "باخت", score: "۰ - ۱", date: "دیروز", variant: "pink" },
                  { game: "VALORANT", result: "برد", score: "۱۳ - ۸", date: "۳ روز پیش", variant: "blue" },
                  { game: "CS 2", result: "برد", score: "۱۶ - ۴", date: "۴ روز پیش", variant: "blue" },
                ].map((match, i) => (
                  <NeonCard key={i} variant={match.variant as any} className="flex items-center justify-between p-4" hover={false}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-lg",
                        match.variant === 'blue' ? 'text-neon-blue' : 'text-neon-pink'
                      )}>
                        <Gamepad2 size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{match.game}</h4>
                        <p className="text-xs text-gray-500">{match.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                       <div className="text-center">
                          <p className="text-[10px] text-gray-500">نتیجه</p>
                          <p className={cn(
                            "font-black text-sm",
                            match.result === 'برد' ? "text-green-500" : "text-neon-pink"
                          )}>{match.result}</p>
                       </div>
                       <div className="text-center">
                          <p className="text-[10px] text-gray-500">اسکور</p>
                          <p className="font-mono text-sm text-white">{match.score}</p>
                       </div>
                    </div>
                  </NeonCard>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
