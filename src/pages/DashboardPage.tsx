import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { ListSkeleton } from "../components/ui/Skeleton";
import { CreateLobbyModal } from "../components/modals/CreateLobbyModal";
import { useFriends } from "../context/FriendsContext";
import { FriendStatus } from "../types";
import { 
  Trophy, 
  Target, 
  Users, 
  MessageSquare,
  Star,
  Activity,
  Plus,
  ArrowRight,
  MoreVertical,
  UserCheck,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [isLobbyModalOpen, setIsLobbyModalOpen] = useState(false);
  const [isFriendsExpanded, setIsFriendsExpanded] = useState(false);
  const { friends, removeFriend, sendMessage } = useFriends();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const visibleFriends = isFriendsExpanded ? friends : friends.slice(0, 3);

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className="flex-1 px-4 py-8 md:mr-64 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <header className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-3xl font-black text-white">سلام، خوش اومدی! 👋</h1>
              <p className="text-gray-400">امروز آماده‌ چالش‌های جدیدی؟</p>
            </motion.div>
            <GlowButton variant="purple" className="flex gap-2" onClick={() => setIsLobbyModalOpen(true)}>
              <Plus size={18} />
              <span>ساخت لابی جدید</span>
            </GlowButton>
          </header>

          {/* Quick Stats */}
          <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "روز عضویت", val: "۱۴", icon: Activity, color: "blue" },
              { label: "لابی‌های جوین شده", val: "۲۸", icon: Target, color: "pink" },
              { label: "تعداد دوستان", val: friends.length, icon: Users, color: "purple" },
              { label: "بازی‌های دنبال شده", val: "۶", icon: Star, color: "blue" },
              { label: "لابی‌های آماده", val: "۱۲", icon: Trophy, color: "pink" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <NeonCard variant={stat.color as any} className="flex flex-col items-center justify-center p-5 text-center h-full" hover={true}>
                  <div className={cn(
                    "mb-3 h-12 w-12 flex items-center justify-center rounded-2xl mx-auto",
                    stat.color === 'blue' ? 'bg-neon-blue/10 text-neon-blue' : 
                    stat.color === 'pink' ? 'bg-neon-pink/10 text-neon-pink' : 
                    'bg-neon-purple/10 text-neon-purple'
                  )}>
                    <stat.icon size={20} />
                  </div>
                  <h3 className="text-xl font-black text-white leading-none mb-1">{stat.val}</h3>
                  <p className="text-[9px] font-bold text-gray-500 whitespace-nowrap">{stat.label}</p>
                </NeonCard>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Active Lobbies */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">لابی‌های پیشنهادی</h2>
                <button className="text-sm text-neon-blue hover:underline">مشاهده همه</button>
              </div>
              <div className="space-y-4">
                {loading ? (
                  <ListSkeleton />
                ) : (
                  [
                    { id: 1, game: "Counter Strike 2", players: "۴/۵", rank: "Global", type: "رقابتی", icon: "🔫" },
                    { id: 2, game: "Dota 2", players: "۲/۵", rank: "Immortal", type: "دوستانه", icon: "⚔️" },
                    { id: 3, game: "Valorant", players: "۳/۵", rank: "Diamond", type: "تورنمنت", icon: "⚡" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <NeonCard variant="blue" className="flex items-center justify-between p-4" hover={true}>
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded bg-neon-blue/10 flex items-center justify-center text-neon-blue text-xl font-bold">
                            {item.icon}
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
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Friends Activity */}
            <div className="space-y-6 flex flex-col">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">فعالیت دوستان</h2>
                <div className="h-1 w-12 rounded-full bg-neon-purple/50" />
              </div>
              <NeonCard variant="purple" className="flex flex-col p-4">
                {loading ? (
                   <div className="space-y-4">
                     {[1,2,3].map(i => <div key={i} className="flex gap-3 items-center"><div className="h-10 w-10 rounded-full bg-white/5 animate-pulse" /><div className="space-y-1"><div className="h-4 w-24 bg-white/5 rounded animate-pulse" /><div className="h-3 w-16 bg-white/5 rounded animate-pulse" /></div></div>)}
                   </div>
                ) : (
                  <div className="space-y-1">
                    <AnimatePresence>
                      {visibleFriends.map((friend) => (
                        <motion.div 
                          key={friend.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="group relative flex items-center justify-between rounded-xl p-2 transition-all hover:bg-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-md">
                                {friend.avatar ? <img src={friend.avatar} alt={friend.username} /> : "👤"}
                              </div>
                              <div className={cn(
                                "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-dark-card",
                                friend.status === FriendStatus.ONLINE ? "bg-green-500" :
                                friend.status === FriendStatus.IN_GAME ? "bg-neon-purple shadow-[0_0_8px_rgba(160,32,240,0.8)]" :
                                friend.status === FriendStatus.IN_LOBBY ? "bg-neon-blue shadow-[0_0_8px_rgba(0,229,255,0.8)]" :
                                "bg-gray-500"
                              )} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white leading-tight">{friend.displayName}</p>
                              <p className="text-[10px] text-gray-500 line-clamp-1 italic">
                                {friend.status === FriendStatus.IN_GAME ? `🎮 ${friend.currentGame}` : 
                                 friend.status === FriendStatus.ONLINE ? "آنلاین" : 
                                 friend.lastSeen || "آفلاین"}
                              </p>
                            </div>
                          </div>

                          {/* Hover Actions */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => sendMessage(friend.id, "سلااام!")}
                              className="p-1.5 text-gray-400 hover:text-neon-blue hover:bg-neon-blue/10 rounded-lg transition-all"
                            >
                              <MessageSquare size={14} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {friends.length === 0 && (
                      <p className="py-8 text-center text-xs text-gray-600">هنوز دوستی ندارید</p>
                    )}
                  </div>
                )}
                
                <GlowButton 
                  variant="purple" 
                  className="w-full text-[11px] h-9 mt-4" 
                  size="sm"
                  onClick={() => setIsFriendsExpanded(!isFriendsExpanded)}
                >
                  {isFriendsExpanded ? "بستن لیست" : "مشاهده همه دوستان"}
                </GlowButton>
              </NeonCard>
            </div>
          </div>
        </div>

        <CreateLobbyModal 
          isOpen={isLobbyModalOpen}
          onClose={() => setIsLobbyModalOpen(false)}
          onSuccess={() => setIsLobbyModalOpen(false)}
        />
      </main>
    </div>
  );
};
