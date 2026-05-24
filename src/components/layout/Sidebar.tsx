import React from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut,
  Trophy,
  Gamepad2,
  Heart,
  Crown
} from "lucide-react";
import { cn } from "@/src/lib/utils";

import { useAuth } from "../../context/AuthContext";
import { Shield } from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "داشبورد", path: "/dashboard" },
  { icon: Gamepad2, label: "بازی‌ها", path: "/games" },
  { icon: Users, label: "لابی‌ها", path: "/lobbies" },
  { icon: Users, label: "دوستان", path: "/friends" },
  { icon: MessageSquare, label: "چت سراسری", path: "/chat" },
  { icon: Trophy, label: "رتبه‌بندی", path: "/ranking" },
  { icon: Crown, label: "اشتراک ویژه", path: "/premium" },
  { icon: Settings, label: "تنظیمات", path: "/settings" },
];

export const Sidebar = () => {
  const { user, logout, isSidebarCollapsed } = useAuth();
  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
  
  if (isSidebarCollapsed) return null;
  
  return (
    <aside 
      className={cn(
        "fixed right-0 hidden w-64 border-l border-white/10 bg-dark-[#050507]/50 bg-dark-bg/50 backdrop-blur-lg md:block z-[40]",
        isElectron 
          ? "top-[100px] h-[calc(100vh-100px)]" 
          : "top-16 h-[calc(100vh-64px)]"
      )}
    >
      <div className="flex h-full flex-col justify-between py-6">
        <div className="space-y-1 px-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-300",
                isActive 
                  ? "bg-neon-blue/10 text-neon-blue shadow-[inset_0_0_10px_rgba(0,229,255,0.1)] border-r-2 border-neon-blue" 
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-100"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
          
          {(user?.role === "ADMIN" || user?.email === "admin@loxx.ir" || user?.email === "admin@test.com") && (
            <NavLink
              to="/admin"
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-300",
                isActive 
                  ? "bg-neon-blue/10 text-neon-blue shadow-[inset_0_0_10px_rgba(0,229,255,0.1)] border-r-2 border-neon-blue" 
                  : "text-amber-400/80 hover:bg-white/5 hover:text-amber-400"
              )}
            >
              <Shield size={20} />
              <span className="font-medium">پنل مدیریت</span>
            </NavLink>
          )}
        </div>

        <div className="px-4">
          <button 
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-400 hover:bg-neon-pink/10 hover:text-neon-pink transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">خروج</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
