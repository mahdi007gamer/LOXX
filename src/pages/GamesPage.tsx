import React, { useState, useMemo } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { useGames } from "../context/GamesContext";
import { Game } from "../types";
import { 
 Search, 
 Gamepad2, 
 Users, 
 Trophy, 
 Plus, 
 Check, 
 ExternalLink,
 Loader2,
 Heart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const GameCardSkeleton = () => (
 <div className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden animate-pulse">
 <div className="h-48 bg-white/5" />
 <div className="p-5 space-y-3">
 <div className="h-6 bg-white/10 rounded w-2/3" />
 <div className="h-4 bg-white/5 rounded w-1/2" />
 <div className="flex justify-between pt-4">
 <div className="h-8 bg-white/5 rounded w-24" />
 <div className="h-8 bg-white/5 rounded w-8" />
 </div>
 </div>
 </div>
);

const GameCard: React.FC<{ game: Game; index: number }> = ({ game, index }) => {
 const { myGames, toggleMyGame } = useGames();
 const { language } = useLanguage();
 const isRtl = language === "fa";
 const isAdded = myGames.includes(game.id);

 return (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: index * 0.05 }}
 whileHover={{ y: -5 }}
 className="group relative h-[420px] md:h-[400px]"
 >
 <NeonCard variant={isAdded ? "blue" : "purple"} className="overflow-hidden border-white/5 flex flex-col h-full" hover={true}>
 {/* Game Image */}
 <div className="relative h-40 md:h-48 overflow-hidden shrink-0">
 <img 
 src={game.image} 
 alt={game.title} 
 className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
 referrerPolicy="no-referrer"
 />
 <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent opacity-60" />
 
 {/* Active Lobbies Badge */}
 <div className="absolute top-4 right-4 bg-black/60 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
 <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
 <span className="text-[10px] font-bold text-white whitespace-nowrap">
 {isRtl ? `${game.activeLobbies} لابی فعال` : `${game.activeLobbies} Active Lobbies`}
 </span>
 </div>
 
 {/* Friends Icons */}
 {game.friendsPlaying.length > 0 && (
 <div className="absolute bottom-4 right-4 flex -space-x-2">
 {game.friendsPlaying.map((friend, i) => (
 <div key={i} className="h-6 w-6 rounded-full border-2 border-dark-bg bg-white/10 flex items-center justify-center text-[8px] overflow-hidden">
 👤
 </div>
 ))}
 {game.friendsPlaying.length > 3 && (
 <div className="h-6 w-6 rounded-full border-2 border-dark-bg bg-white/20 flex items-center justify-center text-[8px] text-white">
 +{game.friendsPlaying.length - 3}
 </div>
 )}
 </div>
 )}
 </div>

 {/* Game Info */}
 <div className="p-5 flex-1 flex flex-col">
 <div className="flex items-center justify-between mb-2">
 <h3 className="font-black text-white text-lg leading-tight group-hover:text-neon-blue transition-colors">
 {game.title}
 </h3>
 <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-md text-gray-500 border border-white/5 uppercase font-bold ">
 {game.genre}
 </span>
 </div>
 
 <div className="flex items-center gap-4 mt-1 mb-6">
 <div className="flex items-center gap-1.5">
 <Users size={12} className="text-gray-600" />
 <span className="text-[10px] text-gray-400">{game.playerCount}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <Trophy size={11} className="text-neon-purple" />
 <span className="text-[10px] text-gray-400">{isRtl ? "مسابقات دارد" : "Has Tournaments"}</span>
 </div>
 </div>

 <div className="flex items-center justify-between gap-2 mt-auto">
 <GlowButton 
 variant={isAdded ? "blue" : "purple"} 
 size="sm" 
 className="flex-1 py-3 text-[10px] md:text-[11px] font-bold"
 onClick={() => toggleMyGame(game.id)}
 >
 {isAdded ? (
 <span className="flex items-center justify-center gap-1.5"><Check size={14} className="shrink-0" /> <span className="truncate">{isRtl ? "در لیست من" : "My Interest List"}</span></span>
 ) : (
 <span className="flex items-center justify-center gap-1.5"><Plus size={14} className="shrink-0" /> <span className="truncate">{isRtl ? "افزودن به لیست" : "Add to List"}</span></span>
 )}
 </GlowButton>
 <Link 
 to="/lobbies" 
 className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all group/btn shrink-0"
 title={isRtl ? "مشاهده لابی‌ها" : "View Lobbies"}
 >
 <ExternalLink size={16} className="group-hover/btn:scale-110 transition-transform" />
 </Link>
 </div>
 </div>

 {/* Glow effect for favorite */}
 {isAdded && (
 <div className="absolute inset-0 pointer-events-none border border-neon-blue/20 rounded-3xl" />
 )}
 </NeonCard>
 </motion.div>
 );
};

export const GamesPage = () => {
 const { allGames, loading } = useGames();
 const { isSidebarCollapsed } = useAuth();
 const { language, t } = useLanguage();
 const isRtl = language === "fa";
 const [searchTerm, setSearchTerm] = useState("");

 const filteredGames = useMemo(() => {
 return allGames.filter(g => 
 g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
 g.genre.toLowerCase().includes(searchTerm.toLowerCase())
 );
 }, [allGames, searchTerm]);

 const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;

 return (
 <div className={cn("flex overflow-x-hidden", isElectron ? "min-h-[calc(100vh-100px)]" : "min-h-[calc(100vh-64px)]")}>
 <Sidebar />
 <main className={cn("flex-1 px-4 py-8 lg:px-8 pb-32 md:pb-8 min-w-0 transition-all duration-300", isRtl ? (!isSidebarCollapsed ? "md:mr-64" : "md:mr-20") : (!isSidebarCollapsed ? "md:ml-64" : "md:ml-20"))} dir={isRtl ? "rtl" : "ltr"}>
 <div className="container mx-auto max-w-7xl">
 <header className="mb-8 md:mb-12">
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
 <div className={cn("text-center", isRtl ? "md:text-right" : "md:text-left")}>
 <motion.h1 
 initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
 animate={{ opacity: 1, x: 0 }}
 className="text-3xl md:text-4xl font-black text-white"
 >
 {t("allGamesTitle")}
 </motion.h1>
 <p className="text-gray-400 mt-2 text-xs md:text-sm">{t("gamesSubtitle")}</p>
 </div>
 
 <Link to="/my-games" className="w-full md:w-auto">
 <GlowButton variant="purple" className="flex items-center justify-center gap-2 px-6 w-full md:w-auto">
 <Heart size={18} />
 {t("myGamesList")}
 </GlowButton>
 </Link>
 </div>
 
 {/* Search Bar */}
 <div className="mt-8 md:mt-10 relative">
 <Search className={cn("absolute top-1/2 -translate-y-1/2 text-gray-400", isRtl ? "right-5" : "left-5")} size={20} />
 <input 
 type="text" 
 placeholder={t("searchGames")}
 className={cn(
 "w-full rounded-2xl border border-white/10 bg-white/5 py-4 md:py-5 text-sm text-white focus:border-neon-blue/50 focus:outline-none transition-all placeholder:text-gray-600 shadow-xl",
 isRtl ? "pr-14 pl-6 text-right" : "pl-14 pr-6 text-left"
 )}
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 {searchTerm && (
 <button 
 onClick={() => setSearchTerm("")}
 className={cn("absolute top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 text-gray-400", isRtl ? "left-5" : "right-5")}
 >
 {isRtl ? "حذف" : "Clear"}
 </button>
 )}
 </div>
 </header>

 <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 pb-20">
 {loading ? (
 Array.from({ length: 8 }).map((_, i) => <GameCardSkeleton key={i} />)
 ) : (
 <AnimatePresence mode="popLayout">
 {filteredGames.map((game: Game, index: number) => (
 <GameCard key={game.id} game={game} index={index} />
 ))}
 </AnimatePresence>
 )}
 
 {filteredGames.length === 0 && !loading && (
 <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
 <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center text-gray-600 mb-4 border border-dashed border-white/10">
 <Gamepad2 size={40} />
 </div>
 <p className="text-gray-400 font-bold">{isRtl ? "متاسفانه بازی با این مشخصات یافت نشد" : "Sorry, no games matching your search were found."}</p>
 <button 
 onClick={() => setSearchTerm("")}
 className="mt-4 text-neon-blue hover:underline text-sm font-bold"
 >
 {isRtl ? "نمایش همه بازی‌ها" : "Show All Games"}
 </button>
 </div>
 )}
 </div>
 </div>
 </main>
 </div>
 );
};
