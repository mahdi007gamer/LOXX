import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLobby } from "../../context/LobbyContext";
import { 
 Users, 
 Mic, 
 MicOff, 
 LogOut, 
 Copy, 
 Check, 
 ExternalLink,
 ChevronRight,
 Maximize2
} from "lucide-react";
import { cn } from "../../lib/utils";

export const ActiveLobbyWidget = () => {
 const { lobby, leaveLobby, setLobbyMuted } = useLobby();
 const location = useLocation();
 const navigate = useNavigate();
 const [isExpanded, setIsExpanded] = useState(false);
 const [copied, setCopied] = useState(false);

 // Don't show if not in a lobby OR if already on the lobby room page
 if (!lobby || !lobby.id || location.pathname.startsWith("/lobby/")) {
 return null;
 }

 const handleCopyCode = (e: React.MouseEvent) => {
 e.stopPropagation();
 if (lobby?.id) {
 navigator.clipboard.writeText(lobby.id);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 }
 };

 const statusColors: Record<string, string> = {
 WAITING: "bg-yellow-500",
 READY: "bg-green-500",
 STARTING: "bg-purple-500",
 IN_PROGRESS: "bg-green-600",
 FINISHED: "bg-red-500",
 };

 const statusFarsi: Record<string, string> = {
 WAITING: "در انتظار بازیکن",
 READY: "همه آماده",
 STARTING: "در حال شروع...",
 IN_PROGRESS: "در حال بازی",
 FINISHED: "پایان بازی",
 };

 return (
 <motion.div
 initial={{ x: 100, opacity: 0 }}
 animate={{ x: 0, opacity: 1 }}
 exit={{ x: 100, opacity: 0 }}
 className="fixed bottom-[88px] md:bottom-6 right-4 md:right-6 z-[9999] pointer-events-auto"
 dir="rtl"
 >
 <motion.div
 onMouseEnter={() => setIsExpanded(true)}
 onMouseLeave={() => setIsExpanded(false)}
 onClick={() => navigate(`/lobby/${lobby.id}`)}
 className={cn(
 "cursor-pointer glass border border-white/10 rounded-full flex items-center transition-all duration-500 shadow-2xl overflow-hidden",
 isExpanded ? "p-2 pl-6" : "p-2"
 )}
 >
 {/* Status Indicator */}
 <div className="relative flex-shrink-0">
 <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white relative z-10", statusColors[lobby.status] || "bg-gray-500")}>
 {lobby.status === "STARTING" ? (
 <span className="text-xs font-black">{lobby.countdown}</span>
 ) : (
 <Users size={18} />
 )}
 </div>
 <div className={cn("absolute inset-0 rounded-full animate-ping opacity-20", statusColors[lobby.status] || "bg-gray-500")} />
 </div>

 <AnimatePresence>
 {isExpanded && (
 <motion.div
 initial={{ width: 0, opacity: 0 }}
 animate={{ width: "auto", opacity: 1 }}
 exit={{ width: 0, opacity: 0 }}
 className="px-4 flex items-center gap-6 whitespace-nowrap overflow-hidden"
 >
 <div className="flex flex-col">
 <div className="flex items-center gap-2">
 <img src="/logo.png" alt="LX" className="h-4 w-auto drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]" />
 <span className="text-[11px] font-black text-white">{lobby.gameTitle} | رقابتی</span>
 <span className={cn("h-1.5 w-1.5 rounded-full", statusColors[lobby.status] || "bg-gray-500")} />
 </div>
 <div className="flex items-center gap-2">
 <span className="text-[9px] font-black text-gray-400 uppercase ">{lobby.players.length} / {lobby.maxPlayers} نفر</span>
 <span className="text-[9px] font-bold text-neon-blue">{statusFarsi[lobby.status] || lobby.status}</span>
 </div>
 </div>

 <div className="flex items-center gap-2 border-r border-white/10 pr-4">
 <QuickActionIcon 
 icon={lobby.isMuted ? <MicOff size={14} /> : <Mic size={14} />} 
 onClick={(e) => {
 e.stopPropagation();
 setLobbyMuted(!lobby.isMuted);
 }}
 />
 <QuickActionIcon 
 icon={copied ? <Check size={14} /> : <Copy size={14} />} 
 onClick={handleCopyCode}
 />
 <QuickActionIcon 
 icon={<LogOut size={14} />} 
 danger 
 onClick={(e) => {
 e.stopPropagation();
 leaveLobby();
 }}
 />
 <div className="h-8 w-8 rounded-lg bg-neon-blue text-dark-bg flex items-center justify-center">
 <Maximize2 size={14} />
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 
 {!isExpanded && (
 <div className="absolute top-0 right-0 -translate-y-full mb-1">
 <div className="px-2 py-0.5 rounded-md bg-neon-blue text-[8px] font-black text-dark-bg uppercase">Live</div>
 </div>
 )}
 </motion.div>
 </motion.div>
 );
};

const QuickActionIcon = ({ icon, onClick, danger = false }: { icon: React.ReactNode, onClick: (e: React.MouseEvent) => void, danger?: boolean }) => (
 <button 
 onClick={onClick}
 className={cn(
 "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
 danger ? "bg-neon-pink/10 text-neon-pink hover:bg-neon-pink hover:text-white" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
 )}
 >
 {icon}
 </button>
);
