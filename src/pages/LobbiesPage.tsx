import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  CheckCircle2,
  Globe,
  Zap,
  Sparkles,
  Mic,
  MessageSquare,
  Lock
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";
import { CreateLobbyModal } from "../components/modals/CreateLobbyModal";
import { Lobby } from "../types";

const GAMES = [
  "Counter Strike 2",
  "Dota 2",
  "Valorant",
  "Apex Legends",
  "League of Legends",
  "Rainbow Six Siege"
];

const SKILL_LEVELS = ["مبتدی", "متوسط", "حرفه‌ای", "نخبه (Elite)"];

const LOBBIES: Lobby[] = [
  { 
    id: 1, 
    game: "Counter Strike 2", 
    title: "رقابتی | رنک گلوبال", 
    players: 4, 
    max: 5, 
    rank: "Global", 
    icon: "🔫", 
    variant: "blue",
    region: "Middle East",
    mode: "Competitive",
    createdAt: "۲ دقیقه پیش",
    status: "hot",
    gameBanner: "https://shared.cloudflare.steamstatic.com/store_apps/730/capsule_616x353.jpg",
    micRequired: true,
    discordRequired: true
  },
  { 
    id: 2, 
    game: "Dota 2", 
    title: "تورنمنت ۵ به ۵", 
    players: 2, 
    max: 10, 
    rank: "Divine", 
    icon: "⚔️", 
    variant: "pink",
    region: "Europe",
    mode: "Ranked All Pick",
    createdAt: "۵ دقیقه پیش",
    status: "normal",
    gameBanner: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota2_social.jpg",
    isPrivate: true,
    micRequired: true
  },
  { 
    id: 3, 
    game: "Valorant", 
    title: "فقط بازیکن با میکروفون", 
    players: 3, 
    max: 5, 
    rank: "Diamond", 
    icon: "⚡", 
    variant: "purple",
    region: "Middle East",
    mode: "Competitive",
    createdAt: "۱۰ دقیقه پیش",
    status: "new",
    gameBanner: "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt7ef999db63f68d6f/652f1e967a15993202685718/VAL_Banner_1920x1080.jpg",
    micRequired: true,
    isAgeRestricted: true
  },
  { 
    id: 4, 
    game: "Apex Legends", 
    title: "رنک آپ سریع", 
    players: 1, 
    max: 3, 
    rank: "Predator", 
    icon: "🔥", 
    variant: "blue",
    region: "Asia",
    mode: "Ranked Leagues",
    createdAt: "۱ دقیقه پیش",
    status: "hot",
    gameBanner: "https://media.contentapi.ea.com/content/dam/apex-legends/images/2019/01/apex-featured-image-16x9.jpg.adapt.crop191x100.1200w.jpg",
    discordRequired: true
  },
  { 
    id: 5, 
    game: "League of Legends", 
    title: "آرام و دوستانه", 
    players: 2, 
    max: 5, 
    rank: "Platinum", 
    icon: "🧙", 
    variant: "pink",
    region: "Europe",
    mode: "Normal",
    createdAt: "۱۵ دقیقه پیش",
    status: "normal",
    gameBanner: "https://gaming-cdn.com/images/products/6504/orig/league-of-legends-pc-game-cover.jpg?v=1662447432",
    micRequired: false
  },
  { 
    id: 6, 
    game: "Rainbow Six Siege", 
    title: "هماهنگی تاکتیکی", 
    players: 4, 
    max: 5, 
    rank: "Emerald", 
    icon: "🧱", 
    variant: "blue",
    region: "Middle East",
    mode: "Tactical",
    createdAt: "۷ دقیقه پیش",
    status: "new",
    gameBanner: "https://shared.cloudflare.steamstatic.com/store_apps/359550/capsule_616x353.jpg",
    micRequired: true,
    discordRequired: true,
    isPrivate: true
  },
];

export const LobbiesPage = () => {
  const navigate = useNavigate();
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

  const handleLobbyCreated = () => {
    setIsModalOpen(false);
    setShowToast(true);
    setTimeout(() => {
      navigate("/lobby/LX-PREMIUM-101");
    }, 1500);
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className="flex-1 px-4 py-8 md:mr-64 lg:px-8 pb-24 md:pb-8">
        <div className="container mx-auto max-w-6xl">
          <header className="mb-8 flex flex-col items-center justify-between gap-6 md:flex-row md:mb-12">
            <div className="text-center md:text-right w-full">
              <h1 className="text-2xl md:text-4xl font-black text-white">لابی‌های فعال</h1>
              <p className="mt-1 text-xs md:text-base text-gray-400">تیم خود را پیدا کنید و وارد بازی شوید</p>
            </div>
            
            <div className="flex w-full items-center gap-3 md:w-auto">
               <div className="relative flex-1 md:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" 
                  placeholder="جستجوی لابی..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-10 text-xs md:text-sm text-white focus:border-neon-blue/50 focus:outline-none transition-all"
                />
              </div>
              <GlowButton variant="blue" className="flex gap-2 h-10 px-4 md:px-6" onClick={() => setIsModalOpen(true)}>
                <Plus size={18} />
                <span className="text-xs md:text-sm">ساخت لابی</span>
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
                    variant={lobby.variant} 
                    hover={true}
                    className="group relative flex flex-col h-full overflow-hidden p-0 border-white/5"
                  >
                    {/* Game Banner */}
                    <div className="relative h-36 w-full overflow-hidden shrink-0">
                      <img 
                        src={lobby.gameBanner} 
                        alt={lobby.game} 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/90 via-dark-bg/20 to-transparent" />
                      
                      {/* Status Badge */}
                      {lobby.status !== 'normal' && (
                        <div className={cn(
                          "absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase backdrop-blur-md border",
                          lobby.status === 'hot' 
                            ? "bg-neon-pink/20 border-neon-pink/30 text-neon-pink" 
                            : "bg-neon-blue/20 border-neon-blue/30 text-neon-blue"
                        )}>
                          {lobby.status === 'hot' ? <Zap size={14} fill="currentColor" /> : <Sparkles size={14} />}
                          <span>{lobby.status === 'hot' ? "داغ" : "جدید"}</span>
                        </div>
                      )}

                      {/* Time Badge */}
                      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-xs font-bold text-gray-300">
                        <Clock size={14} />
                        <span>{lobby.createdAt}</span>
                      </div>

                      {/* Game Icon Overlay */}
                      <div className="absolute -bottom-5 left-5 h-12 w-12 flex items-center justify-center rounded-xl bg-[#0a0a0f] border border-white/10 text-2xl shadow-2xl z-20">
                        {lobby.icon}
                      </div>
                    </div>

                    <div className="p-8 pt-10 flex-1 flex flex-col">
                      <div className="mb-4 flex items-center justify-between">
                        <div className={cn(
                          "rounded-full px-3 py-1 text-xs font-black uppercase tracking-tight border",
                          lobby.variant === 'blue' ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/20' : 
                          lobby.variant === 'pink' ? 'bg-neon-pink/10 text-neon-pink border-neon-pink/20' :
                          'bg-neon-purple/10 text-neon-purple border-neon-purple/20'
                        )}>
                          {lobby.game}
                        </div>
                        <div className="flex items-center gap-2 text-white">
                          <Users size={16} className="text-gray-500" />
                          <span className="text-sm font-black">{lobby.players} / {lobby.max}</span>
                        </div>
                      </div>
                      
                      <h3 className="mb-4 text-2xl font-black text-white line-clamp-1 group-hover:text-neon-blue transition-colors">
                        {lobby.title}
                      </h3>

                      {/* Region & Mode Badges */}
                      <div className="mb-5 flex flex-wrap gap-2.5 text-right" dir="rtl">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs font-bold text-gray-400">
                          <Globe size={13} />
                          <span>{lobby.region}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs font-bold text-neon-blue">
                          <Gamepad2 size={13} />
                          <span>{lobby.mode}</span>
                        </div>
                      </div>

                      {/* Feature Icons Row */}
                      <div className="mb-6 flex flex-wrap gap-3">
                        {lobby.isPrivate && (
                          <div className="h-8 w-8 rounded-lg bg-neon-pink/10 border border-neon-pink/20 flex items-center justify-center text-neon-pink" title="لابی خصوصی">
                            <Lock size={14} />
                          </div>
                        )}
                        {lobby.micRequired && (
                          <div className="h-8 w-8 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue" title="میکروفون اجباری">
                            <Mic size={14} />
                          </div>
                        )}
                        {lobby.discordRequired && (
                          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400" title="دیسکورد اجباری">
                            <MessageSquare size={14} />
                          </div>
                        )}
                        {lobby.isAgeRestricted && (
                          <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white text-[10px] font-black" title="محدودیت سنی +18">
                            18+
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 text-base text-gray-500 mt-auto">
                        <ShieldCheck size={18} className="text-green-500" />
                        <span className="font-bold">سطح مهارت: <span className="text-white">{lobby.rank}</span></span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/5 p-5 py-4 transition-all md:group-hover:opacity-0">
                      <div className="flex items-center gap-2.5">
                         <div className="flex -space-x-2.5">
                            {[1, 2, 3].map(p => (
                              <div key={p} className="h-8 w-8 rounded-full border-2 border-dark-card bg-white/10 flex items-center justify-center text-xs">
                                👤
                              </div>
                            ))}
                         </div>
                         <span className="text-sm font-bold text-gray-500">+{lobby.players} آنلاین</span>
                      </div>
                      <div className="px-4 py-2 rounded-lg bg-white/5 text-sm font-black text-neon-blue uppercase italic tracking-wider md:block hidden">
                         JOIN NOW
                      </div>
                      <GlowButton 
                        variant={lobby.variant} 
                        className="md:hidden h-9 px-4 !rounded-lg text-[10px] font-black"
                        onClick={handleRequestAccess}
                      >
                        درخواست عضویت
                      </GlowButton>
                    </div>

                    <div className="absolute inset-x-0 bottom-6 px-6 translate-y-4 opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all duration-300 z-30 hidden md:flex items-center justify-center">
                      <GlowButton variant={lobby.variant} className="w-full text-xs font-black py-4" onClick={handleRequestAccess}>
                        درخواست عضویت
                      </GlowButton>
                    </div>
                  </NeonCard>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Premium Create Lobby Modal */}
        <CreateLobbyModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleLobbyCreated} 
        />

        <Toast 
          isVisible={showToast} 
          message="درخواست شما ارسال شد. منتظر تایید باشید." 
          onClose={() => setShowToast(false)} 
        />
      </main>
    </div>
  );
};
