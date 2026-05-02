import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Gamepad2, User, Bell, Menu, X, LayoutDashboard, Target, Users, MessageSquare, Trophy, Settings } from "lucide-react";
import { GlowButton } from "../ui/GlowButton";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { cn } from "@/src/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "داشبورد", path: "/dashboard" },
  { icon: Target, label: "اتاق‌های بازی", path: "/rooms" },
  { icon: Users, label: "لابی‌ها", path: "/lobbies" },
  { icon: MessageSquare, label: "چت سراسری", path: "/chat" },
  { icon: Trophy, label: "رتبه‌بندی", path: "/leaderboard" },
  { icon: Settings, label: "تنظیمات", path: "/settings" },
];

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  return (
    <>
      <nav 
        className={cn(
          "fixed left-0 right-0 z-[10000] w-full transition-all duration-500 will-change-[top,padding]",
          !isLanding 
            ? "top-0 bg-dark-bg/95 border-b border-white/10 backdrop-blur-md"
            : isScrolled 
              ? "top-4 px-4" 
              : "top-0 bg-transparent"
        )}
      >
        <div 
          className={cn(
            "mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-500",
            isLanding && isScrolled && "max-w-4xl rounded-2xl bg-dark-bg/90 px-8 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_15px_rgba(0,229,255,0.2)] backdrop-blur-xl border border-white/10"
          )}
        >
          <div className="flex items-center gap-8">
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
                className="h-12 w-auto drop-shadow-[0_0_15px_rgba(0,229,255,0.5)] transition-transform group-hover:scale-110"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden flex h-10 w-10 items-center justify-center rounded-xl bg-neon-blue/20 text-neon-blue shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                <Gamepad2 size={24} />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-2xl font-black tracking-tighter text-white group-hover:text-neon-blue transition-colors">
                  لوکس
                </span>
                <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap hidden md:block">
                  اولین و پیشرفته ترین پلتفرم گیمر های ایرانی
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <NavLink to="/lobbies" className={({ isActive }) => cn("transition-colors font-medium", isActive ? "text-neon-blue" : "text-gray-400 hover:text-neon-blue")}>لابی‌ها</NavLink>
              <NavLink to="/chat" className={({ isActive }) => cn("transition-colors font-medium", isActive ? "text-neon-blue" : "text-gray-400 hover:text-neon-blue")}>چت سراسری</NavLink>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button className="relative p-2 text-gray-400 hover:text-neon-pink transition-colors">
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-neon-pink shadow-[0_0_10px_rgba(255,0,153,0.8)]" />
            </button>
            
            <Link to="/profile" className="hidden sm:block">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-neon-purple/50 bg-neon-purple/10 text-neon-purple transition-all hover:shadow-[0_0_15px_rgba(160,32,240,0.5)]">
                <User size={20} />
              </div>
            </Link>

            <Link to="/auth">
              <GlowButton variant="blue" size="sm" className="hidden xs:flex">
                ورود
              </GlowButton>
            </Link>
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
              className="fixed right-0 top-0 z-[10001] h-full w-72 bg-dark-bg border-l border-white/10 p-6 pt-24 md:hidden shadow-2xl"
            >
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center gap-4 rounded-xl px-4 py-4 transition-all",
                      isActive 
                        ? "bg-neon-blue/10 text-neon-blue border-r-4 border-neon-blue" 
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon size={22} />
                    <span className="text-lg font-bold">{item.label}</span>
                  </NavLink>
                ))}
              </div>

              <div className="absolute bottom-10 left-6 right-6">
                <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 border border-white/10">
                    <div className="h-12 w-12 rounded-full bg-neon-purple/20 flex items-center justify-center text-neon-purple">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-white uppercase">Ali_Gamer</p>
                      <p className="text-xs text-gray-500">LEVEL 42</p>
                    </div>
                  </div>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
