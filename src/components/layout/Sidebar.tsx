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
  Crown,
  Zap,
  Mail,
  Phone
} from "lucide-react";
import { cn } from "@/src/lib/utils";

import { useAuth } from "../../context/AuthContext";
import { useFriends } from "../../context/FriendsContext";
import { useGames } from "../../context/GamesContext";
import { Shield } from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "داشبورد", path: "/dashboard" },
  { icon: Gamepad2, label: "بازی‌ها", path: "/games" },
  { icon: Users, label: "لابی‌ها", path: "/lobbies" },
  { icon: Users, label: "دوستان", path: "/friends" },
  { icon: MessageSquare, label: "چت سراسری", path: "/chat" },
  { icon: Trophy, label: "رتبه‌بندی", path: "/ranking" },
  { icon: Phone, label: "ارتباط با ما", path: "/contact" },
  { icon: Crown, label: "اشتراک ویژه", path: "/premium" },
  { icon: Settings, label: "تنظیمات", path: "/settings" },
];

export const Sidebar = () => {
  const { user, logout, isSidebarCollapsed } = useAuth();
  const { requests } = useFriends();
  const { myGames } = useGames();
  const [channelsUnread, setChannelsUnread] = React.useState(0);
  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
  
  React.useEffect(() => {
    if (!user?.id) return;

    const calcUnreads = () => {
      try {
        const stored = JSON.parse(localStorage.getItem(`loxx_chat_unreads_${user.id}`) || "{}");
        let sum = (stored["general"] || 0) + (stored["news"] || 0);

        if (myGames && myGames.length > 0) {
          myGames.forEach((g: any) => {
            sum += (stored[g.id] || 0);
          });
        }
        setChannelsUnread(sum);
      } catch (err) {
        console.error(err);
      }
    };

    calcUnreads();

    window.addEventListener("storage", calcUnreads);
    window.addEventListener("loxx-chat-unread-update", calcUnreads);

    return () => {
      window.removeEventListener("storage", calcUnreads);
      window.removeEventListener("loxx-chat-unread-update", calcUnreads);
    };
  }, [user?.id, myGames]);
  
  return (
    <aside 
      className={cn(
        "fixed right-0 hidden border-l border-white/10 bg-dark-[#050507]/50 bg-dark-bg/50 backdrop-blur-lg md:block z-[40] transition-all duration-300",
        isElectron 
          ? "top-[100px] h-[calc(100vh-100px)]" 
          : "top-16 h-[calc(100vh-64px)]",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col justify-between py-6">
        <div className="space-y-1 px-4">
          {menuItems.map((item) => {
            const incomingRequestsCount = item.path === "/friends" && requests 
              ? requests.filter(r => r.type === "incoming").length 
              : 0;
            const unreadCount = item.path === "/chat" ? channelsUnread : 0;
            const hasRequests = incomingRequestsCount > 0;
            const hasBadge = item.path === "/friends" ? hasRequests : (item.path === "/chat" ? unreadCount > 0 : false);
            const badgeValue = item.path === "/friends" ? incomingRequestsCount : unreadCount;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={isSidebarCollapsed ? item.label : undefined}
                className={({ isActive }) => cn(
                  "flex items-center rounded-lg py-3 transition-all duration-300 overflow-hidden",
                  isActive 
                    ? "bg-neon-blue/10 text-neon-blue shadow-[inset_0_0_10px_rgba(0,229,255,0.1)] border-r-2 border-neon-blue" 
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-100",
                  isSidebarCollapsed ? "justify-center px-0" : "gap-3 px-4 shadow-sm"
                )}
              >
                <div className="relative shrink-0">
                  <item.icon size={20} />
                  {hasBadge && isSidebarCollapsed && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-extrabold text-[8px] h-4 min-w-4 px-1 flex items-center justify-center rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                      {badgeValue}
                    </span>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <div className="flex items-center justify-between w-full min-w-0">
                    <span className="font-medium whitespace-nowrap truncate">{item.label}</span>
                    {hasBadge && (
                      <span className="bg-red-500 text-white font-black text-[10px] px-1.5 py-0.5 rounded-full animate-bounce shadow-[0_0_10px_rgba(239,68,68,0.5)] leading-none select-none">
                        +{badgeValue}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}

          {user?.role === "STREAMER" && (
            <NavLink
              to="/elite-dashboard"
              title={isSidebarCollapsed ? "داشبورد الیت" : undefined}
              className={({ isActive }) => cn(
                "flex items-center rounded-lg py-3 transition-all duration-300 overflow-hidden mt-4",
                isActive 
                  ? "bg-purple-500/10 text-purple-400 shadow-[inset_0_0_15px_rgba(168,85,247,0.2)] border-r-2 border-purple-500" 
                  : "text-purple-400/70 hover:bg-purple-500/5 hover:text-purple-300",
                isSidebarCollapsed ? "justify-center px-0" : "gap-3 px-4"
              )}
            >
              <Zap size={20} className="shrink-0 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]" />
              {!isSidebarCollapsed && <span className="font-bold whitespace-nowrap drop-shadow-[0_0_5px_rgba(168,85,247,0.3)]">داشبورد الیت</span>}
            </NavLink>
          )}
          
          {isElectron && (
            <NavLink
              to="/electron-settings"
              title={isSidebarCollapsed ? "تنظیمات ویندوز" : undefined}
              className={({ isActive }) => cn(
                "flex items-center rounded-lg py-3 transition-all duration-300 overflow-hidden",
                isActive 
                  ? "bg-neon-blue/10 text-neon-blue shadow-[inset_0_0_10px_rgba(0,229,255,0.1)] border-r-2 border-neon-blue" 
                  : "text-indigo-400/80 hover:bg-white/5 hover:text-indigo-400",
                isSidebarCollapsed ? "justify-center px-0" : "gap-3 px-4"
              )}
            >
              <Settings size={20} className="shrink-0" />
              {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">تنظیمات ویندوز</span>}
            </NavLink>
          )}
          
          {(user?.role === "ADMIN" || user?.email === "admin@loxx.ir" || user?.email === "admin@test.com") && (
            <>
              <NavLink
                to="/admin"
                title={isSidebarCollapsed ? "پنل مدیریت" : undefined}
                className={({ isActive }) => cn(
                  "flex items-center rounded-lg py-3 transition-all duration-300 overflow-hidden",
                  isActive 
                    ? "bg-neon-blue/10 text-neon-blue shadow-[inset_0_0_10px_rgba(0,229,255,0.1)] border-r-2 border-neon-blue" 
                    : "text-amber-400/80 hover:bg-white/5 hover:text-amber-400",
                  isSidebarCollapsed ? "justify-center px-0" : "gap-3 px-4"
                )}
              >
                <Shield size={20} className="shrink-0" />
                {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">پنل مدیریت</span>}
              </NavLink>

              <NavLink
                to="/email"
                title={isSidebarCollapsed ? "ایمیل سازمانی" : undefined}
                className={({ isActive }) => cn(
                  "flex items-center rounded-lg py-3 transition-all duration-300 overflow-hidden",
                  isActive 
                    ? "bg-neon-pink/10 text-neon-pink shadow-[inset_0_0_10px_rgba(255,0,153,0.1)] border-r-2 border-neon-pink" 
                    : "text-indigo-400/80 hover:bg-white/5 hover:text-indigo-300",
                  isSidebarCollapsed ? "justify-center px-0" : "gap-3 px-4"
                )}
              >
                <Mail size={20} className="shrink-0" />
                {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">ایمیل سازمانی</span>}
              </NavLink>
            </>
          )}
        </div>

        <div className="px-4">
          <button 
            onClick={logout}
            title={isSidebarCollapsed ? "خروج" : undefined}
            className={cn(
              "flex w-full items-center rounded-lg py-3 text-gray-400 hover:bg-neon-pink/10 hover:text-neon-pink transition-all overflow-hidden",
               isSidebarCollapsed ? "justify-center px-0" : "gap-3 px-4"
            )}
          >
            <LogOut size={20} className="shrink-0" />
            {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">خروج</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
