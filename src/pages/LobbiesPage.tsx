import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { CardSkeleton } from "../components/ui/Skeleton";
import { Toast } from "../components/ui/Toast";
import api from "../lib/api";
import { lobbySocket } from "../lib/socket";
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
  Target,
  Crown
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { CreateLobbyModal } from "../components/modals/CreateLobbyModal";
import { useGames } from "../context/GamesContext";
import { useAuth } from "../context/AuthContext";
import { SmartImage } from "../components/ui/SmartImage";

export const LobbiesPage = () => {
  const navigate = useNavigate();
  const { allGames: games } = useGames();
  const { isSidebarCollapsed } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [lobbies, setLobbies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchLobbies = async (showLoading = true) => {
    if (showLoading) setLoading(true);
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

    // Use global socket for Real-time List
    if (!lobbySocket.connected) {
       lobbySocket.connect();
    }

    const handleUpdate = () => {
       fetchLobbies(false); // Refresh list without full skeleton loading
    };
    
    lobbySocket.on("lobby.list_updated", handleUpdate);

    return () => {
       lobbySocket.off("lobby.list_updated", handleUpdate);
    };
  }, []);

  const handleLobbyCreated = () => {
    setIsModalOpen(false);
    fetchLobbies();
  };

  const filteredLobbies = lobbies
    .filter(lobby => {
      const matchesSearch = lobby.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           lobby.game?.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGame = activeFilter === "all" || lobby.gameId === activeFilter;
      return matchesSearch && matchesGame;
    })
    .sort((a, b) => {
      if (a.isPrivate === b.isPrivate) return 0;
      return a.isPrivate ? 1 : -1;
    });

  return (
    <div className="flex min-h-screen bg-[#0a0a0f] overflow-x-hidden">
      <Sidebar />
      <main className={cn("flex-1 w-full relative pb-24 md:pb-8 transition-all duration-300", !isSidebarCollapsed ? "md:mr-64" : "mr-0")}>
        <div className="px-4 py-8 md:px-8 lg:px-10 max-w-7xl mx-auto">
          {/* Mobile Header: Beautifully aligned and spaced */}
          <header className="mb-8 md:mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="text-center md:text-right">
                <h1 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter uppercase leading-tight">
                  لابی‌های <span className="text-neon-blue">فعال</span>
                </h1>
                <p className="text-gray-400 mt-2 text-xs md:text-sm">لابی مورد علاقه خود را انتخاب کنید یا خودتان بسازید</p>
              </div>
              
              <GlowButton 
                variant="blue" 
                className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl group transition-all active:scale-95 shadow-lg border-none w-full md:w-auto shrink-0" 
                onClick={() => setIsModalOpen(true)}
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                <span className="text-xs font-black uppercase italic tracking-wider">ساخت لابی جدید</span>
              </GlowButton>
            </div>
            
            {/* Search Bar - Full space below */}
            <div className="mt-8 md:mt-10 relative">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجوی لابی بر اساس نام بازی یا عنوان..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 md:py-5 pr-14 pl-6 text-sm text-white focus:border-neon-blue/50 focus:outline-none transition-all placeholder:text-gray-600 shadow-xl font-bold"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute left-5 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 text-gray-400"
                >
                  حذف
                </button>
              )}
            </div>
          </header>

          {/* Game Filters - Better padding and mask for mobile */}
          <div className="mb-8 relative">
            <div className="flex items-center justify-between mb-3 px-1">
               <div className="flex items-center gap-2">
                 <Filter size={12} className="text-neon-blue" />
                 <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">فیلتر بر اساس بازی</span>
               </div>
               {activeFilter !== 'all' && (
                 <button onClick={() => setActiveFilter('all')} className="text-[9px] font-bold text-neon-blue hover:text-white transition-colors uppercase tracking-widest">CLEAR ALL</button>
               )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x snap-mandatory mask-fade-edges">
               <button 
                  onClick={() => setActiveFilter("all")}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-lg px-5 py-2.5 text-[9px] md:text-[11px] font-black uppercase transition-all snap-start border flex items-center justify-center gap-2",
                    activeFilter === "all" 
                      ? "bg-neon-blue border-neon-blue text-dark-bg shadow-[0_0_15px_rgba(0,229,255,0.3)]" 
                      : "bg-white/5 text-gray-500 border-white/5 hover:border-white/10 hover:text-white"
                  )}
               >
                 <Globe size={12} />
                 همه لابی‌ها
               </button>
               {games?.map((game) => (
                  <button 
                    key={game.id} 
                    onClick={() => setActiveFilter(game.id)}
                    className={cn(
                      "shrink-0 whitespace-nowrap rounded-lg border px-4 py-2 text-[9px] md:text-[11px] font-black uppercase transition-all flex items-center justify-center gap-2 snap-start",
                      activeFilter === game.id
                        ? "bg-neon-blue/10 border-neon-blue text-neon-blue shadow-[0_0_15px_rgba(0,229,255,0.1)]"
                        : "border-white/5 bg-white/5 text-gray-500 hover:border-white/10 hover:text-white"
                    )}
                  >
                    {game.iconUrl && (
                      <div className="flex items-center justify-center">
                        <SmartImage 
                          src={game.iconUrl} 
                          className="w-4 h-4 md:w-5 md:h-5 object-contain grayscale brightness-150 group-hover:grayscale-0 transition-all shrink-0" 
                        />
                      </div>
                    )}
                    <span>{game.title}</span>
                  </button>
               ))}
            </div>
          </div>

          {/* Lobbies Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 pb-20">
            {loading ? (
              [1, 2, 3].map(i => <CardSkeleton key={i} />)
            ) : filteredLobbies.length === 0 ? (
              <div className="col-span-full py-16 md:py-32 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
                 <div className="relative mb-6 md:mb-8">
                    <div className="absolute inset-0 bg-neon-blue/10 blur-3xl rounded-full" />
                    <div className="relative z-10 flex h-20 w-20 md:h-28 md:w-28 items-center justify-center rounded-[24px] md:rounded-[32px] bg-white/5 border border-white/10 text-gray-600 backdrop-blur-xl">
                       <Gamepad2 size={36} className="md:size-14 text-white/10" />
                    </div>
                 </div>
                 <h3 className="text-xl md:text-3xl font-black text-white italic uppercase tracking-tighter mb-2 md:mb-3">لابی فعالی یافت نشد</h3>
                 <p className="text-[10px] md:text-xs text-gray-500 font-bold max-w-[240px] md:max-w-sm mx-auto leading-relaxed">
                    در حال حاضر هیچ لابی فعالی با این مشخصات وجود ندارد. شما می‌توانید اولین لابی را بسازید.
                 </p>
                 <GlowButton variant="blue" className="mt-6 md:mt-8 h-10 md:h-12 px-8 rounded-xl font-black text-[10px] md:text-xs" onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} className="ml-2" /> ساخت لابی جدید
                 </GlowButton>
              </div>
            ) : (
              filteredLobbies.map((lobby, i) => {
                let meta: any = {};
                try { meta = typeof lobby.metadata === 'string' ? JSON.parse(lobby.metadata || "{}") : (lobby.metadata || {}); } catch(e){}
                
                const isVipLobby = lobby.host?.profile?.membershipType === 'VIP';

                return (
                  <motion.div
                    key={lobby.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <NeonCard 
                      className={cn(
                        "group relative flex flex-col h-full overflow-hidden p-0 bg-[#0a0a0f] transition-all",
                        isVipLobby ? "border-yellow-400/20 hover:border-yellow-400/60 bg-yellow-400/5 bg-blend-soft-light" : "border-white/5 hover:border-neon-blue/20",
                        lobby.isPrivate && "opacity-80 grayscale-[0.5]",
                        isVipLobby && "bg-[#0d0d12] shadow-[0_0_30px_rgba(250,204,21,0.05)]"
                      )}
                      onClick={() => !lobby.isPrivate && navigate(`/lobby/${lobby.id}`)}
                    >
                      {/* VIP Badge */}
                      {isVipLobby && (
                        <div className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-yellow-400 text-dark-bg shadow-lg shadow-yellow-400/20 italic">
                          <Crown size={12} fill="currentColor" />
                          <span>Elite Lobby</span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      {!lobby.isPrivate && (
                        <div className="absolute inset-0 z-50 bg-[#0a0a0f]/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                           <GlowButton 
                             variant={isVipLobby ? "gold" : "blue"} 
                             className={cn(
                               "px-8 h-12 scale-90 group-hover:scale-100",
                               isVipLobby ? "shadow-[0_0_40px_rgba(250,204,21,0.6)]" : "shadow-[0_0_40px_rgba(0,229,255,0.6)]"
                             )}
                           >
                             ورود به لابی
                           </GlowButton>
                        </div>
                      )}

                      {/* Game Banner */}
                      <div className="relative h-40 md:h-44 w-full shrink-0">
                        <div className="absolute inset-0 overflow-hidden">
                          {lobby.isPrivate && (
                            <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                               <div className="flex flex-col items-center gap-2 text-white">
                                 <Lock size={28} className="text-neon-purple animate-pulse" />
                                 <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neon-purple">PRIVATE</span>
                               </div>
                            </div>
                          )}
                          <SmartImage 
                            src={lobby.game?.bannerUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1000"} 
                            alt={lobby.game?.title} 
                            className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/20 to-transparent" />
                        </div>
                        
                        <div className={cn("absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase backdrop-blur-md border", isVipLobby ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-400" : "border-white/10 bg-white/10 text-white")}>
                           <Clock size={10} className={isVipLobby ? "text-yellow-400" : "text-neon-blue"} />
                           <span>{new Date(lobby.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div className={cn("absolute -bottom-4 left-4 h-10 w-10 md:h-12 md:w-12 flex items-center justify-center rounded-xl border shadow-2xl z-20 text-white overflow-hidden", isVipLobby ? "bg-[#18181b] border-yellow-400/30 shadow-yellow-400/10" : "bg-[#0a0a0f] border-white/10")}>
                          {lobby.game?.iconUrl ? (
                            <SmartImage src={lobby.game.iconUrl} className="w-6 h-6 md:w-8 md:h-8 object-contain" />
                          ) : (lobby.game?.title?.[0] || "🎮")}
                        </div>
                      </div>

                      <div className="p-4 md:p-5 pt-8 md:pt-10 flex-1 flex flex-col">
                        <div className="mb-3 md:mb-4 flex items-center justify-between">
                          <div className={cn("rounded-full px-2.5 py-1 text-[9px] md:text-[10px] font-black uppercase tracking-tight border truncate max-w-[120px] md:max-w-[130px] transition-all", isVipLobby ? "bg-yellow-400/5 text-yellow-500/80 border-yellow-400/20 group-hover:border-yellow-400/50 group-hover:text-yellow-400" : "bg-white/5 text-gray-500 border-white/10 group-hover:border-neon-blue/20 group-hover:text-neon-blue")}>
                            {lobby.game?.title}
                          </div>
                          <div className="flex items-center gap-2 text-white shrink-0">
                            <Users size={14} className={isVipLobby ? "text-yellow-400" : "text-neon-blue"} />
                            <span className="text-[11px] font-black">{lobby.members?.length || 0} / {lobby.maxPlayers}</span>
                          </div>
                        </div>
                        
                        <h3 className={cn("mb-4 text-lg md:text-xl font-black text-white line-clamp-1 transition-colors", isVipLobby ? "group-hover:text-yellow-400" : "group-hover:text-neon-blue")}>
                          {lobby.title}
                        </h3>

                        {/* Dynamic Metadata / Features */}
                        <div className="mb-6 flex flex-wrap gap-2 text-right" dir="rtl">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-gray-500">
                            <Globe size={12} className="text-neon-pink" />
                            <span>{lobby.region}</span>
                          </div>
                          {lobby.isPrivate && (
                             <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-purple/10 border border-neon-purple/20 text-[10px] font-black text-neon-purple">
                               <Lock size={12} /> خصوصی
                             </div>
                          )}
                          {lobby.micRequired && (
                             <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-blue/10 border border-neon-blue/20 text-[10px] font-black text-neon-blue">
                               <Mic size={12} /> میکروفون
                             </div>
                          )}
                          {meta.discordRequired && (
                             <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/20 text-[10px] font-black text-[#5865F2]">
                               <svg width="12" height="12" viewBox="0 0 127.14 96.36" fill="currentColor"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.1,53,91.08,65.69,84.69,65.69Z"/></svg>
                               دیسکورد
                             </div>
                          )}
                          {meta.ageRestricted && (
                             <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-500">
                               +18
                             </div>
                          )}
                          {Object.entries(meta).filter(([k]) => !['discordRequired', 'ageRestricted', 'autoClose', 'autoArchive'].includes(k)).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-gray-400">
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

                           <div className="flex items-center justify-between gap-3">
                              <div className="flex -space-x-2.5 shrink-0">
                                 {lobby.members?.slice(0, 4)?.map((m: any) => (
                                   <div key={m.userId} className="h-7 w-7 rounded-full border-2 border-dark-bg bg-white/10 flex items-center justify-center overflow-hidden ring-1 ring-white/5">
                                      <SmartImage 
                                        src={m.user?.profile?.avatarUrl || m.user?.avatarUrl || ""} 
                                        className="w-full h-full object-cover"
                                        alt={m.user?.username}
                                      />
                                   </div>
                                 ))}
                                {lobby.members?.length > 4 && (
                                   <div className="h-7 w-7 rounded-full border-2 border-dark-bg bg-white/5 flex items-center justify-center text-[9px] font-black text-gray-500">+{(lobby.members.length - 4)}</div>
                                )}
                              </div>
                              
                              <GlowButton 
                                variant={lobby.isPrivate ? "purple" : "blue"} 
                                className={cn(
                                  "h-10 px-6 !rounded-xl text-[11px] font-black uppercase italic tracking-wider transition-all shrink-0",
                                  lobby.isPrivate ? "opacity-50 cursor-not-allowed grayscale" : "hover:scale-105 active:scale-95"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!lobby.isPrivate) navigate(`/lobby/${lobby.id}`);
                                }}
                                disabled={lobby.isPrivate}
                              >
                                {lobby.isPrivate ? "خصوصی" : "ورود"}
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
