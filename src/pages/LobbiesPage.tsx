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
import { useLanguage } from "../context/LanguageContext";

export const LobbiesPage = () => {
  const navigate = useNavigate();
  const { allGames: games } = useGames();
  const { isSidebarCollapsed } = useAuth();
  const { language, t } = useLanguage();
  const isRtl = language === "fa";
  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
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
    <div className={cn("flex min-h-screen bg-[#0a0a0f] overflow-x-hidden", isElectron ? "min-h-[calc(100vh-100px)]" : "min-h-[calc(100vh-64px)]")}>
      <Sidebar />
      <main className={cn("flex-1 min-w-0 relative pb-24 md:pb-8 transition-all duration-300", isRtl ? (!isSidebarCollapsed ? "md:mr-64" : "md:mr-20") : (!isSidebarCollapsed ? "md:ml-64" : "md:ml-20"))} dir={isRtl ? "rtl" : "ltr"}>
        <div className="px-4 py-8 md:px-8 lg:px-10 max-w-7xl mx-auto w-full">
          {/* Mobile Header: Beautifully aligned and spaced */}
          <header className="mb-6 md:mb-12 space-y-6 md:space-y-8 w-full max-w-full">
            <div className={cn("flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full", isRtl ? "" : "sm:flex-row-reverse")}>
              <div className={cn("w-full sm:w-auto", isRtl ? "text-right sm:text-right" : "text-left sm:text-left")}>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white italic tracking-tighter uppercase leading-tight">
                  {isRtl ? (
                    <>لابی‌های <span className="text-neon-blue">فعال</span></>
                  ) : (
                    <><span className="text-neon-blue">Active</span> Lobbies</>
                  )}
                </h1>
                <p className="text-gray-400 mt-2 text-[10px] md:text-sm">{t("lobbiesSubtitle")}</p>
              </div>
              
              <div className="w-full sm:w-auto shrink-0 flex">
                <GlowButton 
                  variant="blue" 
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-12 md:h-14 px-6 whitespace-nowrap group transition-all text-sm font-bold" 
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus size={18} className="group-hover:rotate-90 transition-transform shrink-0" />
                  {t("createLobby")}
                </GlowButton>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative w-full max-w-full">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 text-gray-400 shrink-0", isRtl ? "right-4" : "left-4")} size={18} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("searchLobby")}
                className={cn(
                  "w-full rounded-xl md:rounded-2xl border border-white/10 bg-white/5 py-3 md:py-4 text-xs md:text-sm text-white focus:border-neon-blue/50 focus:outline-none transition-all placeholder:text-gray-600 shadow-xl",
                  isRtl ? "pr-12 pl-16 text-right" : "pl-12 pr-16 text-left"
                )}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className={cn("absolute top-1/2 -translate-y-1/2 p-1.5 md:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] md:text-xs font-bold text-gray-400 cursor-pointer transition-colors", isRtl ? "left-3" : "right-3")}
                >
                  {isRtl ? "حذف" : "Clear"}
                </button>
              )}
            </div>
          </header>

          {/* Game Filters - Better padding and mask for mobile */}
          <div className="mb-6 md:mb-8 relative w-full overflow-hidden">
            <div className={cn("flex items-center justify-between mb-3 px-1", isRtl ? "" : "flex-row-reverse")}>
               <div className="flex items-center gap-1.5 md:gap-2">
                 <Filter size={12} className="text-neon-blue shrink-0" />
                 <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] truncate">{t("gameFilter")}</span>
               </div>
               {activeFilter !== 'all' && (
                 <button onClick={() => setActiveFilter('all')} className="text-[9px] font-bold text-neon-blue hover:text-white transition-colors uppercase tracking-widest shrink-0">{isRtl ? "پاک کردن" : "Clear"}</button>
               )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory mask-fade-edges w-full">
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
                 {t("allLobbies")}
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
                    whileHover={{ y: -5 }}
                    className="group relative h-[460px] md:h-[440px] cursor-pointer"
                  >
                    <NeonCard 
                      variant={isVipLobby ? "gold" : (lobby.isPrivate ? "purple" : "blue")} 
                      className="overflow-hidden border-white/5 flex flex-col h-full p-0 bg-[#0a0a0f] relative"
                      hover={true}
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
                      <div className="relative h-40 md:h-48 w-full shrink-0">
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

                      {/* Card Body content */}
                      <div className="p-5 flex-grow flex flex-col justify-between">
                        {/* Top layout */}
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-tight border truncate max-w-[120px] md:max-w-[130px] transition-all", isVipLobby ? "bg-yellow-400/5 text-yellow-500/80 border-yellow-400/20 group-hover:border-yellow-400/50 group-hover:text-yellow-400" : "bg-white/5 text-gray-500 border-white/10 group-hover:border-neon-blue/20 group-hover:text-neon-blue")}>
                              {lobby.game?.title}
                            </span>
                            <span className="flex items-center gap-1.5 text-white text-xs font-bold font-mono shrink-0">
                              <Users size={14} className={isVipLobby ? "text-yellow-400" : "text-neon-blue"} />
                              {lobby.members?.length || 0} / {lobby.maxPlayers}
                            </span>
                          </div>
                          
                          <h3 className={cn("mb-2 text-lg font-black text-white line-clamp-1 transition-colors leading-snug", isVipLobby ? "group-hover:text-yellow-400" : "group-hover:text-neon-blue")}>
                            {lobby.title}
                          </h3>

                          {/* Dynamic Metadata / Features */}
                          <div className="mb-4 flex flex-wrap gap-1.5 text-right" dir="rtl">
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold text-gray-400">
                              <Globe size={11} className="text-neon-pink" />
                              <span>{lobby.region}</span>
                            </div>
                            {lobby.micRequired && (
                               <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neon-blue/10 border border-neon-blue/20 text-[9px] font-bold text-neon-blue">
                                 <Mic size={11} /> میکروفون
                               </div>
                            )}
                            {meta.discordRequired && (
                               <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/20 text-[9px] font-bold text-[#5865F2]">
                                 دیسکورد
                               </div>
                            )}
                            {meta.ageRestricted && (
                               <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-[9px] font-bold text-red-500">
                                 +18
                               </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom layout */}
                        <div className="mt-auto space-y-3.5">
                           <div className="flex items-center gap-3">
                              <div className="h-[1px] flex-1 bg-white/5" />
                              <div className="flex items-center gap-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                 <ShieldCheck size={13} className="text-green-500" />
                                 Skill: <span className="text-white">{lobby.skillLevel}</span>
                              </div>
                              <div className="h-[1px] flex-1 bg-white/5" />
                           </div>

                           <div className="flex items-center justify-between gap-3">
                              <div className="flex -space-x-2 shrink-0">
                                 {lobby.members?.slice(0, 4)?.map((m: any) => (
                                   <div key={m.userId} className="h-7 w-7 rounded-full border border-dark-bg bg-white/10 flex items-center justify-center overflow-hidden ring-1 ring-white/5">
                                      <SmartImage 
                                        src={m.user?.profile?.avatarUrl || m.user?.avatarUrl || ""} 
                                        className="w-full h-full object-cover"
                                        alt={m.user?.username}
                                      />
                                   </div>
                                 ))}
                                {lobby.members?.length > 4 && (
                                   <div className="h-7 w-7 rounded-full border border-dark-bg bg-white/5 flex items-center justify-center text-[9px] font-black text-gray-500">+{(lobby.members.length - 4)}</div>
                                )}
                              </div>
                              
                              <GlowButton 
                                variant={lobby.isPrivate ? "purple" : "blue"} 
                                size="sm"
                                className={cn(
                                  "px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0",
                                  lobby.isPrivate ? "opacity-50 cursor-not-allowed grayscale" : ""
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
