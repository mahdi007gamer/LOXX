import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { CardSkeleton } from "../components/ui/Skeleton";
import { Toast } from "../components/ui/Toast";
import { 
  Gamepad2, 
  Users, 
  Search, 
  Plus, 
  ShieldCheck, 
  ChevronRight,
  Clock,
  Filter,
  X,
  Lock,
  Globe,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

const GAMES = [
  "Counter Strike 2",
  "Dota 2",
  "Valorant",
  "Apex Legends",
  "League of Legends",
  "Rainbow Six Siege"
];

const SKILL_LEVELS = ["مبتدی", "متوسط", "حرفه‌ای", "نخبه (Elite)"];

const LOBBIES = [
  { id: 1, game: "Counter Strike 2", title: "رقابتی | رنک گلوبال", players: 4, max: 5, rank: "Global", icon: "🔫", variant: "blue" },
  { id: 2, game: "Dota 2", title: "تورنمنت ۵ به ۵", players: 2, max: 10, rank: "Divine", icon: "⚔️", variant: "pink" },
  { id: 3, game: "Valorant", title: "فقط بازیکن با میکروفون", players: 3, max: 5, rank: "Diamond", icon: "⚡", variant: "purple" },
  { id: 4, game: "Apex Legends", title: "رنک آپ سریع", players: 1, max: 3, rank: "Predator", icon: "🔥", variant: "blue" },
  { id: 5, game: "League of Legends", title: "آرام و دوستانه", players: 2, max: 5, rank: "Platinum", icon: "🧙", variant: "pink" },
  { id: 6, game: "Rainbow Six Siege", title: "هماهنگی تاکتیکی", players: 4, max: 5, rank: "Emerald", icon: "🧱", variant: "blue" },
];

export const LobbiesPage = () => {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleRequestAccess = () => {
    setShowToast(true);
  };

  const handleCreateLobby = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsModalOpen(false);
      // In a real app, logic to redirect to lobby room would go here
      window.location.href = "/dashboard"; 
    }, 2000);
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className="flex-1 px-4 py-8 md:mr-64 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <header className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <h1 className="text-4xl font-black text-white">لابی‌های فعال</h1>
              <p className="mt-2 text-gray-400">تیم خود را پیدا کنید و وارد بازی شوید</p>
            </div>
            
            <div className="flex w-full items-center gap-4 md:w-auto">
               <div className="relative flex-1 md:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" 
                  placeholder="جستجوی لابی یا بازی..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-10 text-sm text-white focus:border-neon-blue/50 focus:outline-none transition-all"
                />
              </div>
              <GlowButton variant="blue" className="flex gap-2" onClick={() => setIsModalOpen(true)}>
                <Plus size={18} />
                <span className="hidden sm:inline">ایجاد لابی</span>
              </GlowButton>
            </div>
          </header>

          {/* Game Filters */}
          <div className="mb-10 flex items-center gap-3 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden">
             <button className="whitespace-nowrap rounded-lg bg-neon-blue px-6 py-2 text-sm font-bold text-dark-bg shadow-[0_8px_30px_rgba(0,229,255,0.25)] hover:shadow-[0_12px_45px_rgba(0,229,255,0.35)] transition-all">همه</button>
             {["CS 2", "Dota 2", "Valorant", "Apex", "LoL", "Rainbow 6"].map((game, i) => (
                <button key={i} className="whitespace-nowrap rounded-lg border border-white/10 bg-white/5 px-6 py-2 text-sm font-medium text-gray-400 hover:border-neon-blue/50 hover:text-white transition-all">
                  {game}
                </button>
             ))}
             <button className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-400">
               <Filter size={16} />
               <span>فیلتر</span>
             </button>
          </div>

          {/* Lobbies Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              [1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)
            ) : (
              LOBBIES.map((lobby, i) => (
                <motion.div
                  key={lobby.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <NeonCard 
                    variant={lobby.variant as any} 
                    hover={true}
                    className="group relative flex flex-col justify-between h-[240px] overflow-hidden"
                  >
                    <div className="relative z-10">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-2xl">
                          {lobby.icon}
                        </div>
                        <div className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                          lobby.variant === 'blue' ? 'bg-neon-blue/10 text-neon-blue' : 'bg-neon-pink/10 text-neon-pink'
                        )}>
                          {lobby.game}
                        </div>
                      </div>
                      
                      <h3 className="mb-2 text-lg font-bold text-white line-clamp-1">{lobby.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <ShieldCheck size={14} className="text-green-500" />
                        <span>سطح مهارت: {lobby.rank}</span>
                      </div>
                    </div>

                    <div className="relative z-10 mt-6 flex items-center justify-between border-t border-white/5 pt-4 transition-opacity group-hover:opacity-0">
                      <div className="flex items-center gap-2">
                         <div className="flex -space-x-2">
                            {[1, 2, 3].map(p => (
                              <div key={p} className="h-7 w-7 rounded-full border-2 border-dark-card bg-white/10" />
                            ))}
                         </div>
                         <span className="text-xs font-medium text-gray-500">+{lobby.players} هوادار</span>
                      </div>
                      <div className="text-left">
                         <p className="text-[10px] text-gray-500">ظرفیت</p>
                         <p className={cn(
                           "font-black",
                           lobby.players >= lobby.max ? "text-neon-pink" : "text-neon-blue"
                         )}>
                           {lobby.players}/{lobby.max}
                         </p>
                      </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 py-10 px-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-30 flex items-center justify-center bg-black/40">
                      <GlowButton variant={lobby.variant as any} className="w-full relative z-40" onClick={handleRequestAccess}>
                        درخواست عضویت
                      </GlowButton>
                    </div>
                  </NeonCard>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Create Lobby Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-dark-card p-8 shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
              >
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute left-6 top-6 text-gray-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>

                <div className="mb-8">
                  <h2 className="text-2xl font-black text-white">ایجاد لابی جدید</h2>
                  <p className="text-sm text-gray-400 mt-1">تنظیمات تیم خود را مشخص کنید</p>
                </div>

                <form onSubmit={handleCreateLobby} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">نام لابی</label>
                      <input 
                        required
                        type="text" 
                        placeholder="مثلاً: تورنمنت دوستانه"
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-neon-blue/50 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">انتخاب بازی</label>
                      <select 
                        required
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-neon-blue/50 focus:outline-none transition-all appearance-none"
                      >
                        {GAMES.map(game => (
                          <option key={game} value={game} className="bg-dark-card">{game}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">ظرفیت کل لابی</label>
                      <div className="flex items-center gap-3">
                        <input 
                          required
                          type="number" 
                          min="2"
                          max="50"
                          defaultValue="5"
                          className="flex-1 rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-neon-blue/50 focus:outline-none transition-all"
                        />
                        <Users className="text-gray-500" size={20} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">سطح مهارت (Rank)</label>
                      <select 
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-neon-blue/50 focus:outline-none transition-all appearance-none"
                      >
                        {SKILL_LEVELS.map(level => (
                          <option key={level} value={level} className="bg-dark-card">{level}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-right block">توضیحات (اختیاری)</label>
                    <textarea 
                      placeholder="پیامی برای هم تیمی‌ها بنویسید..."
                      className="w-full h-24 rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-neon-blue/50 focus:outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="flex flex-wrap gap-6 pt-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input type="checkbox" className="peer hidden" />
                        <div className="h-5 w-5 rounded border border-white/20 bg-white/5 peer-checked:bg-neon-blue peer-checked:border-neon-blue transition-all" />
                        <CheckCircle2 className="absolute inset-0 m-auto text-dark-bg scale-0 peer-checked:scale-100 transition-transform" size={14} />
                      </div>
                      <span className="text-sm text-gray-400 group-hover:text-white transition-colors">لابی خصوصی (فقط با لینک دعوت)</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-8 mt-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Info size={16} />
                      <span className="text-xs">لابی به مدت ۲۴ ساعت فعال می‌ماند.</span>
                    </div>
                    <GlowButton 
                      type="submit" 
                      variant="blue" 
                      disabled={isSubmitting}
                      className="min-w-[160px]"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-dark-bg border-t-transparent" />
                          <span>در حال ساخت...</span>
                        </div>
                      ) : "تایید و ساخت لابی"}
                    </GlowButton>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <Toast 
          isVisible={showToast} 
          message="درخواست شما ارسال شد. منتظر تایید باشید." 
          onClose={() => setShowToast(false)} 
        />
      </main>
    </div>
  );
};
