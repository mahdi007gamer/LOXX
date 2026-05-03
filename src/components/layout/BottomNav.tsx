import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Gamepad2, Trophy } from 'lucide-react';
import { cn } from '../../lib/utils';

export const BottomNav = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: "داشبورد", path: "/dashboard" },
    { icon: Gamepad2, label: "بازی‌ها", path: "/games" },
    { icon: MessageSquare, label: "چت", path: "/chat", isSpecial: true },
    { icon: Users, label: "لابی‌ها", path: "/lobbies" },
    { icon: Trophy, label: "رتبه‌بندی", path: "/ranking" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[5000] bg-dark-bg/80 border-t border-white/10 backdrop-blur-xl md:hidden h-16">
      <div className="flex items-center justify-around h-full px-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center gap-1 transition-all duration-300 h-full relative",
              item.isSpecial ? "w-16 h-16 -mt-6 bg-dark-bg border-2 border-neon-blue rounded-full shadow-[0_0_20px_rgba(0,229,255,0.3)] z-10" : "flex-1",
              isActive 
                ? "text-neon-blue drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" 
                : "text-gray-500 hover:text-white"
            )}
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "flex flex-col items-center justify-center gap-1",
                  item.isSpecial && "translate-y-[-2px]"
                )}>
                  <item.icon size={item.isSpecial ? 24 : 18} className={cn(item.isSpecial && "text-neon-blue")} />
                  <span className={cn(
                    "text-[9px] font-bold tracking-tight whitespace-nowrap",
                    item.isSpecial && "text-neon-blue"
                  )}>{item.label}</span>
                </div>
                {isActive && !item.isSpecial && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-neon-blue shadow-[0_0_8px_rgba(0,229,255,1)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};
