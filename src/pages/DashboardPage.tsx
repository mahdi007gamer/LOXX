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
import { toast } from "react-hot-toast";
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
 Check,
 Copy,
 Share2,
 Gift,
 Radio,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { SmartImage } from "../components/ui/SmartImage";
import { getAvatarFallbacks } from "../lib/avatar";

import { useProfilePopover } from "../context/ProfilePopoverContext";
import { MembershipType } from "../types";
import { useLanguage } from "../context/LanguageContext";

const DashboardSkeleton = () => (
 <div className="container mx-auto max-w-6xl animate-pulse">
 {/* Promo Banner Skeleton */}
 <div className="mb-10 w-full h-[160px] md:h-40 rounded-[48px] bg-white/5 border border-white/10 flex items-center p-8 gap-8">
 <div className="h-24 w-24 rounded-[32px] bg-white/10 shrink-0" />
 <div className="flex-1 space-y-4 hidden md:block">
 <div className="h-6 w-1/3 bg-white/10 rounded" />
 <div className="h-4 w-1/2 bg-white/10 rounded" />
 </div>
 <div className="h-16 w-48 bg-white/10 rounded-[24px] hidden lg:block" />
 </div>

 {/* User Rank Widget Skeleton */}
 <div className="mb-8 p-6 md:p-8 rounded-[48px] bg-white/5 border border-white/10 shrink-0 flex flex-col md:flex-row items-center justify-between gap-6">
 <div className="flex items-center gap-6">
 <div className="h-16 w-16 bg-white/10 rounded-full shrink-0" />
 <div className="space-y-3">
 <div className="h-5 w-32 bg-white/10 rounded" />
 <div className="h-4 w-48 bg-white/10 rounded" />
 </div>
 </div>
 <div className="h-12 w-32 bg-white/10 rounded-[24px] shrink-0" />
 </div>

 <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
 <div className="lg:col-span-2 space-y-6">
 <div className="flex items-center justify-between">
 <div className="h-6 w-32 bg-white/10 rounded" />
 </div>
 <ListSkeleton />
 <ListSkeleton />
 </div>
 <div className="space-y-6">
 <div className="flex items-center justify-between mb-6">
 <div className="h-6 w-32 bg-white/10 rounded" />
 </div>
 <div className="rounded-[32px] bg-white/5 border border-white/10 h-[400px] p-6 space-y-6">
 {[1,2,3,4].map(i => (
 <div key={i} className="flex gap-4 items-center">
 <div className="h-12 w-12 rounded-full bg-white/10 shrink-0" />
 <div className="space-y-2">
 <div className="h-4 w-24 bg-white/10 rounded" />
 <div className="h-3 w-16 bg-white/10 rounded" />
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
);

export const DashboardPage = () => {
 const navigate = useNavigate();
 const { friends, openChat } = useFriends();
 const { user, isSidebarCollapsed } = useAuth();
 const { openProfile } = useProfilePopover();
 const { language } = useLanguage();
 const isRtl = language === "fa";

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

 const [rewardNotification, setRewardNotification] = useState<any>(null);
 const [showReferralModal, setShowReferralModal] = useState(false);
 const [copiedType, setCopiedType] = useState<"username" | "link" | null>(null);
 
 useEffect(() => {
 if (user && (user as any).rewardNotification) {
 setRewardNotification((user as any).rewardNotification);
 }
 }, [user]);

 useEffect(() => {
 if (user && !loading) {
 const key = `has_seen_referral_promo_${user.id}`;
 if (localStorage.getItem(key) !== "true") {
 const timer = setTimeout(() => {
 setShowReferralModal(true);
 }, 1500);
 return () => clearTimeout(timer);
 }
 }
 }, [user, loading]);

 const handleCloseReferralModal = () => {
 if (user) {
 localStorage.setItem(`has_seen_referral_promo_${user.id}`, "true");
 }
 setShowReferralModal(false);
 };

 const handleCopyText = (text: string, type: "username" | "link") => {
 navigator.clipboard.writeText(text);
 setCopiedType(type);
 toast.success(type === "username" ? "نام کاربری شما کپی شد!" : "لینک دعوت کپی شد!");
 setTimeout(() => setCopiedType(null), 2000);
 };

 const handleDismissReward = async () => {
 if (!rewardNotification) return;
 try {
 await api.delete(`/notifications/${rewardNotification.id}`);
 } catch(e) {
 console.error(e);
 }
 setRewardNotification(null);
 };

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

 const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;

 const isStreamer = (user as any)?.role === "STREAMER" || Boolean(user?.profile?.badges?.some(b => b.name === "Streamer" || b.name === "استریمر"));

 if (loading) {
 return (
 <div className={cn("flex", isElectron ? "min-h-[calc(100vh-100px)]" : "min-h-[calc(100vh-64px)]")}>
 <Sidebar />
 <main className={cn("flex-1 px-4 py-8 lg:px-8 pb-24 md:pb-8 transition-all duration-300 min-w-0 w-full", isRtl ? (!isSidebarCollapsed ? "md:mr-64" : "md:mr-20") : (!isSidebarCollapsed ? "md:ml-64" : "md:ml-20"))}>
 <DashboardSkeleton />
 </main>
 </div>
 );
 }

 return (
 <div className={cn("flex", isElectron ? "min-h-[calc(100vh-100px)]" : "min-h-[calc(100vh-64px)]")} dir={isRtl ? "rtl" : "ltr"}>
 <Sidebar />
 <main className={cn("flex-1 px-4 py-8 lg:px-8 pb-24 md:pb-8 transition-all duration-300 min-w-0 w-full", isRtl ? (!isSidebarCollapsed ? "md:mr-64" : "md:mr-20") : (!isSidebarCollapsed ? "md:ml-64" : "md:ml-20"))}>
 <div className="container mx-auto max-w-6xl">
 {/* STREAMER BANNER */}
 {isStreamer ? (
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: -10 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 className="mb-10 group relative"
 >
 <div className="relative min-h-[160px] md:h-44 w-full rounded-[48px] overflow-hidden bg-[#0d0d12] border border-neon-purple/30 transition-all duration-700 shadow-[0_42px_120px_-20px_rgba(168,85,247,0.35)]">
 <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/15 via-[#0d0d12] to-neon-purple/5 opacity-80" />
 <div className="absolute top-0 right-1/4 w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none -z-10 hidden md:block" />
 
 {/* Floating spark particles decoration */}
 <div className="absolute inset-0 opacity-40 pointer-events-none">
 {[1, 2, 3, 4].map(idx => (
 <div 
 key={idx} 
 className="absolute h-1.5 w-1.5 rounded-full bg-neon-purple animate-pulse" 
 style={{ 
 top: `${15 + idx * 20}%`, 
 left: `${10 + idx * 18}%`,
 animationDelay: `${idx * 0.4}s` 
 }} 
 />
 ))}
 </div>

 <div className="absolute inset-0 flex flex-col md:flex-row p-6 md:p-8 items-center gap-6 md:gap-10">
 <div className="h-20 w-20 rounded-[28px] bg-gradient-to-tr from-neon-purple/20 to-[#a855f7]/10 flex items-center justify-center text-neon-purple border border-neon-purple/30 shadow-[0_0_35px_rgba(168,85,247,0.35)]">
 <Radio size={44} className="animate-pulse" />
 </div>
 <div className={cn("text-center flex-1", isRtl ? "md:text-right" : "md:text-left")}>
 <h3 className="text-xl md:text-2xl font-black text-white mb-2 flex items-center gap-2 justify-center md:justify-start">
 <span>{isRtl ? "به دنیای نخبگان و سفیران رسانه‌ای لوکس خوش آمدید" : "Welcome to the LOXX Elite & Streamer Ambassador Domain"}</span>
 <span className="hidden md:inline-block px-2.5 py-0.5 rounded-md bg-neon-purple/10 text-[9px] font-bold text-neon-purple border border-neon-purple/20 uppercase">Streamer Pro</span>
 </h3>
 <p className="text-xs md:text-sm text-gray-300 font-bold leading-relaxed max-w-2xl">
 {isRtl 
 ? "هنر و انرژی شما در استریم، قلب تپنده کامیونیتی بزرگ ماست. با مدیریت لینک‌ها، کدهای مشارکت مالی و ابزارهای اختصاصی، تجربه ارتباطی بی‌نظیری برای مخاطبان خود خلق کنید."
 : "Your art and energy in stream is the beating heart of our great community. Spark a unique interactive experience for your audience using personalized custom links, donation gateways, and dedicated tools."}
 </p>
 </div>
 <div className="shrink-0 flex gap-4">
 <GlowButton variant="purple" onClick={() => navigate("/elite-dashboard")} className="py-3.5 px-8 text-[11px] font-black min-w-[180px] shadow-lg shadow-purple-500/20">
 {isRtl ? "پنل و ابزارهای استریمر" : "Streamer Panel & Tools"}
 </GlowButton>
 </div>
 </div>
 </div>
 </motion.div>
 ) : (
 /* VIP/PROMO BANNER - HIDDEN FOR MEMBERS */
 (currentMembership === "NONE" || currentMembership === "FREE") && (
 <motion.div 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className="mb-10 cursor-pointer group relative"
 onClick={() => navigate("/premium")}
 >
 <div className="relative w-full rounded-[48px] overflow-hidden bg-[#0d0d12] border border-white/10 group-hover:border-neon-purple/50 transition-all duration-700 shadow-[0_40px_100px_-20px_rgba(168,85,247,0.2)]">
 <div className="absolute inset-0 bg-white/5 opacity-10 pattern-dots" />
 
 <div className="relative z-10 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-white/5 rtl:divide-x-reverse">
 {/* PLUS PROMO */}
 <div className="flex-1 p-6 md:p-8 flex items-center gap-6 group/plus bg-gradient-to-br from-neon-blue/5 to-transparent hover:from-neon-blue/10 transition-all duration-500">
 <div className="h-16 w-16 rounded-[24px] bg-neon-blue/10 flex items-center justify-center text-neon-blue border border-neon-blue/20 group-hover/plus:scale-110 group-hover/plus:rotate-6 transition-all duration-500">
 <Zap size={32} />
 </div>
 <div className={isRtl ? "text-right" : "text-left"}>
 <h3 className="text-lg md:text-xl font-black text-white uppercase mb-1">LOXX PLUS</h3>
 <p className="text-[10px] text-gray-400 font-bold uppercase ">{isRtl ? "نشان اختصاصی و استیکرهای متحرک" : "Exclusive Badge & Animated Status Stickers"}</p>
 <div className="mt-2 text-[8px] text-neon-blue font-black uppercase animate-pulse">{isRtl ? "کلیک کنید و ارتقا دهید" : "Click to Upgrade Now"}</div>
 </div>
 </div>
 {/* VIP PROMO */}
 <div className="flex-1 p-6 md:p-8 flex items-center gap-6 group/vip bg-gradient-to-bl from-yellow-400/5 to-transparent hover:from-yellow-400/10 transition-all duration-500">
 <div className="h-16 w-16 rounded-[24px] bg-yellow-400/10 flex items-center justify-center text-yellow-400 border border-yellow-400/20 group-hover/vip:scale-110 group-hover/vip:-rotate-6 transition-all duration-500">
 <Crown size={32} />
 </div>
 <div className={isRtl ? "text-right" : "text-left"}>
 <h3 className="text-lg md:text-xl font-black text-white uppercase mb-1">LOXX VIP</h3>
 <p className="text-[10px] text-gray-400 font-bold uppercase ">{isRtl ? "پروفایل و بنر متحرک GIF + تم طلایی" : "Animated Profile Banner & Custom Gold Theme"}</p>
 <div className="mt-2 text-[8px] text-yellow-400 font-black uppercase animate-pulse">{isRtl ? "تجربه نخبگان گیمینگ" : "Access the Elite Tier Club"}</div>
 </div>
 </div>
 </div>

 {/* Center Badge */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex h-12 w-12 rounded-full bg-[#0d0d12] border border-white/20 items-center justify-center text-white z-20 shadow-2xl">
 <Star size={20} className="text-neon-purple animate-spin-slow" />
 </div>
 </div>
 </motion.div>
 )
 )}

 <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center md:mb-10">
 <motion.div
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 className={cn("text-center", isRtl ? "sm:text-right" : "sm:text-left")}
 >
 <div className="flex items-center justify-center sm:justify-start gap-4 mb-1">
 <h1 className="text-2xl md:text-3xl font-black text-white uppercase ">
 {isRtl 
 ? `سلام ${user?.displayName || user?.username || "گیمر"}، خوش اومدی!` 
 : `Hello ${user?.displayName || user?.username || "Gamer"}, welcome back!`}
 </h1>
 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
 <Flame size={14} fill="currentColor" className="animate-bounce" />
 <span className="text-[10px] font-black uppercase">{isRtl ? "۷ روز فعالیت مستمر" : "7-Day Streak Active"}</span>
 </div>
 </div>
 <p className="text-sm text-gray-400 font-bold uppercase text-[10px] md:text-xs">
 {isRtl ? "امروز آماده‌ چالش‌های جدیدی؟" : "Are you ready for new challenges today?"}
 </p>
 </motion.div>
 <GlowButton variant="purple" className="flex gap-2 w-full sm:w-auto h-11" onClick={() => setIsLobbyModalOpen(true)}>
 <Plus size={18} />
 <span>{isRtl ? "ساخت لابی جدید" : "Create New Lobby"}</span>
 </GlowButton>
 </header>

 {/* Quick Stats & Ranking Widget */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
 {/* Main Stats Grid */}
 <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
 {[
 { label: isRtl ? "روز عضویت" : "Days Joined", val: memberDays === 0 ? 1 : memberDays, icon: Activity, color: "blue" },
 { label: isRtl ? "لابی‌های جوین شده" : "Lobbies Joined", val: stats.lobbiesCount, icon: Target, color: "pink" },
 { label: isRtl ? "تعداد دوستان" : "Friends Count", val: friends.length, icon: Users, color: "purple" },
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
 <h3 className="text-xl font-black text-white leading-none mb-1 ">{stat.val}</h3>
 <p className="text-[9px] font-bold text-gray-500 whitespace-nowrap uppercase ">{stat.label}</p>
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
 isStreamer
 ? "bg-[#0d0d12]/90 border-neon-purple/40 shadow-[0_40px_100px_-20px_rgba(168,85,247,0.3)]"
 : currentMembership === "VIP" 
 ? "bg-[#0d0d12] border-yellow-400/20 shadow-[0_40px_100px_-20px_rgba(250,204,21,0.15)]" 
 : currentMembership === "PLUS"
 ? "bg-[#0d0d12] border-neon-blue/20 shadow-[0_40px_100px_-20px_rgba(0,229,255,0.15)]"
 : "bg-[#0d0d12] border-white/5"
 )}>
 {/* Background Effects */}
 {isStreamer ? (
 <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 via-transparent to-transparent opacity-80" />
 ) : currentMembership === "VIP" ? (
 <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-transparent opacity-50" />
 ) : currentMembership === "PLUS" ? (
 <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 via-transparent to-transparent opacity-50" />
 ) : null}
 
 <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
 <div className={cn("flex flex-col md:flex-row items-center gap-6", isRtl ? "text-right" : "text-left")}>
 <div className={cn(
 "h-24 w-24 rounded-[32px] flex items-center justify-center border-2 transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 shrink-0",
 isStreamer ? "bg-neon-purple/10 border-neon-purple/40 text-neon-purple shadow-[0_0_30px_rgba(168,85,247,0.3)]" :
 currentMembership === "VIP" ? "bg-yellow-400/10 border-yellow-400/40 text-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)]" :
 currentMembership === "PLUS" ? "bg-neon-blue/10 border-neon-blue/40 text-neon-blue shadow-[0_0_30px_rgba(0,229,255,0.3)]" :
 "bg-white/5 border-white/10 text-gray-700"
 )}>
 {isStreamer ? <Radio size={54} className="animate-pulse" /> : currentMembership === "VIP" ? <Crown size={54} /> : currentMembership === "PLUS" ? <Zap size={54} /> : <User size={54} />}
 </div>
 <div className={cn("text-center", isRtl ? "md:text-right" : "md:text-left")}>
 <p className="text-[10px] text-gray-500 font-black uppercase mb-1 ">
 {isStreamer ? (isRtl ? "سطح احراز هویت همکاران" : "Co-Partner Verification Status") : (currentMembership !== "NONE" && currentMembership !== "FREE" ? (isRtl ? "وضعیت اشتراک فعال" : "Active Subscription Status") : (isRtl ? "اطلاعات سطح کاربری" : "User Profile Level Status"))}
 </p>
 <h2 className={cn(
 "text-3xl md:text-4xl font-black uppercase leading-none",
 isStreamer ? "text-neon-purple text-shadow-glow" :
 currentMembership === "VIP" ? "text-yellow-400 text-shadow-glow" :
 currentMembership === "PLUS" ? "text-neon-blue text-shadow-glow" :
 "text-white"
 )}>
 {isStreamer ? (isRtl ? "استریمر رسمی لوکس" : "Official LOXX Streamer") : currentMembership === "VIP" ? (isRtl ? "عضو ویژه لوکس" : "LOXX VIP Elite Member") : currentMembership === "PLUS" ? (isRtl ? "عضویت طلایی پلاس" : "LOXX Plus Member") : (isRtl ? "عضو عادی لوکس" : "Regular LOXX Gamer")}
 </h2>
 <p className="text-[11px] text-gray-400 font-bold mt-2">
 {isStreamer ? (isRtl ? "شما به عنوان یکی از ستون‌های کامیونیتی لوکس، مستقیماً با سیستم کارمزد و حمایت مالی تایید شده‌اید." : "You are certified as a key pillar in the LOXX platform with streaming tools enabled.") : currentMembership === "VIP" ? (isRtl ? `باقیمانده اشتراک الیت: ${daysLeft} روز (تا ${expiryDate ? new Date(expiryDate).toLocaleDateString('fa-IR') : "نامعلوم"})` : `Elite VIP Remaining: ${daysLeft} Days (Till ${expiryDate ? new Date(expiryDate).toLocaleDateString('en-US') : "Unknown"})`) : 
 currentMembership === "PLUS" ? (isRtl ? `باقیمانده اشتراک پلاس: ${daysLeft} روز (تا ${expiryDate ? new Date(expiryDate).toLocaleDateString('fa-IR') : "نامعلوم"})` : `Plus Gold Remaining: ${daysLeft} Days (Till ${expiryDate ? new Date(expiryDate).toLocaleDateString('en-US') : "Unknown"})`) :
 (isRtl ? "شما در حال حاضر از طرح رایگان استفاده می‌کنید. برای دسترسی به امکانات ویژه ارتقا دهید." : "You are currently exploring on the Free Tier level. Upgrade design/voice privileges today.")}
 </p>
 </div>
 </div>

 {isStreamer ? (
 <div className="flex items-center gap-6 bg-white/[0.02] p-6 rounded-[32px] border border-white/5 min-w-[320px]">
 <div className="flex-1 space-y-2">
 <GlowButton 
 variant="purple" 
 size="sm" 
 className="h-11 w-full text-[10px] font-black uppercase !rounded-xl"
 onClick={() => navigate("/elite-dashboard")}
 >
 {isRtl ? "مدیریت امور مالی" : "Financial Manager Panel"}
 </GlowButton>
 <GlowButton 
 variant="purple" 
 size="sm" 
 className="h-11 w-full text-[10px] font-black uppercase !rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10"
 onClick={() => navigate("/settings/elite")}
 >
 {isRtl ? "تنظیمات رسانه‌ای" : "Broadcast Panel Config"}
 </GlowButton>
 </div>
 </div>
 ) : (currentMembership !== "NONE" && currentMembership !== "FREE" ? (
 <div className="flex items-center gap-10 bg-white/[0.02] p-8 rounded-[40px] border border-white/5 min-w-[280px]">
 <div className="text-center">
 <p className="text-[10px] text-gray-500 font-black uppercase mb-2 ">{isRtl ? "باقیمانده اشتراک" : "Days Remaining"}</p>
 <div className="flex items-baseline justify-center gap-1">
 <p className={cn(
 "text-5xl font-black leading-none",
 daysLeft < 5 ? "text-red-500 animate-pulse" : "text-white"
 )}>{daysLeft}</p>
 <span className="text-gray-500 font-black text-xs ">{isRtl ? "روز" : "Days"}</span>
 </div>
 </div>
 <div className="h-16 w-px bg-white/10" />
 <div className="flex-1">
 <GlowButton 
 variant={currentMembership === "VIP" ? "blue" : "purple"} 
 size="sm" 
 className="h-12 w-full text-[10px] font-black uppercase !rounded-2xl"
 onClick={() => navigate("/premium")}
 >
 {daysLeft < 7 ? (isRtl ? "تمدید لایسنس" : "Renew License") : (isRtl ? "مدیریت اشتراک" : "Manage License")}
 </GlowButton>
 </div>
 </div>
 ) : (
 <GlowButton 
 variant="purple" 
 className="h-16 px-16 text-sm font-black uppercase !rounded-[24px]"
 onClick={() => navigate("/premium")}
 >
 {isRtl ? "ارتقای حساب کاربری" : "Upgrade Premium Levels"}
 </GlowButton>
 ))}
 </div>
 
 {/* Decorative corner light */}
 <div className={cn(
 "absolute -bottom-20 -right-20 h-40 w-40 rounded-full blur-[80px] opacity-30 hidden md:block",
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
 "rounded-[32px] border transition-all duration-500 p-6 flex flex-col gap-6 overflow-hidden group h-full justify-between",
 isTop10 
 ? "bg-gradient-to-br from-[#12051a] via-[#1a1129] to-[#0a0f1c] border-yellow-400/30 shadow-[0_0_40px_rgba(250,204,21,0.1)]" 
 : "bg-gradient-to-br from-[#1a1129] to-[#0a0f1c] border-white/10"
 )}>
 {/* Background Accent */}
 <div className={cn(
 "absolute -top-10 -right-10 h-40 w-40 rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-all duration-700 hidden md:block",
 isTop10 ? "bg-yellow-400" : "bg-neon-purple"
 )} />
 
 <div className="relative z-10">
 <div className="flex items-center justify-between mb-4">
 <span className="text-[10px] text-gray-500 font-black uppercase ">{isRtl ? "رتبه و سطح کاربری" : "Global Rank & Level"}</span>
 {isTop10 ? <Crown className="text-yellow-400 animate-bounce" size={18} /> : <Zap className="text-neon-blue" size={16} />}
 </div>
 
 <div className="flex items-center gap-4">
 <div className={cn(
 "h-20 w-20 rounded-2xl p-1 flex items-center justify-center relative transition-all duration-500 shrink-0",
 isTop10 ? "bg-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.4)] rotate-3" : "bg-white/5 border border-white/10"
 )}>
 {isTop10 ? <Trophy className="text-dark-bg" size={40} /> : <Medal className="text-neon-blue" size={32} />}
 <div className={cn("absolute -bottom-2 h-8 w-8 rounded-lg bg-white text-dark-bg border-4 border-dark-bg flex items-center justify-center text-[11px] font-black shadow-xl", isRtl ? "-right-2" : "-left-2")}>
 #{userRank.rank || "..."}
 </div>
 </div>
 <div className={isRtl ? "text-right" : "text-left"}>
 <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5 ">{isRtl ? "پیشرفت قهرمان" : "Champion Progression"}</p>
 <h4 className={cn(
 "text-2xl font-black uppercase ",
 isTop10 ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" : "text-white"
 )}>{isRtl ? `سطح ${userRank.level}` : `Level ${userRank.level}`}</h4>
 <div className="flex items-center gap-1.5 mt-1 font-bold">
 <div className={cn("flex items-center gap-1 text-[10px]", isTop10 ? "text-yellow-400" : "text-neon-blue")}>
 <Zap size={10} fill="currentColor" />
 <span>{isRtl ? `${userRank.points.toLocaleString()} امتیاز` : `${userRank.points.toLocaleString()} XP`}</span>
 </div>
 </div>
 </div>
 </div>

 <div className="mt-8 space-y-3">
 <div className="flex items-center justify-between text-[10px] font-black uppercase ">
 <span className="text-gray-500">{isTop10 ? (isRtl ? "شما جزو برترین‌ها هستید!" : "You are in top tier!") : (isRtl ? "رسیدن به ۱۰ نفر برتر" : "Reach top 10 Players")}</span>
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
 "text-[10px] font-black uppercase animate-pulse",
 isTop10 ? "text-yellow-400" : "text-gray-500"
 )}>
 {isTop10 ? (isRtl ? "✨ تبریک! شما در لیست ۱۰ نفر برتر هستید ✨" : "✨ Incredible! You are in the top 10 Elite lists! ✨") : (isRtl ? `فقط ${userRank.pointsToTop10.toLocaleString()} امتیاز تا ۱۰ نفر برتر!` : `Only ${userRank.pointsToTop10.toLocaleString()} XP to top 10 players!`)}
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
 "text-[11px] font-black uppercase ",
 isTop10 ? "text-dark-bg" : "text-white"
 )}>{isRtl ? "مشاهده رتبه‌بندی جهانی" : "Explore Leaderboards"}</span>
 <ArrowRight size={16} className={cn("mr-2 group-hover/btn:translate-x-1 transition-transform", isTop10 ? "text-dark-bg" : "text-white")} />
 </GlowButton>
 </div>
 </motion.div>
 </div>

 <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
 {/* Active Lobbies */}
 <div className="lg:col-span-2 space-y-6">
 <div className="flex items-center justify-between">
 <h2 className="text-xl font-bold text-white">{isRtl ? "لابی‌های پیشنهادی" : "Suggested Lobbies"}</h2>
 <button className="text-sm text-neon-blue hover:underline" onClick={() => navigate("/lobbies")}>{isRtl ? "مشاهده همه" : "Explore All"}</button>
 </div>
 <div className="space-y-4">
 {suggestedLobbies.map((item: any, i) => {
 const isVipLobby = item.host?.profile?.membershipType === 'VIP';
 return (
 <motion.div
 key={item.id}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.1 }}
 >
 <NeonCard variant={isVipLobby ? "purple" : "blue"} className={cn("flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 relative overflow-hidden", isVipLobby && "border-yellow-400/40 shadow-[0_0_20px_rgba(250,204,21,0.1)]")} hover={true}>
 {item.game?.bannerUrl && (
 <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
 <SmartImage src={item.game.bannerUrl} className="w-full h-full object-cover" alt="" />
 <div className={cn("absolute inset-0 bg-gradient-to-r", isRtl ? "from-[#0d0d12] via-[#0d0d12]/80 to-transparent" : "from-transparent via-[#0d0d12]/80 to-[#0d0d12]")} />
 </div>
 )}
 {isVipLobby && (
 <div className="absolute top-0 right-0 h-10 w-10 bg-yellow-400/10 rounded-bl-3xl flex items-start justify-end p-2 border-b border-l border-yellow-400/20 shadow-[-5px_5px_15px_rgba(250,204,21,0.05)] z-20">
 <Crown size={12} className="text-yellow-400" />
 </div>
 )}
 <div className="flex items-center gap-4 z-10 w-full sm:w-auto">
 <div className={cn("h-16 w-16 md:h-16 md:w-28 rounded-xl overflow-hidden shrink-0 border relative group-hover:scale-105 transition-transform", isVipLobby ? "border-yellow-400/30 shadow-[0_0_15px_rgba(250,204,21,0.2)]" : "border-neon-blue/30 shadow-[0_0_15px_rgba(0,229,255,0.2)]")}>
 {item.game?.bannerUrl || item.game?.iconUrl ? (
 <SmartImage src={item.game.bannerUrl || item.game.iconUrl} alt={item.game.title} className="w-full h-full object-cover" />
 ) : (
 <div className={cn("w-full h-full flex items-center justify-center text-xl font-bold", isVipLobby ? "bg-yellow-400/10 text-yellow-400" : "bg-neon-blue/10 text-neon-blue")}>
 {item.game?.title?.[0] || "🎮"}
 </div>
 )}
 <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/90 to-transparent" />
 {item.game?.iconUrl && (
 <SmartImage src={item.game.iconUrl} alt="icon" className="absolute bottom-1.5 left-1.5 w-6 h-6 rounded-md object-cover shadow-md border border-white/20" />
 )}
 </div>
 <div className="min-w-0 pr-2">
 <div className="flex items-center gap-2">
 <h4 className="font-bold text-white text-base md:text-lg truncate drop-shadow-md">{item.title}</h4>
 {isVipLobby && <span className="px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 text-[8px] font-black uppercase border border-yellow-400/40">ELITE</span>}
 </div>
 <p className="text-xs text-gray-300 truncate mt-0.5 drop-shadow">{item.game?.title} • {item.region}</p>
 </div>
 </div>
 <div className="flex items-center justify-between sm:justify-start gap-6 border-t border-white/5 pt-3 sm:border-0 sm:pt-0 z-10">
 <div className="text-right sm:text-left z-10 w-full sm:w-auto flex items-center sm:block justify-between">
 <div className="sm:mb-1">
 <p className="text-[10px] text-gray-400 uppercase font-black inline-block sm:block ml-2 sm:ml-0 drop-shadow">{isRtl ? "ظرفیت" : "Capacity"}</p>
 <p className={cn("font-bold inline-block sm:block text-sm sm:text-base drop-shadow-md", isVipLobby ? "text-yellow-400" : "text-neon-blue")}>{item.members?.length || 0}/{item.maxPlayers}</p>
 </div>
 <GlowButton variant={isVipLobby ? "gold" : "blue"} size="sm" className="h-9 px-6 sm:ml-0 hover:scale-[1.02] transition-transform" onClick={() => navigate(`/lobby/${item.id}`)}>{isRtl ? "عضویت" : "Join"}</GlowButton>
 </div>
 </div>
 </NeonCard>
 </motion.div>
 )})
 }
 {suggestedLobbies.length === 0 && (
 <div className="text-center py-8 text-gray-500 ">{isRtl ? "لابی فعالی پیدا نشد." : "No active lobbies found."}</div>
 )}
 </div>
 </div>

 {/* Friends Activity */}
 <div className="flex flex-col">
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-xl font-bold text-white">{isRtl ? "فعالیت دوستان" : "Friends Activity"}</h2>
 <div className="h-1 w-12 rounded-full bg-neon-purple/50" />
 </div>
 <NeonCard variant="purple" className="flex flex-col p-2">
 <div className={`space-y-1 ${isFriendsExpanded ? "max-h-[350px] overflow-y-auto custom-scrollbar" : ""}`}>
 <AnimatePresence>
 {visibleFriends.map((friend, idx) => { 
 const isFaded = !isFriendsExpanded && idx === 2;
 return (
 <motion.div 
 key={friend.id}
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, scale: 0.9 }}
 className={`group relative flex items-center justify-between rounded-xl p-2 transition-all ${isFaded ? "opacity-30 blur-[1px] pointer-events-none select-none" : "hover:bg-white/5"}`}
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
 src={friend.avatar || (friend as any).avatarUrl || ""} 
 fallbacks={getAvatarFallbacks(friend.username)}
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
 {friend.badges?.filter((b: any) => b?.isSpecial).map((badge: any, idx: number) => (
 <img key={idx} src={badge.iconUrl} alt={badge.name} title={badge.name} className="h-3 w-3 object-contain" />
 ))}
 </div>
 </div>
 <p className="text-[10px] text-gray-500 line-clamp-1 ">
 {friend.status === FriendStatus.IN_GAME ? (isRtl ? `🎮 ${friend.currentGame}` : `🎮 Playing ${friend.currentGame}`) : 
 friend.status === FriendStatus.ONLINE ? (isRtl ? "آنلاین" : "Online") : 
 friend.lastSeen || (isRtl ? "آفلاین" : "Offline")}
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
 )})}
 </AnimatePresence>

 {friends.length === 0 && (
 <p className="py-8 text-center text-xs text-gray-600">{isRtl ? "هنوز دوستی ندارید" : "No friends added yet"}</p>
 )}
 </div>
 
 <GlowButton 
 variant="purple" 
 className="w-full text-[11px] h-9 mt-auto pt-4" 
 size="sm"
 onClick={() => setIsFriendsExpanded(!isFriendsExpanded)}
 >
 {isFriendsExpanded ? (isRtl ? "بستن لیست" : "Collapse List") : (isRtl ? "مشاهده همه دوستان" : "View All Friends")}
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

 <AnimatePresence>
 {rewardNotification && rewardNotification.showModal && (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 "
 >
 <motion.div 
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="bg-[#0a0a0f] border border-yellow-400/40 shadow-[0_0_80px_rgba(250,204,21,0.2)] rounded-[32px] p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden"
 >
 <div className="absolute inset-0 bg-yellow-400/5 mix-blend-overlay" />
 
 <div className="relative z-10 flex flex-col items-center">
 <div className="h-24 w-24 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400 mb-6 relative">
 <Crown size={48} className="drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
 <motion.div 
 animate={{ rotate: 360 }}
 transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
 className="absolute inset-0 border-2 border-dashed border-yellow-400/30 rounded-full"
 />
 </div>
 
 <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
 {isRtl ? (
 <>تبریک! شما در جمع <span className="text-yellow-400">نخبگان</span> هستید</>
 ) : (
 <>Congrats! You are among the <span className="text-yellow-400">Elite</span> players</>
 )}
 </h2>
 <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-8">
 {isRtl ? (
 <>شما مقام <span className="text-white font-bold text-lg mx-1">{rewardNotification.rank}</span> را در رتبه‌بندی هفتگی کسب کردید و به پاس تلاش شما، <span className="text-yellow-400 font-black text-lg mx-1">{rewardNotification.daysVIP} روز</span> اشتراک <strong className="text-yellow-400 mx-1">VIP</strong> به شما هدیه داده شد.</>
 ) : (
 <>You earned rank <span className="text-white font-bold text-lg mx-1">{rewardNotification.rank}</span> in the weekly leaderboards. To reward your achievements, <span className="text-yellow-400 font-black text-lg mx-1">{rewardNotification.daysVIP} Days</span> of <strong className="text-yellow-400 mx-1">VIP</strong> subscription has been granted to you.</>
 )}
 </p>
 
 <button 
 onClick={handleDismissReward}
 className="h-12 px-8 rounded-full bg-yellow-400 text-[#0a0a0f] font-black uppercase text-sm hover:bg-yellow-300 transition-colors shadow-[0_0_20px_rgba(250,204,21,0.4)]"
 >
 {isRtl ? "دریافت پاداش و ورود" : "Claim Reward & Enter"}
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}

 {showReferralModal && (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 "
 >
 <motion.div 
 initial={{ scale: 0.9, opacity: 0, y: 30 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 30 }}
 className="bg-[#09090e] border border-neon-pink/40 shadow-[0_0_80px_rgba(236,72,153,0.15)] rounded-[32px] p-6 md:p-10 max-w-lg w-full text-center relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 w-48 h-48 bg-neon-pink/10 rounded-full blur-[100px] pointer-events-none" />
 <div className="absolute bottom-0 left-0 w-48 h-48 bg-neon-blue/5 rounded-full blur-[100px] pointer-events-none" />
 
 <div className="relative z-10 flex flex-col items-center">
 <div className="h-16 w-16 rounded-2xl bg-neon-pink/10 border border-neon-pink/20 flex items-center justify-center text-neon-pink mb-5 shadow-lg shadow-neon-pink/10">
 <Gift size={32} className="animate-bounce" />
 </div>
 
 <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
 {isRtl ? (
 <>دعوت از رفقا، هدیه <span className="text-neon-pink font-sans">VIP</span> دوجانبه!</>
 ) : (
 <>Refer friends, get mutual <span className="text-neon-pink font-sans">VIP</span> reward!</>
 )}
 </h2>
 <p className="text-gray-400 font-sans text-xs md:text-sm leading-relaxed mb-6">
 {isRtl ? "سیستم جدید و شگفت‌انگیز معرف لوکس فعال شد! با دعوت از هم‌تیمی‌ها و دوستانتان به پلتفرم، بازی را هیجان‌انگیزتر کنید و پاداش بگیرید." : "The new and incredible LOXX Referral program is live! Invite teammates and friends of yours to play together and earn premium VIP perks."}
 </p>
 
 {/* How it works */}
 <div className={cn("w-full space-y-3 mb-6 font-sans", isRtl ? "text-right" : "text-left")} dir={isRtl ? "rtl" : "ltr"}>
 <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-3.5 items-start">
 <span className="h-6 w-6 rounded-full bg-neon-pink/10 text-neon-pink border border-neon-pink/10 flex items-center justify-center text-xs font-black shrink-0">{isRtl ? "۱" : "1"}</span>
 <p className="text-xs text-gray-300 leading-relaxed">
 {isRtl ? <>نام کاربری شما (<strong className="text-white bg-white/5 px-2 py-0.5 rounded-md border border-white/10">{user?.username}</strong>) کد معرف شماست.</> : <>Your username (<strong className="text-white bg-white/5 px-2 py-0.5 rounded-md border border-white/10">{user?.username}</strong>) is your referrer code.</>}
 </p>
 </div>
 
 <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-3.5 items-start">
 <span className="h-6 w-6 rounded-full bg-neon-pink/10 text-neon-pink border border-neon-pink/10 flex items-center justify-center text-xs font-black shrink-0">{isRtl ? "۲" : "2"}</span>
 <p className="text-xs text-gray-300 leading-relaxed">
 {isRtl ? <>دوستتان در زمان ثبت‌نام، نام کاربری شما را در بخش <strong className="text-neon-pink">نام کاربری معرف</strong> وارد می‌کند.</> : <>Your friend enters your username in the <strong className="text-neon-pink">Referral Username</strong> field when registering.</>}
 </p>
 </div>

 <div className="p-3.5 rounded-2xl bg-neon-pink/[0.02] border border-neon-pink/10 flex gap-3.5 items-start">
 <span className="h-6 w-6 rounded-full bg-neon-pink/20 text-neon-pink border border-neon-pink/20 flex items-center justify-center text-xs font-black shrink-0">✨</span>
 <p className="text-xs text-neon-pink leading-relaxed font-black">
 {isRtl ? "بوم! هر ۲ نفر شما ۳ روز اشتراک کاملاً رایگان VIP لوکس به محض تایید حساب رفیقتان دریافت می‌کنید! (۱۰ دوست = ۳۰ روز VIP رایگان بدون محدودیت!)" : "Boom! Both of you get 3 days of VIP privileges once your friend's account is verified! (10 friends = 30 free VIP days - no limits!)"}
 </p>
 </div>
 </div>

 {/* Share actions */}
 <div className="w-full grid grid-cols-2 gap-3 mb-8">
 <button 
 onClick={() => handleCopyText(user?.username || "", "username")}
 className="h-12 rounded-xl bg-white/[0.02] border border-white/10 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/[0.05] transition-all flex items-center justify-center gap-2"
 >
 {copiedType === "username" ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
 <span>{isRtl ? "کپی نام کاربری" : "Copy Username"}</span>
 </button>
 <button 
 onClick={() => handleCopyText(`${window.location.origin}/auth`, "link")}
 className="h-12 rounded-xl bg-neon-pink/10 border border-neon-pink/20 text-xs font-black text-neon-pink hover:bg-neon-pink/20 transition-all flex items-center justify-center gap-2 shadow-lg shadow-neon-pink/5"
 >
 {copiedType === "link" ? <Check size={16} className="text-green-400" /> : <Share2 size={16} />}
 <span>{isRtl ? "کپی لینک دعوت" : "Copy Invite Link"}</span>
 </button>
 </div>
 
 <button 
 onClick={handleCloseReferralModal}
 className="h-12 px-8 w-full rounded-2xl bg-white text-[#0a0a0f] font-black uppercase text-xs hover:bg-white/90 transition-colors shadow-lg shadow-white/5 font-sans"
 >
 {isRtl ? "متوجه شدم، بزن بریم!" : "Got it, let's go!"}
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </main>
 </div>
 );
};
