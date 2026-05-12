import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Gamepad2, User, Bell, Menu, X, LayoutDashboard, Target, Users, MessageSquare, Trophy, Settings, Shield, LogOut, Zap, Crown } from "lucide-react";
import { GlowButton } from "../ui/GlowButton";
import { SmartImage } from "../ui/SmartImage";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "../../context/AuthContext";
import { NotificationCenter } from "../ui/NotificationCenter";
import { useProfilePopover } from "../../context/ProfilePopoverContext";
import { BadgeType, MembershipType } from "../../types";
import { getAvatarFallbacks } from "../../lib/avatar";

const menuItems = [
  { icon: LayoutDashboard, label: "داشبورد", path: "/dashboard" },
  { icon: Gamepad2, label: "بازی‌ها", path: "/games" },
  { icon: Users, label: "لابی‌ها", path: "/lobbies" },
  { icon: User, label: "دوستان", path: "/friends" },
  { icon: MessageSquare, label: "چت سراسری", path: "/chat" },
  { icon: Trophy, label: "رتبه‌بندی", path: "/ranking" },
  { icon: Shield, label: "اشتراک ویژه", path: "/premium" },
  { icon: Settings, label: "تنظیمات", path: "/settings" },
];

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { openProfile } = useProfilePopover();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

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
        className={cn(
          "fixed left-0 right-0 z-[10000] w-full transition-all duration-500 Richie-nav",
          !isLanding 
            ? "top-0 bg-[#050507]/95 border-b border-white/10 backdrop-blur-md"
            : isScrolled 
              ? "top-4 px-4" 
              : "top-0 bg-transparent"
        )}
      >
        <div 
          className={cn(
            "mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-500 relative",
            isLanding && isScrolled && "max-w-4xl rounded-2xl bg-[#050507]/90 px-8 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_15px_rgba(0,229,255,0.2)] backdrop-blur-xl border border-white/10"
          )}
        >
          {/* Left: Logo & Mobile Toggle */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <button 
              className="p-2 text-gray-400 hover:text-white md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/" className="flex items-center gap-4 group">
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
                    <span className="text-xl md:text-3xl font-black italic tracking-tighter text-white group-hover:text-neon-blue transition-colors uppercase">
                      لوکس
                    </span>
                    <span className="text-[8px] md:text-[10px] text-gray-400 font-bold tracking-widest hidden sm:block">
                      پیشرفته‌ترین پلتفرم گیمینگ فارسی
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          </div>

          {/* Middle: Centered Navigation */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <NavLink to="/lobbies" className={({ isActive }) => cn("transition-all font-black text-[10px] uppercase tracking-[0.2em] italic", isActive ? "text-neon-blue drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" : "text-gray-400 hover:text-white ripple-active")}>لابی‌ها</NavLink>
            <NavLink to="/chat" className={({ isActive }) => cn("transition-all font-black text-[10px] uppercase tracking-[0.2em] italic", isActive ? "text-neon-blue drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" : "text-gray-400 hover:text-white ripple-active")}>چت سراسری</NavLink>
            <NavLink to="/games" className={({ isActive }) => cn("transition-all font-black text-[10px] uppercase tracking-[0.2em] italic", isActive ? "text-neon-blue drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" : "text-gray-400 hover:text-white ripple-active")}>بازی‌ها</NavLink>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
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
                         src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
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
                  <GlowButton variant="blue" size="sm" className="h-10 px-6 rounded-full font-black text-[10px] tracking-widest uppercase italic">
                    ورود به حساب
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
              className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-[10001] h-full w-72 bg-[#050507] border-l border-white/10 flex flex-col md:hidden shadow-2xl"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5 pt-10">
                <span className="text-xl font-black italic text-white uppercase tracking-tighter">منو دسترسی</span>
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
                      <span className="text-sm font-black italic uppercase tracking-tight">{item.label}</span>
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
                            src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                            fallbacks={getAvatarFallbacks(user.username)}
                            isVipEnabled={isVIP || isPLUS}
                            className="h-full w-full object-cover" 
                            alt={user.username} 
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className="font-black text-white uppercase text-xs truncate italic tracking-tighter mb-0.5">
                          {user.displayName || user.username}
                        </p>
                        <div className="flex items-center justify-end gap-1.5 opacity-80">
                           {isVIP ? (
                             <span className="text-[9px] text-yellow-400 font-black tracking-widest uppercase flex items-center gap-1">
                               <Crown size={10} /> VIP ELITE
                             </span>
                           ) : isPLUS ? (
                             <span className="text-[9px] text-neon-blue font-black tracking-widest uppercase flex items-center gap-1">
                               <Zap size={10} /> PLUS GOLD
                             </span>
                           ) : (
                             <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase">
                               Regular Player
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
                      className="flex items-center justify-center gap-2.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 py-4 border border-red-500/10 hover:border-red-500/30 transition-all w-full font-black text-[10px] uppercase italic tracking-widest"
                    >
                      <LogOut size={16} />
                      خروج از حساب کاربری
                    </button>
                  </div>
                ) : (
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    <GlowButton variant="blue" className="w-full text-[10px] font-black uppercase italic h-14 !rounded-2xl shadow-none">
                      ورود / ثبت‌نام در سامانه
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
