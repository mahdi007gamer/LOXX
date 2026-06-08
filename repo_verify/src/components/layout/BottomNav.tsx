import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Gamepad2, Trophy } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useGames } from '../../context/GamesContext';
import { useLanguage } from '../../context/LanguageContext';

export const BottomNav = () => {
 const { user } = useAuth();
 const { myGames } = useGames();
 const { t } = useLanguage();
 const [channelsUnread, setChannelsUnread] = React.useState(0);

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
 
 // Custom trigger hook
 window.addEventListener("storage", calcUnreads);
 window.addEventListener("loxx-chat-unread-update", calcUnreads);
 return () => {
 window.removeEventListener("storage", calcUnreads);
 window.removeEventListener("loxx-chat-unread-update", calcUnreads);
 };
 }, [user?.id, myGames]);

 const menuItems = [
 { icon: LayoutDashboard, label: t("dashboard"), path: "/dashboard" },
 { icon: Gamepad2, label: t("games"), path: "/games" },
 { icon: MessageSquare, label: t("globalChat"), path: "/chat", isSpecial: true },
 { icon: Users, label: t("lobbies"), path: "/lobbies" },
 { icon: Trophy, label: t("rankings"), path: "/ranking" },
 ];

 return (
 <div className="fixed bottom-0 left-0 right-0 z-[5000] bg-dark-bg/80 border-t border-white/10 md:hidden h-16 overflow-visible">
 <div className="flex items-center justify-around h-full px-1 overflow-visible">
 {menuItems.map((item) => (
 <NavLink
 key={item.path}
 to={item.path}
 className={({ isActive }) => cn(
 "flex flex-col items-center justify-center gap-1 transition-all duration-300 h-full relative",
 item.isSpecial 
 ? cn(
 "w-14 h-14 rounded-full transition-all duration-500 z-20 flex-shrink-0",
 isActive 
 ? "bg-neon-blue -mt-10 shadow-[0_0_30px_rgba(0,229,255,0.6)] scale-110 text-dark-bg" 
 : "bg-[#0a0a0f] -mt-4 opacity-50 scale-95 translate-y-1 text-gray-500"
 ) 
 : "flex-1 min-w-0 font-black",
 isActive && !item.isSpecial
 ? "text-neon-blue drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]" 
 : !item.isSpecial ? "text-gray-500 hover:text-white" : ""
 )}
 >
 {({ isActive }) => (
 <>
 <div className={cn(
 "flex flex-col items-center justify-center gap-0.5 relative",
 item.isSpecial && (isActive ? "translate-y-[-1px]" : "translate-y-[1px]")
 )}>
 <item.icon size={item.isSpecial ? (isActive ? 22 : 18) : 18} />
 {item.path === "/chat" && channelsUnread > 0 && (
 <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-extrabold text-[8px] h-4 min-w-4 px-1 flex items-center justify-center rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]">
 {channelsUnread}
 </span>
 )}
 <span className={cn(
 "text-[8px] font-black whitespace-nowrap",
 item.isSpecial && "mt-[-2px]"
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
