import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Gamepad2, Trophy, Crown, Heart, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

export const BottomNav = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: "داشبورد", path: "/dashboard" },
    { icon: Gamepad2, label: "بازی‌ها", path: "/games" },
    { icon: Heart, label: "بازی‌های من", path: "/my-games" },
    { icon: Users, label: "لابی‌ها", path: "/lobbies" },
    { icon: MessageSquare, label: "چت سراسری", path: "/chat" },
    { icon: Trophy, label: "رتبه‌بندی", path: "/ranking" },
    { icon: Crown, label: "اشتراک ویژه", path: "/premium" },
    { icon: Settings, label: "تنظیمات", path: "/settings" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[5000] bg-dark-bg/80 border-t border-white/10 backdrop-blur-xl md:hidden h-16 px-2 overflow-x-auto">
      <div className="flex items-center justify-between min-w-max h-full gap-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center gap-1 transition-all duration-300 px-3 h-full min-w-[70px]",
              isActive 
                ? "text-neon-blue drop-shadow-[0_0_8px_rgba(0,229,255,0.5)] border-t-2 border-neon-blue" 
                : "text-gray-500 hover:text-white"
            )}
          >
            <item.icon size={18} />
            <span className="text-[9px] font-bold tracking-tight whitespace-nowrap">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};
