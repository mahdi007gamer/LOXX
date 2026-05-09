import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Gamepad2, User, Bell, Menu, X, LayoutDashboard, Target, Users, MessageSquare, Trophy, Settings, Shield, LogOut } from "lucide-react";
import { GlowButton } from "../ui/GlowButton";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "../../context/AuthContext";
import { NotificationCenter } from "../ui/NotificationCenter";

const menuItems = [
  { icon: LayoutDashboard, label: "داشبورد", path: "/dashboard" },
  { icon: Gamepad2, label: "بازی‌ها", path: "/games" },
  { icon: Users, label: "لابی‌ها", path: "/lobbies" },
  { icon: MessageSquare, label: "چت سراسری", path: "/chat" },
  { icon: Trophy, label: "رتبه‌بندی", path: "/leaderboard" },
  { icon: Settings, label: "تنظیمات", path: "/settings" },
];

export const Navbar = () => {
  const { user } = useAuth();
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
            "mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-500 relative",
            isLanding && isScrolled && "max-w-4xl rounded-2xl bg-dark-bg/90 px-8 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_15px_rgba(0,229,255,0.2)] backdrop-blur-xl border border-white/10"
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
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden flex h-10 w-10 items-center justify-center rounded-xl bg-neon-blue/20 text-neon-blue shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                <Gamepad2 size={24} />
              </div>
              <AnimatePresence>
                {!(isLanding && isScrolled) && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col -space-y-1"
                  >
                    <span className="text-xl font-black tracking-tighter text-white group-hover:text-neon-blue transition-colors">
                      لوکس
                    </span>
                    <span className="text-[8px] font-bold text-gray-500 whitespace-nowrap hidden lg:block">
                      اولین و پیشرفته ترین پلتفرم گیمر های ایرانی
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          </div>

          {/* Middle: Centered Navigation */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <NavLink to="/lobbies" className={({ isActive }) => cn("transition-all font-bold text-xs uppercase tracking-[0.2em]", isActive ? "text-neon-blue drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" : "text-gray-400 hover:text-white hover:tracking-[0.3em]")}>لابی‌ها</NavLink>
            <NavLink to="/chat" className={({ isActive }) => cn("transition-all font-bold text-xs uppercase tracking-[0.2em]", isActive ? "text-neon-blue drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" : "text-gray-400 hover:text-white hover:tracking-[0.3em]")}>چت سراسری</NavLink>
            <NavLink to="/games" className={({ isActive }) => cn("transition-all font-bold text-xs uppercase tracking-[0.2em]", isActive ? "text-neon-blue drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" : "text-gray-400 hover:text-white hover:tracking-[0.3em]")}>بازی‌ها</NavLink>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {user && <NotificationCenter />}
            
            <Link to="/profile" className="hidden sm:block">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition-all hover:bg-white/10 hover:border-white/40 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <User size={20} />
              </div>
            </Link>

            <Link to="/auth">
              <GlowButton variant="blue" size="sm" className="hidden xs:flex h-10 px-6 rounded-full font-black text-[10px] tracking-widest">
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
                {user ? (
                  <div className="flex flex-col gap-2">
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                      <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 border border-white/10">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-neon-purple/20 flex items-center justify-center text-neon-purple shrink-0">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <User size={24} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 text-right">
                          <p className="font-bold text-white uppercase text-sm truncate">{user.displayName || user.username}</p>
                          <p className="text-[10px] text-gray-400 font-black tracking-widest truncate">{user.membership || "MEMBER"}</p>
                        </div>
                      </div>
                    </Link>
                    <button onClick={logout} className="flex items-center justify-center gap-2 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 p-4 border border-red-500/20 transition-colors w-full font-bold">
                      <LogOut size={18} />
                      خروج از حساب
                    </button>
                  </div>
                ) : (
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    <GlowButton variant="purple" className="w-full">
                      ورود / ثبت‌نام
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
