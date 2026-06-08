import React, { useEffect, useState } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { 
 User, 
 Shield, 
 Crown, 
 Zap, 
 CheckCircle2, 
 Clock, 
 Target, 
 Award, 
 Star, 
 Sparkles,
 UserPlus
} from "lucide-react";
import { GlowButton } from "../components/ui/GlowButton";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { cn } from "../lib/utils";
import { BadgeType, MembershipType } from "../types";
import { SmartImage } from "../components/ui/SmartImage";

export const PublicProfilePage = () => {
 const { isSidebarCollapsed } = useAuth();
 const { username } = useParams<{ username: string }>();
 const [profile, setProfile] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const navigate = useNavigate();

 useEffect(() => {
 const fetchProfile = async () => {
 try {
 const response = await api.get(`/user/${username}`);
 setProfile(response.data.data);
 } catch (error) {
 console.error("Failed to fetch profile", error);
 } finally {
 setLoading(false);
 }
 };
 if (username) fetchProfile();
 }, [username]);

 if (loading) {
 return (
 <div className="flex h-screen items-center justify-center bg-[#050507]">
 <div className="flex flex-col items-center gap-4">
 <div className="h-16 w-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin" />
 <p className="text-neon-blue font-black animate-pulse">درحال بارگذاری پروفایل...</p>
 </div>
 </div>
 );
 }

 if (!profile) {
 return (
 <div className="flex min-h-[calc(100vh-64px)]">
 <Sidebar />
 <main className={cn("flex-1 px-4 py-8 flex flex-col items-center justify-center text-center transition-all duration-300", !isSidebarCollapsed ? "md:mr-64 mr-0" : "md:mr-20 mr-0")}>
 <div className="h-32 w-32 rounded-[40px] bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-6">
 <Shield size={64} className="opacity-50" />
 </div>
 <h2 className="text-2xl font-black text-white uppercase ">کاربر یافت نشد</h2>
 <p className="text-gray-500 text-sm mt-2 font-bold">پروفایلی با این مشخصات در لوکس وجود ندارد.</p>
 <GlowButton variant="blue" className="mt-8 px-10 !rounded-2xl font-black " onClick={() => navigate(-1)}>بازگشت به صفحه قبل</GlowButton>
 </main>
 </div>
 );
 }

 const isVip = profile.membership === "VIP" || profile.membership === MembershipType.VIP || profile.role === "STREAMER";
 const isPlus = profile.membership === "PLUS" || profile.membership === MembershipType.PLUS;

 return (
 <div className="flex min-h-[calc(100vh-64px)]">
 <Sidebar />
 <main className={cn("flex-1 px-4 py-8 lg:px-8 transition-all duration-300", !isSidebarCollapsed ? "md:mr-64" : "md:mr-20")}>
 <div className="container mx-auto max-w-5xl">
 {/* Enhanced Public Header */}
 <div className={cn(
 "relative mb-8 overflow-hidden rounded-[40px] bg-[#0a0a0f] border transition-all duration-700",
 isVip || isPlus ? "border-yellow-400/30 shadow-[0_40px_100px_-20px_rgba(250,204,21,0.15)]" : "border-white/10"
 )}>
 {/* Banner Area */}
 <div className="h-64 w-full relative">
 {profile.bannerUrl ? (
 <SmartImage 
 src={profile.bannerUrl} 
 isVipEnabled={isVip || isPlus} 
 alt="Banner" 
 className="w-full h-full object-cover" 
 />
 ) : (
 <div className={cn(
 "w-full h-full bg-gradient-to-br",
 isVip ? "from-yellow-400/20 via-orange-500/10 to-transparent" :
 isPlus ? "from-neon-blue/20 via-blue-600/10 to-transparent" :
 "from-white/5 to-transparent"
 )} />
 )}
 <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
 </div>
 
 <div className="px-10 pb-10">
 <div className="relative -mt-20 flex flex-col items-end gap-8 sm:flex-row">
 {/* Avatar */}
 <div className="relative group mx-auto sm:mx-0">
 <div className={cn(
 "h-40 w-40 rounded-[48px] bg-[#0a0a0f] p-1 shadow-2xl relative z-10",
 isVip ? "bg-gradient-to-tr from-yellow-400 via-yellow-200 to-yellow-600" :
 isPlus ? "bg-neon-blue" : "border border-white/10"
 )}>
 <div className="h-full w-full rounded-[42px] bg-[#0d0d12] flex items-center justify-center overflow-hidden">
 {profile.avatarUrl ? (
 <SmartImage 
 src={profile.avatarUrl} 
 isVipEnabled={isVip || isPlus} 
 alt={profile.username} 
 className="h-full w-full object-cover" 
 />
 ) : (
 <User size={64} className="text-gray-700" />
 )}
 </div>
 </div>
 {isVip && (
 <div className="absolute -top-4 -right-4 h-12 w-12 rounded-full bg-yellow-400 flex items-center justify-center text-dark-bg border-4 border-[#0a0a0f] shadow-2xl z-20">
 <Crown size={22} fill="currentColor" />
 </div>
 )}
 {isPlus && (
 <div className="absolute -top-4 -right-4 h-12 w-12 rounded-full bg-neon-blue flex items-center justify-center text-dark-bg border-4 border-[#0a0a0f] shadow-2xl z-20">
 <Zap size={22} fill="currentColor" />
 </div>
 )}
 </div>

 <div className="flex-1 pt-6 text-center sm:text-right w-full">
 <div className="flex items-center justify-center sm:justify-start gap-4">
 <h1 className={cn(
 "text-4xl font-black uppercase",
 isVip ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200" : "text-white"
 )}>
 {profile.displayName || profile.username}
 </h1>
 <CheckCircle2 size={24} className="text-neon-blue" fill="currentColor" />
 </div>
 <div className="flex items-center justify-center sm:justify-start gap-3 mt-2">
 <span className="text-xs text-gray-400 font-mono">@{profile.username}</span>
 <div className="h-1 w-1 rounded-full bg-gray-700" />
 <span className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1.5">
 <Clock size={12} /> عضویت از {profile.stats?.daysSinceJoin || 0} روز پیش
 </span>
 </div>
 <p className="mt-4 text-gray-400 text-sm max-w-2xl leading-relaxed line-clamp-2">{profile.bio || "بایوگرافی هنوز تنظیم نشده است"}</p>
 </div>
 
 <div className="flex items-center gap-3 self-center sm:self-end mt-4 sm:mt-0">
 <GlowButton 
 variant="blue" 
 className="px-8 h-12 gap-2 !rounded-2xl font-black text-xs uppercase"
 onClick={() => {
 api.post("/friends/request", { username: profile.username })
 .then(() => toast.success("درخواست دوستی ارسال شد"))
 .catch((err) => toast.error(err.response?.data?.error?.message || "خطا در ارسال درخواست"));
 }}
 >
 <UserPlus size={16} />
 <span>ارسال درخواست دوستی</span>
 </GlowButton>
 </div>
 </div>
 </div>
 </div>
 
 <div className="grid gap-8 md:grid-cols-3">
 {/* Stats Column */}
 <div className="md:col-span-1 space-y-6">
 <NeonCard variant="blue" className="p-8">
 <h3 className="flex items-center gap-3 font-black text-white uppercase text-xl mb-6">
 <Target size={20} className="text-neon-blue shadow-glow" />
 <span>آمار کاربر</span>
 </h3>
 <div className="grid grid-cols-1 gap-4">
 <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
 <span className="text-[10px] text-gray-500 font-black uppercase ">دوستان</span>
 <span className="text-xl font-black text-white ">{profile.stats?.friendsCount || 0}</span>
 </div>
 <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
 <span className="text-[10px] text-gray-500 font-black uppercase ">لابی‌های شرکت کرده</span>
 <span className="text-xl font-black text-white ">{profile.stats?.lobbiesJoined || 0}</span>
 </div>
 <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
 <span className="text-[10px] text-gray-500 font-black uppercase ">لابی‌های ایجاد شده</span>
 <span className="text-xl font-black text-white ">{profile.stats?.lobbiesCreated || 0}</span>
 </div>
 </div>
 </NeonCard>

 <NeonCard variant="purple" className="p-8">
 <h3 className="flex items-center gap-3 font-black text-white uppercase text-xl mb-6">
 <Award size={20} className="text-neon-purple" />
 <span>نشان‌های کاربر</span>
 </h3>
 <div className="flex flex-wrap gap-3">
 <div className="h-10 w-10 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue"><Award size={20} /></div>
 <div className="h-10 w-10 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400"><Star size={20} /></div>
 <div className="h-10 w-10 rounded-xl bg-neon-pink/10 flex items-center justify-center text-neon-pink"><Sparkles size={20} /></div>
 </div>
 </NeonCard>
 </div>
 
 {/* Bio & Activities */}
 <div className="md:col-span-2 space-y-6">
 <NeonCard className={cn(
 "p-8",
 isVip ? "border-neon-pink/30 bg-gradient-to-br from-transparent to-neon-pink/5 shadow-[inset_0_0_50px_rgba(236,72,153,0.05)]" : ""
 )}>
 <h3 className="text-2xl font-black text-white mb-6 uppercase">اطلاعات لوکس</h3>
 <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
 {profile.bio || "این گیمر هنوز بایوگرافی خود را تنظیم نکرده است."}
 </p>
 
 <div className="mt-12 pt-8 border-t border-white/5 grid grid-cols-2 lg:grid-cols-4 gap-6">
 <div className="text-center">
 <p className="text-[9px] text-gray-600 font-black uppercase mb-1 ">Level</p>
 <p className="text-2xl font-black text-white ">{profile.level || 1}</p>
 </div>
 <div className="text-center">
 <p className="text-[9px] text-gray-600 font-black uppercase mb-1 ">Status</p>
 <p className="text-2xl font-black text-neon-blue ">ONLINE</p>
 </div>
 <div className="text-center">
 <p className="text-[9px] text-gray-600 font-black uppercase mb-1 ">Rank</p>
 <p className="text-2xl font-black text-neon-pink ">SILVER</p>
 </div>
 <div className="text-center">
 <p className="text-[9px] text-gray-600 font-black uppercase mb-1 ">Rewards</p>
 <p className="text-2xl font-black text-white ">12</p>
 </div>
 </div>
 </NeonCard>
 </div>
 </div>
 </div>
 </main>
 </div>
 );
};
