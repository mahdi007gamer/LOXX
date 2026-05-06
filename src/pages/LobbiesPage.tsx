import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { CardSkeleton } from "../components/ui/Skeleton";
import { Toast } from "../components/ui/Toast";
import api from "../lib/api";
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
  Lock,
  Target
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { CreateLobbyModal } from "../components/modals/CreateLobbyModal";
import { useGames } from "../context/GamesContext";

export const LobbiesPage = () => {
  const navigate = useNavigate();
  const { allGames: games } = useGames();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchLobbies = async () => {
    setLoading(true);
    try {
      const response = await api.get("/lobbies");
      if (response.data.status === "success") {
        setLobbies(response.data.data.items);
      }
    } catch (error) {
      console.error("Failed to fetch lobbies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLobbies();
  }, []);

  const handleLobbyCreated = () => {
    setIsModalOpen(false);
    fetchLobbies();
  };

  const filteredLobbies = lobbies.filter(lobby => {
    const matchesSearch = lobby.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         lobby.game?.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGame = activeFilter === "all" || lobby.gameId === activeFilter;
    return matchesSearch && matchesGame;
  });

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className="flex-1 px-4 py-6 md:py-8 md:mr-64 lg:px-8 pb-28 md:pb-8">
        <div className="container mx-auto max-w-6xl">
          <header className="mb-4 flex flex-col items-center justify-between gap-3 md:flex-row md:mb-12">
            <div className="text-right w-full">
              <h1 className="text-2xl md:text-4xl font-black text-white">لابی‌های فعال</h1>
              <p className="mt-0.5 text-[9px] md:text-base text-gray-500 font-bold uppercase tracking-widest leading-relaxed">تیم خود را پیدا کنید و در کنار بقیه بازیکنان حرفه‌ای بازی کنید</p>
            </div>
            
            <div className="flex w-full items-center gap-2 md:gap-3 md:w-auto overflow-hidden">
               <div className="relative flex-1 md:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700" size={14} />
                <input 
                   type="text" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   placeholder="جستجوی لابی یا بازی..."
                   className="w-full rounded-xl border border-white/5 bg-white/5 py-1.5 md:py-2.5 pr-8 text-[10px] md:text-sm text-white focus:border-neon-blue/40 focus:outline-none transition-all placeholder:text-gray-700 font-bold"
                 />
              </div>
              <GlowButton variant="blue" className="flex gap-1.5 h-10 md:h-12 px-4 md:px-8 shrink-0 shadow-[0_0_20px_rgba(0,229,255,0.2)]" onClick={() => setIsModalOpen(true)}>
                <Plus size={16} />
                <span className="text-[11px] md:text-sm font-black">ساخت لابی جدید</span>
              </GlowButton>
            </div>
          </header>

          {/* Game Filters */}
          <div className="mb-8 flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none no-scrollbar">
             <button 
                onClick={() => setActiveFilter("all")}
                className={cn(
                  "whitespace-nowrap rounded-xl px-5 py-2 text-xs font-black transition-all",
                  activeFilter === "all" 
                    ? "bg-neon-blue text-dark-bg shadow-[0_0_15px_rgba(0,229,255,0.3)]" 
                    : "bg-white/5 text-gray-500 hover:text-white border border-white/5"
                )}
             >
               همه بازی‌ها
             </button>
             {games?.map((game) => (
                <button 
                  key={game.id} 
                  onClick={() => setActiveFilter(game.id)}
                  className={cn(
                    "whitespace-nowrap rounded-xl border px-5 py-2 text-xs font-black transition-all flex items-center gap-2",
                    activeFilter === game.id
                      ? "bg-neon-blue/20 border-neon-blue text-neon-blue shadow-[0_0_15px_rgba(0,229,255,0.1)]"
                      : "border-white/5 bg-white/5 text-gray-500 hover:text-white"
                  )}
                >
                  {game.iconUrl && <img src={game.iconUrl} className="w-4 h-4 object-contain" alt="" />}
                  {game.title}
                </button>
             ))}
          </div>

          {/* Lobbies Grid */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              [1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)
            ) : filteredLobbies.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                 <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-600 mb-4">
                    <Gamepad2 size={40} />
                 </div>
                 <h3 className="text-xl font-black text-white">لابی فعالی یافت نشد</h3>
                 <p className="text-gray-500 mt-2 font-bold">اولین لابی را شما بسازید!</p>
              </div>
            ) : (
              filteredLobbies.map((lobby, i) => {
                let meta: any = {};
                try { meta = typeof lobby.metadata === 'string' ? JSON.parse(lobby.metadata || "{}") : (lobby.metadata || {}); } catch(e){}
                
                return (
                  <motion.div
                    key={lobby.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <NeonCard 
                      className={cn(
                        "group relative flex flex-col h-full overflow-hidden p-0 border-white/5 bg-[#0a0a0f] transition-all hover:border-neon-blue/20",
                        lobby.isPrivate && "opacity-90"
                      )}
                    >
                      {/* Game Banner */}
                      <div className="relative h-40 w-full overflow-hidden shrink-0">
                        {lobby.isPrivate && (
                          <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                             <div className="flex flex-col items-center gap-2 text-white/50">
                               <Lock size={28} />
                               <span className="text-[9px] font-black uppercase tracking-[0.2em]">PRIVATE LOBBY</span>
                             </div>
                          </div>
                        )}
                        <img 
                          src={lobby.game?.bannerUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1000"} 
                          alt={lobby.game?.title} 
                          className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-80" />
                        
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase backdrop-blur-md border border-white/10 bg-white/5 text-white">
                           <Clock size={12} className="text-neon-blue" />
                           <span>{new Date(lobby.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {/* Game Icon Overlay */}
                        <div className="absolute -bottom-5 left-5 h-12 w-12 flex items-center justify-center rounded-xl bg-[#0a0a0f] border border-white/10 shadow-2xl z-20 text-white overflow-hidden">
                          {lobby.game?.iconUrl ? <img src={lobby.game.iconUrl} className="w-8 h-8 object-contain" /> : (lobby.game?.title?.[0] || "🎮")}
                        </div>
                      </div>

                      <div className="p-6 pt-10 flex-1 flex flex-col">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-tight border truncate max-w-[150px] bg-white/5 text-gray-400 border-white/10 group-hover:border-neon-blue/20 group-hover:text-neon-blue transition-all">
                            {lobby.game?.title}
                          </div>
                          <div className="flex items-center gap-2 text-white shrink-0">
                            <Users size={14} className="text-neon-blue" />
                            <span className="text-xs font-black">{lobby.members?.length || 0} / {lobby.maxPlayers}</span>
                          </div>
                        </div>
                        
                        <h3 className="mb-4 text-xl font-black text-white line-clamp-1 group-hover:text-neon-blue transition-colors">
                          {lobby.title}
                        </h3>

                        {/* Dynamic Metadata / Features */}
                        <div className="mb-6 flex flex-wrap gap-2 text-right" dir="rtl">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-gray-500">
                            <Globe size={12} className="text-neon-pink" />
                            <span>{lobby.region}</span>
                          </div>
                          {Object.entries(meta).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-neon-blue">
                              {val as string}
                            </div>
                          ))}
                        </div>

                        <div className="space-y-4 mt-auto">
                           <div className="flex items-center gap-3">
                              <div className="h-0.5 flex-1 bg-white/5" />
                              <div className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                 <ShieldCheck size={14} className="text-green-500" />
                                 Skill: <span className="text-white">{lobby.skillLevel}</span>
                              </div>
                              <div className="h-0.5 flex-1 bg-white/5" />
                           </div>

                           <div className="flex items-center justify-between">
                              <div className="flex -space-x-3">
                                {lobby.members?.slice(0, 4)?.map((m: any) => (
                                   <div key={m.userId} className="h-8 w-8 rounded-full border-2 border-dark-bg bg-white/10 flex items-center justify-center overflow-hidden ring-1 ring-white/5">
                                     {m.user?.profile?.avatarUrl ? <img src={m.user.profile.avatarUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px]">👤</span>}
                                   </div>
                                ))}
                                {lobby.members?.length > 4 && (
                                   <div className="h-8 w-8 rounded-full border-2 border-dark-bg bg-white/5 flex items-center justify-center text-[9px] font-black text-gray-500">+{(lobby.members.length - 4)}</div>
                                )}
                              </div>
                              
                              <GlowButton 
                                variant={lobby.isPrivate ? "purple" : "blue"} 
                                className="h-10 px-6 !rounded-xl text-[10px] font-black uppercase italic tracking-wider transition-transform hover:scale-105 active:scale-95"
                                onClick={() => navigate(`/lobby/${lobby.id}`)}
                              >
                                {lobby.isPrivate ? "کد امنیتی" : "ورود به لابی"}
                              </GlowButton>
                           </div>
                        </div>
                      </div>
                    </NeonCard>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        <CreateLobbyModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleLobbyCreated} 
        />
      </main>
    </div>
  );
};
