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
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { SmartImage } from "../components/ui/SmartImage";

import { useProfilePopover } from "../context/ProfilePopoverContext";
import { MembershipType } from "../types";

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
  const { openProfile } = useProfilePopover();

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
  
  const currentMembership = user?.membership || user?.profile?.membershipType || "NONE";
  const expiryDate = (stats as any).membershipExpiresAt;
  const daysLeft = expiryDate ? Math.max(0, Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))) : 0;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className="flex-1 px-4 py-8 md:mr-64 lg:px-8 pb-24 md:pb-8">
        <div className="container mx-auto max-w-6xl">
          {/* VIP/PROMO BANNER - HIDDEN FOR MEMBERS */}
          {(currentMembership === "NONE" || currentMembership === "FREE") && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-10 cursor-pointer group relative"
              onClick={() => navigate("/premium")}
            >
              <div className="relative min-h-[160px] md:h-40 w-full rounded-[48px] overflow-hidden bg-[#0d0d12] border border-white/10 group-hover:border-neon-purple/50 transition-all duration-700 shadow-[0_40px_100px_-20px_rgba(168,85,247,0.2)]">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                 
                 <div className="absolute inset-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-white/5 rtl:divide-x-reverse">
                    {/* PLUS PROMO */}
                    <div className="flex-1 p-6 md:p-8 flex items-center gap-6 group/plus bg-gradient-to-br from-neon-blue/5 to-transparent hover:from-neon-blue/10 transition-all duration-500">
                       <div className="h-16 w-16 rounded-[24px] bg-neon-blue/10 flex items-center justify-center text-neon-blue border border-neon-blue/20 group-hover/plus:scale-110 group-hover/plus:rotate-6 transition-all duration-500">
                          <Zap size={32} />
                       </div>
                       <div className="text-right">
                          <h3 className="text-lg md:text-xl font-black text-white italic uppercase tracking-tighter mb-1">LOXX PLUS</h3>
                          <p className="text-[10px] text-gray-400 font-bold italic uppercase tracking-widest">نشان اختصاصی و استیکرهای متحرک</p>
                          <div className="mt-2 text-[8px] text-neon-blue font-black uppercase tracking-[0.2em] animate-pulse">کلیک کنید و ارتقا دهید</div>
                       </div>
                    </div>
                    {/* VIP PROMO */}
                    <div className="flex-1 p-6 md:p-8 flex items-center gap-6 group/vip bg-gradient-to-bl from-yellow-400/5 to-transparent hover:from-yellow-400/10 transition-all duration-500">
                       <div className="h-16 w-16 rounded-[24px] bg-yellow-400/10 flex items-center justify-center text-yellow-400 border border-yellow-400/20 group-hover/vip:scale-110 group-hover/vip:-rotate-6 transition-all duration-500">
                          <Crown size={32} />
                       </div>
                       <div className="text-right">
                          <h3 className="text-lg md:text-xl font-black text-white italic uppercase tracking-tighter mb-1">LOXX VIP</h3>
                          <p className="text-[10px] text-gray-400 font-bold italic uppercase tracking-widest">پروفایل و بنر متحرک GIF + تم طلایی</p>
                          <div className="mt-2 text-[8px] text-yellow-400 font-black uppercase tracking-[0.2em] animate-pulse">تجربه نخبگان گیمینگ</div>
                       </div>
                    </div>
                 </div>

                 {/* Center Badge */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex h-12 w-12 rounded-full bg-[#0d0d12] border border-white/20 items-center justify-center text-white z-20 shadow-2xl">
                    <Star size={20} className="text-neon-purple animate-spin-slow" />
                 </div>
              </div>
            </motion.div>
          )}

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

              {/* MEMBERSHIP STATUS CARD */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="col-span-full mt-2"
              >
                <div className={cn(
                  "p-8 rounded-[48px] border transition-all duration-700 relative overflow-hidden group",
                  currentMembership === "VIP" 
                    ? "bg-[#0d0d12] border-yellow-400/20 shadow-[0_40px_100px_-20px_rgba(250,204,21,0.15)]" 
                    : currentMembership === "PLUS"
                    ? "bg-[#0d0d12] border-neon-blue/20 shadow-[0_40px_100px_-20px_rgba(0,229,255,0.15)]"
                    : "bg-[#0d0d12] border-white/5"
                )}>
                   {/* Background Effects */}
                   {currentMembership === "VIP" && (
                     <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-transparent opacity-50" />
                   )}
                   {currentMembership === "PLUS" && (
                     <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 via-transparent to-transparent opacity-50" />
                   )}
                   
                   <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="flex items-center gap-6 text-center md:text-right">
                         <div className={cn(
                           "h-24 w-24 rounded-[32px] flex items-center justify-center border-2 transition-all duration-700 group-hover:scale-110 group-hover:rotate-6",
                           currentMembership === "VIP" ? "bg-yellow-400/10 border-yellow-400/40 text-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)]" :
                           currentMembership === "PLUS" ? "bg-neon-blue/10 border-neon-blue/40 text-neon-blue shadow-[0_0_30px_rgba(0,229,255,0.3)]" :
                           "bg-white/5 border-white/10 text-gray-700"
                         )}>
                            {currentMembership === "VIP" ? <Crown size={54} /> : currentMembership === "PLUS" ? <Zap size={54} /> : <User size={54} />}
                         </div>
                         <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1 italic">
                              {currentMembership !== "NONE" && currentMembership !== "FREE" ? "وضعیت اشتراک فعال" : "اطلاعات سطح کاربری"}
                            </p>
                            <h2 className={cn(
                              "text-3xl md:text-4xl font-black italic tracking-tighter uppercase leading-none",
                              currentMembership === "VIP" ? "text-yellow-400 text-shadow-glow" :
                              currentMembership === "PLUS" ? "text-neon-blue text-shadow-glow" :
                              "text-white"
                            )}>
                               {currentMembership === "VIP" ? "عضویت ویژه الیت (VIP)" : currentMembership === "PLUS" ? "عضویت طلایی پلاس" : "اشتراک سطح عادی (FREE)"}
                            </h2>
                            <p className="text-[11px] text-gray-400 font-bold italic mt-2">
                               {currentMembership === "VIP" ? `باقیمانده اشتراک الیت: ${daysLeft} روز (تا ${expiryDate ? new Date(expiryDate).toLocaleDateString('fa-IR') : "نامعلوم"})` : 
                                currentMembership === "PLUS" ? `باقیمانده اشتراک پلاس: ${daysLeft} روز (تا ${expiryDate ? new Date(expiryDate).toLocaleDateString('fa-IR') : "نامعلوم"})` :
                                "شما در حال حاضر از طرح رایگان استفاده می‌کنید. برای دسترسی به امکانات ویژه ارتقا دهید."}
                            </p>
                         </div>
                      </div>

                      {currentMembership !== "NONE" && currentMembership !== "FREE" ? (
                         <div className="flex items-center gap-10 bg-white/[0.02] backdrop-blur-md p-8 rounded-[40px] border border-white/5 min-w-[280px]">
                            <div className="text-center">
                               <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2 italic">باقیمانده اشتراک</p>
                               <div className="flex items-baseline justify-center gap-1">
                                  <p className={cn(
                                    "text-5xl font-black italic tracking-tighter leading-none",
                                    daysLeft < 5 ? "text-red-500 animate-pulse" : "text-white"
                                  )}>{daysLeft}</p>
                                  <span className="text-gray-500 font-black text-xs italic">روز</span>
                                </div>
                            </div>
                            <div className="h-16 w-px bg-white/10" />
                            <div className="flex-1">
                               <GlowButton 
                                 variant={currentMembership === "VIP" ? "blue" : "purple"} 
                                 size="sm" 
                                 className="h-12 w-full text-[10px] font-black uppercase italic !rounded-2xl"
                                 onClick={() => navigate("/premium")}
                               >
                                  {daysLeft < 7 ? "تمدید لایسنس" : "مدیریت اشتراک"}
                               </GlowButton>
                            </div>
                         </div>
                      ) : (
                         <GlowButton 
                            variant="purple" 
                            className="h-16 px-16 text-sm font-black uppercase italic !rounded-[24px]"
                            onClick={() => navigate("/premium")}
                         >
                            ارتقای حساب کاربری
                         </GlowButton>
                      )}
                   </div>
                   
                   {/* Decorative corner light */}
                   <div className={cn(
                     "absolute -bottom-20 -right-20 h-40 w-40 rounded-full blur-[80px] opacity-30",
                     currentMembership === "VIP" ? "bg-yellow-400" : (currentMembership === "PLUS" || currentMembership === "PLATINUM") ? "bg-neon-blue" : "bg-neon-purple"
                   )} />
                </div>
              </motion.div>
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
                    variant={isTop10 ? "gold" : "blue"} 
                    className={cn(
                      "mt-6 w-full h-12 rounded-2xl group/btn",
                      isTop10 && "shadow-[0_0_20px_rgba(250,204,21,0.3)]"
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
                  suggestedLobbies.map((item: any, i) => {
                    const isVipLobby = item.host?.profile?.membershipType === 'VIP';
                    return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <NeonCard variant={isVipLobby ? "purple" : "blue"} className={cn("flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 relative overflow-hidden", isVipLobby && "border-yellow-400/40 shadow-[0_0_20px_rgba(250,204,21,0.1)]")} hover={true}>
                        {isVipLobby && (
                          <div className="absolute top-0 right-0 h-10 w-10 bg-yellow-400/10 rounded-bl-3xl flex items-start justify-end p-2 border-b border-l border-yellow-400/20 shadow-[-5px_5px_15px_rgba(250,204,21,0.05)]">
                            <Crown size={12} className="text-yellow-400" />
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <div className={cn("h-12 w-12 rounded flex items-center justify-center text-xl font-bold shrink-0", isVipLobby ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20" : "bg-neon-blue/10 text-neon-blue")}>
                            {item.game?.title?.[0] || "🎮"}
                          </div>
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white truncate">{item.title}</h4>
                              {isVipLobby && <span className="px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 text-[8px] font-black uppercase italic border border-yellow-400/40">ELITE</span>}
                            </div>
                            <p className="text-xs text-gray-400 truncate mt-1">{item.game?.title} • {item.region}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-start gap-6 border-t border-white/5 pt-3 sm:border-0 sm:pt-0">
                          <div className="text-right sm:text-left z-10 w-full sm:w-auto flex items-center sm:block justify-between">
                            <div className="sm:mb-1">
                              <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter inline-block sm:block ml-2 sm:ml-0">ظرفیت</p>
                              <p className={cn("font-bold inline-block sm:block text-sm sm:text-base", isVipLobby ? "text-yellow-400" : "text-neon-blue")}>{item.members?.length || 0}/{item.maxPlayers}</p>
                            </div>
                            <GlowButton variant={isVipLobby ? "gold" : "blue"} size="sm" className="h-9 px-6 sm:ml-0" onClick={() => navigate(`/lobby/${item.id}`)}>عضویت</GlowButton>
                          </div>
                        </div>
                      </NeonCard>
                    </motion.div>
                  )})
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
                            <div 
                              className="relative group/avatar cursor-pointer"
                              onClick={() => openProfile({
                                senderName: friend.displayName,
                                senderAvatar: friend.avatar || friend.avatarUrl,
                                senderLevel: friend.level || 1,
                                id: friend.id,
                                membership: friend.membership || MembershipType.NONE,
                                vipMetadata: friend.vipMetadata,
                                bannerUrl: friend.bannerUrl || friend.avatarUrl
                              }, false)}
                            >
                              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-md overflow-hidden border border-white/5 group-hover/avatar:border-neon-blue/50 transition-all">
                                <SmartImage 
                                  src={friend.avatar || (friend as any).avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} 
                                  isVipEnabled={friend.membership === MembershipType.VIP || friend.membership === MembershipType.PLUS}
                                  className="w-full h-full object-cover" 
                                  alt={friend.username} 
                                />
                              </div>
                              <div className={cn(
                                "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-dark-card z-10",
                                friend.status === FriendStatus.ONLINE ? "bg-green-500" :
                                friend.status === FriendStatus.IN_GAME ? "bg-neon-purple shadow-[0_0_8px_rgba(160,32,240,0.8)]" :
                                friend.status === FriendStatus.IN_LOBBY ? "bg-neon-blue shadow-[0_0_8px_rgba(0,229,255,0.8)]" :
                                "bg-gray-500"
                              )} />
                            </div>
                            <div className="min-w-0 pr-1">
                              <div className="flex items-center gap-1.5 leading-none mb-0.5">
                                <p className="text-sm font-bold text-white truncate">{friend.displayName}</p>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {friend.badges?.filter(b => b.isSpecial).map((badge, idx) => (
                                    <img key={idx} src={badge.iconUrl} alt={badge.name} title={badge.name} className="h-3 w-3 object-contain" />
                                  ))}
                                </div>
                              </div>
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
                              onClick={() => openChat(friend.id, friend.displayName, friend.avatar || friend.avatarUrl)}
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
