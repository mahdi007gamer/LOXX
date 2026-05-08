import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { ListSkeleton } from "../components/ui/Skeleton";
import { CreateLobbyModal } from "../components/modals/CreateLobbyModal";
import { useNavigate } from "react-router-dom";
import { useFriends } from "../context/FriendsContext";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
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
  Crown,
  Medal,
  ChevronRight,
  Zap,
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [isLobbyModalOpen, setIsLobbyModalOpen] = useState(false);
  const [isFriendsExpanded, setIsFriendsExpanded] = useState(false);
  const [suggestedLobbies, setSuggestedLobbies] = useState([]);
  const [stats, setStats] = useState({
    joinedAt: new Date().toISOString(),
    lobbiesCount: 0,
    friendsCount: 0,
    gamesCount: 0,
    xp: 0,
    level: 1,
    unreadNotifications: 0
  });
  const [userRank, setUserRank] = useState({
    rank: 0,
    points: 0,
    level: 1,
    pointsToTop10: 0
  });

  const navigate = useNavigate();
  const { friends, openChat } = useFriends();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const lobbiesRes = await api.get("/lobbies");
        setSuggestedLobbies(lobbiesRes.data.data.items);

        const statsRes = await api.get("/user/me/stats");
        if (statsRes.data.status === "success") {
          setStats(statsRes.data.data);
        }

        const rankRes = await api.get("/ranking/me");
        if (rankRes.data.status === "success") {
           setUserRank(rankRes.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const visibleFriends = isFriendsExpanded ? friends : friends.slice(0, 3);
  
  const memberDays = stats.joinedAt 
    ? Math.floor((new Date().getTime() - new Date(stats.joinedAt).getTime()) / (1000 * 3600 * 24))
    : 0;

  const isTop10 = userRank.rank > 0 && userRank.rank <= 10;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className="flex-1 px-4 py-8 md:mr-64 lg:px-8 pb-24 md:pb-8">
        <div className="container mx-auto max-w-6xl">
          <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center md:mb-10">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center sm:text-right"
            >
              <div className="flex items-center justify-center sm:justify-start gap-4 mb-1">
                 <h1 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter">سلام {user?.displayName || user?.username || "گیمر"}، خوش اومدی!</h1>
                 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                    <Flame size={14} fill="currentColor" className="animate-bounce" />
                    <span className="text-[10px] font-black italic tracking-widest uppercase">۷ روز فعالیت مستمر</span>
                 </div>
              </div>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">امروز آماده‌ چالش‌های جدیدی؟</p>
            </motion.div>
            <GlowButton variant="purple" className="flex gap-2 w-full sm:w-auto h-11" onClick={() => setIsLobbyModalOpen(true)}>
              <Plus size={18} />
              <span>ساخت لابی جدید</span>
            </GlowButton>
          </header>

          {/* Quick Stats & Ranking Widget */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {/* Main Stats Grid */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "روز عضویت", val: memberDays === 0 ? 1 : memberDays, icon: Activity, color: "blue" },
                { label: "لابی‌های جوین شده", val: stats.lobbiesCount, icon: Target, color: "pink" },
                { label: "تعداد دوستان", val: friends.length, icon: Users, color: "purple" },
                { label: "لابی‌های آماده", val: suggestedLobbies.length, icon: Trophy, color: "pink" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <NeonCard variant={stat.color as any} className="flex flex-col items-center justify-center p-5 text-center h-full" hover={true}>
                    <div className={cn(
                      "mb-3 h-10 w-10 flex items-center justify-center rounded-xl mx-auto",
                      stat.color === 'blue' ? 'bg-neon-blue/10 text-neon-blue' : 
                      stat.color === 'pink' ? 'bg-neon-pink/10 text-neon-pink' : 
                      'bg-neon-purple/10 text-neon-purple'
                    )}>
                      <stat.icon size={18} />
                    </div>
                    <h3 className="text-xl font-black text-white leading-none mb-1 italic">{stat.val}</h3>
                    <p className="text-[9px] font-bold text-gray-500 whitespace-nowrap uppercase tracking-tighter">{stat.label}</p>
                  </NeonCard>
                </motion.div>
              ))}
            </div>

            {/* Your Rank Widget */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <div className={cn(
                "h-full rounded-[32px] border transition-all duration-500 p-6 flex flex-col justify-between overflow-hidden group",
                isTop10 
                  ? "bg-gradient-to-br from-[#12051a] via-[#1a1129] to-[#0a0f1c] border-yellow-400/30 shadow-[0_0_40px_rgba(250,204,21,0.1)]" 
                  : "bg-gradient-to-br from-[#1a1129] to-[#0a0f1c] border-white/10"
              )}>
                 {/* Background Accent */}
                 <div className={cn(
                    "absolute -top-10 -right-10 h-40 w-40 rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-all duration-700",
                    isTop10 ? "bg-yellow-400" : "bg-neon-purple"
                 )} />
                 
                 <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest italic">رتبه و سطح کاربری</span>
                       {isTop10 ? <Crown className="text-yellow-400 animate-bounce" size={18} /> : <Zap className="text-neon-blue" size={16} />}
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <div className={cn(
                          "h-20 w-20 rounded-2xl p-1 flex items-center justify-center relative transition-all duration-500",
                          isTop10 ? "bg-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.4)] rotate-3" : "bg-white/5 border border-white/10"
                       )}>
                          {isTop10 ? <Trophy className="text-dark-bg" size={40} /> : <Medal className="text-neon-blue" size={32} />}
                          <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-lg bg-white text-dark-bg border-4 border-dark-bg flex items-center justify-center text-[11px] font-black italic shadow-xl">
                             #{userRank.rank || "..."}
                          </div>
                       </div>
                       <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5 tracking-tighter">پیشرفت قهرمان</p>
                          <h4 className={cn(
                            "text-2xl font-black italic uppercase tracking-tighter",
                            isTop10 ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" : "text-white"
                          )}>سطح {userRank.level}</h4>
                          <div className="flex items-center gap-1.5 mt-1 font-bold">
                             <div className={cn("flex items-center gap-1 text-[10px]", isTop10 ? "text-yellow-400" : "text-neon-blue")}>
                                <Zap size={10} fill="currentColor" />
                                <span>{userRank.points.toLocaleString()} امتیاز</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="mt-8 space-y-3">
                       <div className="flex items-center justify-between text-[10px] font-black uppercase italic tracking-tighter">
                          <span className="text-gray-500">{isTop10 ? "شما جزو برترین‌ها هستید!" : "رسیدن به ۱۰ نفر برتر"}</span>
                          <span className={cn(isTop10 ? "text-yellow-400" : "text-white")}>{isTop10 ? "Top Tier" : "Progress"}</span>
                       </div>
                       {!isTop10 && (
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-px">
                            <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${Math.min(100, (userRank.points / (userRank.points + userRank.pointsToTop10)) * 100)}%` }}
                               className="h-full rounded-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink shadow-[0_0_10px_rgba(0,229,255,0.3)]"
                            />
                          </div>
                       )}
                       <p className={cn(
                          "text-[10px] font-black uppercase italic tracking-widest animate-pulse",
                          isTop10 ? "text-yellow-400" : "text-gray-500"
                        )}>
                         {isTop10 ? "✨ تبریک! شما در لیست ۱۰ نفر برتر هستید ✨" : `فقط ${userRank.pointsToTop10.toLocaleString()} امتیاز تا ۱۰ نفر برتر!`}
                       </p>
                    </div>
                 </div>

                 <GlowButton 
                    variant={isTop10 ? "blue" : "blue"} 
                    className={cn(
                      "mt-6 w-full h-12 rounded-2xl group/btn",
                      isTop10 && "bg-yellow-400 text-dark-bg hover:bg-yellow-500 border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.3)]"
                    )}
                    onClick={() => navigate("/ranking")}
                 >
                    <span className={cn(
                      "text-[11px] font-black uppercase italic tracking-widest",
                      isTop10 ? "text-dark-bg" : "text-white"
                    )}>مشاهده رتبه‌بندی جهانی</span> 
                    <ArrowRight size={16} className={cn("mr-2 group-hover/btn:translate-x-1 transition-transform", isTop10 ? "text-dark-bg" : "text-white")} />
                 </GlowButton>
              </div>
            </motion.div>
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
                  suggestedLobbies.map((item: any, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <NeonCard variant="blue" className="flex items-center justify-between p-4" hover={true}>
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded bg-neon-blue/10 flex items-center justify-center text-neon-blue text-xl font-bold">
                            {item.game?.title?.[0] || "🎮"}
                          </div>
                          <div>
                            <h4 className="font-bold text-white">{item.title}</h4>
                            <p className="text-xs text-gray-400">{item.game?.title} • {item.region}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-left">
                            <p className="text-xs text-gray-400">ظرفیت</p>
                            <p className="font-bold text-neon-blue">{item.members?.length || 0}/{item.maxPlayers}</p>
                          </div>
                          <GlowButton variant="blue" size="sm" onClick={() => navigate(`/lobby/${item.id}`)}>عضویت</GlowButton>
                        </div>
                      </NeonCard>
                    </motion.div>
                  ))
                )}
                {!loading && suggestedLobbies.length === 0 && (
                  <div className="text-center py-8 text-gray-500 italic">لابی فعالی پیدا نشد.</div>
                )}
              </div>
            </div>

            {/* Friends Activity */}
            <div className="flex flex-col h-full min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">فعالیت دوستان</h2>
                <div className="h-1 w-12 rounded-full bg-neon-purple/50" />
              </div>
              <NeonCard variant="purple" className="flex flex-col flex-1 p-2">
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
                              onClick={() => openChat(friend.id, friend.displayName)}
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
