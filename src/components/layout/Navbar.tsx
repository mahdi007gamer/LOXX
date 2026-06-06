import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Gamepad2, User, Bell, Menu, X, LayoutDashboard, Target, Users, MessageSquare, Trophy, Settings, Shield, LogOut, Zap, Crown, Phone, Globe, Download } from "lucide-react";
import { GlowButton } from "../ui/GlowButton";
import { SmartImage } from "../ui/SmartImage";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { NotificationCenter } from "../ui/NotificationCenter";
import { useProfilePopover } from "../../context/ProfilePopoverContext";
import { BadgeType, MembershipType } from "../../types";
import { getAvatarFallbacks } from "../../lib/avatar";

const menuItems = [
 { icon: LayoutDashboard, label: "داشبورد", translationKey: "dashboard", path: "/dashboard" },
 { icon: Gamepad2, label: "بازی‌ها", translationKey: "games", path: "/games" },
 { icon: Users, label: "لابی‌ها", translationKey: "lobbies", path: "/lobbies" },
 { icon: User, label: "دوستان", translationKey: "friends", path: "/friends" },
 { icon: MessageSquare, label: "چت سراسری", translationKey: "globalChat", path: "/chat" },
 { icon: Trophy, label: "رتبه‌بندی", translationKey: "rankings", path: "/ranking" },
 { icon: Phone, label: "ارتباط با ما", translationKey: "contactUs", path: "/contact" },
 { icon: Shield, label: "اشتراک ویژه", translationKey: "premiumClub", path: "/premium" },
 { icon: Settings, label: "تنظیمات", translationKey: "settings", path: "/settings" },
];

export const Navbar = () => {
 const { user, logout, isSidebarCollapsed, setIsSidebarCollapsed } = useAuth();
 const { language, toggleLanguage, t } = useLanguage();
 const { openProfile } = useProfilePopover();
 const [isMenuOpen, setIsMenuOpen] = useState(false);
 const { scrollY } = useScroll();
 const [isScrolled, setIsScrolled] = useState(false);
 const location = useLocation();
 const isLanding = location.pathname === "/";
 const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
 const isInvitePage = location.pathname.startsWith("/invite/") || location.pathname.startsWith("/proposal/");
 const isRtl = language === "fa";

 useMotionValueEvent(scrollY, "change", (latest) => {
 setIsScrolled(latest > 50);
 });

 const handleOpenMyProfile = (e: React.MouseEvent) => {
 e.preventDefault();
 if (user) {
 openProfile({
 senderName: user.username, // Use username for stable API lookups
 displayName: user.displayName || user.username,
 senderAvatar: user.avatarUrl,
 bannerUrl: user.bannerUrl,
 senderLevel: 24, // Fallback or dynamic
 senderBadges: user.badges || [], // Use real badges from AuthContext
 id: user.id,
 membership: user.membership as any,
 vipMetadata: user.vipMetadata,
 stats: (user as any).stats
 }, true);
 }
 };

 const isVIP = user?.membership === "VIP" || user?.membership === MembershipType.VIP;
 const isPLUS = user?.membership === "PLUS" || user?.membership === MembershipType.PLUS;

 return (
 <>
 <nav 
 dir={isRtl ? "rtl" : "ltr"}
 className={cn(
 "fixed left-0 right-0 z-[10000] w-full transition-all duration-500 Richie-nav pointer-events-none",
 isElectron 
 ? (isLanding && isScrolled ? "top-16 px-4" : "top-9")
 : (!isLanding ? "top-0" : (isScrolled ? "top-4 px-4" : "top-0")),
 !isLanding
 ? "bg-[#050507]/95 border-b border-white/10 md:"
 : "bg-transparent"
 )}
 >
 <div 
 className={cn(
 "mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-500 relative pointer-events-auto",
 isLanding && isScrolled ? "max-w-4xl rounded-2xl bg-[#050507]/95 px-8 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_15px_rgba(0,229,255,0.2)] md:border border-white/10"
 : isLanding && !isScrolled ? ""
 : "max-w-none px-4 sm:px-6 lg:px-8" // Reset when not landing
 )}
 >
 {/* Left: Logo & Mobile Toggle */}
 <div className="flex items-center gap-4 flex-shrink-0">
 {!isLanding && (
 <button 
 id="navbar-sidebar-toggle"
 onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
 className="hidden md:inline-flex p-2 text-gray-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/5 active:scale-95"
 title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
 >
 <Menu size={22} />
 </button>
 )}
 {!isInvitePage && (!isElectron) && (
 <>
 <button 
 className={cn("p-2 text-gray-400 hover:text-white animate-fade-in", "md:hidden")}
 onClick={() => setIsMenuOpen(!isMenuOpen)}
 >
 {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
 </button>
 </>
 )}
 <Link to="/dashboard" className="flex items-center gap-4 group">
 <img 
 src="/logo.png" 
 alt="LOXX Logo" 
 className="h-8 w-auto md:h-10 drop-shadow-[0_0_15px_rgba(0,229,255,0.5)] transition-transform group-hover:scale-110"
 />
 <AnimatePresence>
 {!(isLanding && isScrolled) && (
 <motion.div 
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -10 }}
 className="flex flex-col -space-y-1"
 >
 <span className="text-xl md:text-3xl font-black text-white group-hover:text-neon-blue transition-colors uppercase">
 {language === "fa" ? "لوکس" : "LOXX"}
 </span>
 <span className="text-[8px] md:text-[10px] text-gray-400 font-bold hidden sm:block">
 {language === "fa" ? "پیشرفته‌ترین پلتفرم گیمینگ فارسی" : "ADVANCED GAMING PLATFORM"}
 </span>
 </motion.div>
 )}
 </AnimatePresence>
 </Link>
 </div>

 {/* Middle: Centered Navigation */}
 <div className="hidden md:flex items-center gap-4 lg:gap-6 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
 {user && (
 <NavLink 
 to="/dashboard" 
 title={t("dashboard")}
 className={({ isActive }) => 
 cn(
 "transition-all font-black text-[11px] uppercase px-3 py-1.5 border border-neon-blue/30 bg-neon-blue/5 text-neon-blue shadow-[0_0_12px_rgba(0,229,255,0.1)] hover:bg-neon-blue/20 hover:border-neon-blue/60 hover:text-white ripple-active transition-all duration-300 rounded-lg flex items-center gap-2",
 isActive && "border-neon-blue/80 bg-neon-blue/15 text-white shadow-[0_0_18px_rgba(0,229,255,0.3)]"
 )
 }
 >
 <LayoutDashboard size={14} className="shrink-0" />
 {!(isLanding && isScrolled) && <span>{t("dashboard")}</span>}
 </NavLink>
 )}

 <NavLink 
 to="/chat" 
 title={t("globalChat")}
 className={({ isActive }) => 
 cn(
 "transition-all font-black text-[10px] uppercase flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent transition-all duration-300", 
 isActive ? "text-neon-blue border-neon-blue/20 bg-neon-blue/5 shadow-[0_0_12px_rgba(0,229,255,0.1)]" : "text-gray-400 hover:text-white hover:bg-white/5"
 )
 }
 >
 <MessageSquare size={14} className="shrink-0" />
 {!(isLanding && isScrolled) && <span>{t("globalChat")}</span>}
 </NavLink>

 {!(isElectron) && (
<NavLink 
 to="/download" 
 title={isRtl ? "دانلود" : "Download"}
 className={({ isActive }) => 
 cn(
 "transition-all font-black text-[10px] uppercase flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent transition-all duration-300", 
 isActive ? "text-neon-blue border-neon-blue/20 bg-neon-blue/5 shadow-[0_0_12px_rgba(0,229,255,0.1)]" : "text-gray-400 hover:text-white hover:bg-white/5"
 )
 }
 >
 <Download size={14} className="shrink-0" />
 {!(isLanding && isScrolled) && <span>{isRtl ? "دانلود" : "Download"}</span>}
 </NavLink>
)}
 </div>

 {/* Right: Actions */}
 <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
 {/* Elegant Fixed Language Toggle Switcher */}
 <button
 onClick={toggleLanguage}
 className="hidden md:flex px-2.5 py-1 text-[10px] font-black rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white items-center gap-1.5 transition-all active:scale-95 duration-200 cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.05)] h-9"
 title="تغییر زبان / Switch Language"
 >
 <Globe size={12} className="text-neon-blue animate-pulse shrink-0" />
 <span className={cn(language === "fa" ? "text-orange-400 font-extrabold" : "text-gray-500")}>فا</span>
 <span className="text-gray-600">|</span>
 <span className={cn(language === "en" ? "text-neon-blue font-extrabold" : "text-gray-500")}>EN</span>
 </button>

 {user && <NotificationCenter />}
 
 {user ? (
 <div className="flex items-center gap-3">
 <div 
 onClick={handleOpenMyProfile}
 className={cn(
 "h-10 w-10 rounded-xl flex items-center justify-center p-0.5 cursor-pointer transition-all hover:scale-110 active:scale-95 shadow-xl",
 isVIP ? "bg-gradient-to-tr from-yellow-400 to-yellow-200" :
 isPLUS ? "bg-neon-blue" : "bg-white/5 border border-white/10"
 )}
 >
 <div className="h-full w-full rounded-[10px] bg-dark-bg flex items-center justify-center overflow-hidden">
 <SmartImage 
 src={user.avatarUrl || ""} 
 fallbacks={getAvatarFallbacks(user.username)}
 isVipEnabled={isVIP || isPLUS}
 className="h-full w-full object-cover" 
 alt={user.username} 
 />
 </div>
 </div>
 </div>
 ) : (
 <Link to="/auth">
 <GlowButton variant="blue" size="sm" className="h-10 px-6 rounded-full font-black text-[10px] uppercase ">
 {t("login")}
 </GlowButton>
 </Link>
 )}
 </div>
 </div>
 </nav>

 {/* Mobile Menu Overlay */}
 <AnimatePresence>
 {isMenuOpen && (
 <>
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setIsMenuOpen(false)}
 className="fixed inset-0 z-[10000] bg-black/60 md:hidden"
 />
 <motion.div
 initial={{ x: isRtl ? "100%" : "-100%" }}
 animate={{ x: 0 }}
 exit={{ x: isRtl ? "100%" : "-100%" }}
 transition={{ type: "spring", damping: 25, stiffness: 200 }}
 className={cn(
 "fixed top-0 z-[10001] h-full w-72 bg-[#050507] flex flex-col md:hidden shadow-2xl transition-all duration-300",
 isRtl ? "right-0 border-l border-white/10" : "left-0 border-r border-white/10"
 )}
 >
 {/* Menu Header */}
 <div className="flex items-center justify-between p-6 border-b border-white/5 pt-10">
 <span className="text-xl font-black text-white uppercase ">{t("menuPlaceholder")}</span>
 <button onClick={() => setIsMenuOpen(false)} className="text-gray-500 hover:text-white">
 <X size={24} />
 </button>
 </div>

 {/* Scrollable Links */}
 <div className="flex-1 overflow-y-auto p-4 space-y-1">
 {menuItems.map((item) => {
 const isActive = location.pathname === item.path;
 return (
 <NavLink
 key={item.path}
 to={item.path}
 onClick={() => setIsMenuOpen(false)}
 className={cn(
 "flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all group",
 isActive 
 ? "bg-neon-blue/10 text-neon-blue" 
 : "text-gray-400 hover:bg-white/5 hover:text-white"
 )}
 >
 <item.icon size={20} className={cn(isActive && "drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]")} />
 <span className="text-sm font-black uppercase ">{t(item.translationKey)}</span>
 </NavLink>
 );
 })}
 </div>

 {/* Profile & Logout fixed at bottom */}
 <div className="p-5 border-t border-white/5 bg-black/40 mt-auto">
 {user ? (
 <div className="space-y-3">
 <div 
 onClick={(e) => {
 setIsMenuOpen(false);
 handleOpenMyProfile(e);
 }}
 className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 border border-white/10 hover:bg-white/10 transition-all group cursor-pointer"
 >
 <div className={cn(
 "h-12 w-12 rounded-[18px] p-0.5 shrink-0 transition-transform group-hover:scale-105",
 isVIP ? "bg-gradient-to-tr from-yellow-400 to-yellow-200" :
 isPLUS ? "bg-neon-blue" : "bg-white/10"
 )}>
 <div className="h-full w-full rounded-[15px] bg-[#050507] flex items-center justify-center overflow-hidden">
 <SmartImage 
 src={user.avatarUrl || ""} 
 fallbacks={getAvatarFallbacks(user.username)}
 isVipEnabled={isVIP || isPLUS}
 className="h-full w-full object-cover" 
 alt={user.username} 
 />
 </div>
 </div>
 <div className={cn("flex-1 min-w-0", isRtl ? "text-right" : "text-left")}>
 <p className="font-black text-white uppercase text-xs truncate mb-0.5">
 {user.displayName || user.username}
 </p>
 <div className={cn("flex items-center gap-1.5 opacity-80", isRtl ? "justify-end" : "justify-start")}>
 {isVIP ? (
 <span className="text-[9px] text-yellow-400 font-black uppercase flex items-center gap-1">
 <Crown size={10} /> VIP ELITE
 </span>
 ) : isPLUS ? (
 <span className="text-[9px] text-neon-blue font-black uppercase flex items-center gap-1">
 <Zap size={10} /> PLUS GOLD
 </span>
 ) : (
 <span className="text-[9px] text-gray-500 font-black uppercase">
 {t("regularPlayer")}
 </span>
 )}
 </div>
 </div>
 </div>
 <button 
 onClick={() => {
 logout();
 setIsMenuOpen(false);
 }} 
 className="flex items-center justify-center gap-2.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 py-4 border border-red-500/10 hover:border-red-500/30 transition-all w-full font-black text-[10px] uppercase "
 >
 <LogOut size={16} />
 {t("logoutBtn")}
 </button>
 </div>
 ) : (
 <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
 <GlowButton variant="blue" className="w-full text-[10px] font-black uppercase h-14 !rounded-2xl shadow-none">
 {t("loginOrRegister")}
 </GlowButton>
 </Link>
 )}
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>
 </>
 );
};
