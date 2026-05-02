import React, { useMemo } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { useGames } from "../context/GamesContext";
import { Game } from "../types";
import { 
  Plus, 
  Gamepad2, 
  Users, 
  ExternalLink,
  ChevronLeft,
  Sparkles,
  Trophy,
  History,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";

const MyGameCard: React.FC<{ game: Game }> = ({ game }) => {
  const { toggleMyGame } = useGames();
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <NeonCard variant="purple" className="overflow-hidden p-0" hover={true}>
        <div className="flex flex-col sm:flex-row">
          <div className="h-40 sm:h-auto sm:w-48 overflow-hidden shrink-0 relative">
            <img 
              src={game.image} 
              alt={game.title} 
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            {/* Quick Remove Button for Mobile */}
            <button 
              onClick={() => toggleMyGame(game.id)}
              className="absolute top-2 right-2 p-2 rounded-xl bg-black/60 backdrop-blur-md text-neon-pink sm:hidden border border-white/10"
              title="حذف از لیست"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white">{game.title}</h3>
                <span className="text-[10px] font-bold text-neon-purple uppercase">{game.genre}</span>
              </div>
              
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <Users size={12} className="text-gray-600" />
                  {game.activeLobbies} لابی فعال
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <span className="h-1 w-1 bg-green-500 rounded-full" />
                  {game.playerCount} در حال بازی
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Link to="/lobbies" className="flex-1">
                <GlowButton variant="purple" size="sm" className="w-full text-xs font-bold py-3">
                  مشاهده لابی‌ها
                </GlowButton>
              </Link>
              <button 
                onClick={() => toggleMyGame(game.id)}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-neon-pink hover:bg-neon-pink/10 transition-all hidden sm:block"
                title="حذف از لیست"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </NeonCard>
    </motion.div>
  );
};

export const MyGamesPage = () => {
  const { allGames, myGames, loading } = useGames();

  const favoriteGames = useMemo(() => 
    allGames.filter(g => myGames.includes(g.id))
  , [allGames, myGames]);

  const suggestionGames = useMemo(() => 
    allGames.filter(g => !myGames.includes(g.id)).slice(0, 3)
  , [allGames, myGames]);

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className="flex-1 px-4 py-8 md:mr-64 lg:px-8" dir="rtl">
        <div className="container mx-auto max-w-5xl">
          <header className="mb-12">
            <div className="flex items-center gap-4 text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
              <Link to="/games" className="hover:text-neon-blue">بازی‌ها</Link>
              <ChevronLeft size={12} />
              <span className="text-neon-purple">برگزیدگان من</span>
            </div>
            <h1 className="text-4xl font-black text-white">بازی‌های مورد علاقه من</h1>
            <p className="text-gray-400 mt-2">مدیریت بازی‌هایی که هر روز تجربه می‌کنید</p>
          </header>

          <div className="space-y-12">
            {/* My Favorites */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Gamepad2 size={24} className="text-neon-purple" />
                  لیست من
                </h2>
                <span className="text-[10px] font-bold text-gray-600 bg-white/5 px-2 py-1 rounded border border-white/5">
                  {favoriteGames.length} مورد
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <AnimatePresence mode="popLayout">
                  {favoriteGames.map((game: Game) => (
                    <MyGameCard key={game.id} game={game} />
                  ))}
                  
                  {favoriteGames.length === 0 && !loading && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-white/5 bg-white/[0.02]"
                    >
                      <Gamepad2 size={48} className="text-gray-800 mb-4" />
                      <p className="text-gray-500 font-bold">هنوز هیچ بازی‌ای به لیست خود اضافه نکرده‌اید</p>
                      <Link to="/games" className="mt-4">
                        <GlowButton variant="blue" size="sm">انتخاب بازی</GlowButton>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* Suggestions */}
            <section className="pt-8 border-t border-white/5">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles size={20} className="text-neon-blue" />
                    پیشنهادی برای شما
                  </h2>
                  <p className="text-[10px] text-gray-500 mt-1">بر اساس فعالیت دوستان و بازی‌های محبوب</p>
                </div>
                <Link to="/games" className="text-xs font-bold text-neon-blue hover:underline">مشاهده همه</Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {suggestionGames.map((game, i) => (
                  <motion.div 
                    key={game.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <NeonCard className="p-4" hover={true}>
                      <div className="relative h-32 rounded-xl overflow-hidden mb-4">
                        <img src={game.image} alt="" className="h-full w-full object-cover" />
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-neon-blue text-[8px] font-black text-dark-bg italic">POPULAR</div>
                      </div>
                      <h4 className="font-bold text-white text-sm mb-1">{game.title}</h4>
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span>{game.genre}</span>
                        <div className="flex items-center gap-1">
                          <Users size={10} />
                          {game.activeLobbies}
                        </div>
                      </div>
                      <Link to="/games" className="mt-4 block">
                         <button className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-gray-400 transition-all">مشاهده</button>
                      </Link>
                    </NeonCard>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};
