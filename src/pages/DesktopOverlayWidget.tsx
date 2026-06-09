import React, { useEffect, useState } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FriendChatOverlay } from "../components/ui/FriendChatOverlay";

// We'll still need some UI values from useLobby if it syncs via IPC or LocalStorage (for example posStr), 
// but the actual players data in this Electron window comes from the main window via IPC for absolute reliability.
import { useLobby } from "../context/LobbyContext";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";

interface OverlayPlayer {
 userId: string;
 username: string;
 avatarUrl?: string;
 isSpeaking: boolean;
 isMuted: boolean;
}

export const DesktopOverlayWidget = () => {
 const [players, setPlayers] = useState<OverlayPlayer[]>([]);
 const [isOverlayInteractive, setIsOverlayInteractive] = useState(false);

 const { 
 overlayPosition, 
 overlaySize, 
 overlayOnlyTalking,
 overlayMembersVisible,
 overlayNormalOpacity,
 overlaySpeakingOpacity
 } = useLobby();
 const { user } = useAuth();
 
 const currentUserId = user?.id;

 // We read the local storage directly if the context initially misses it since it's a separate window
 const storedPos = localStorage.getItem("loxx_overlay_position") || "top-left";
 const storedSize = localStorage.getItem("loxx_overlay_size") || "medium";
 const storedMembersVisible = localStorage.getItem("loxx_overlay_members_visible") !== "false";
 const storedNormalOpacity = localStorage.getItem("loxx_overlay_normal_opacity") !== null 
 ? parseFloat(localStorage.getItem("loxx_overlay_normal_opacity")!) 
 : 0.75;
 const storedSpeakingOpacity = localStorage.getItem("loxx_overlay_speaking_opacity") !== null 
 ? parseFloat(localStorage.getItem("loxx_overlay_speaking_opacity")!) 
 : 1.0;

 const posStr = overlayPosition || storedPos;
 const sizeStr = overlaySize || storedSize;
 const membersVisibleVal = overlayMembersVisible !== undefined ? overlayMembersVisible : storedMembersVisible;
 const normalOpacityVal = overlayNormalOpacity !== undefined ? overlayNormalOpacity : storedNormalOpacity;
 const speakingOpacityVal = overlaySpeakingOpacity !== undefined ? overlaySpeakingOpacity : storedSpeakingOpacity;
 
 const positionClasses = {
 "top-left": "top-6 left-6 items-start text-left",
 "top-right": "top-6 right-6 items-end text-right",
 "bottom-left": "bottom-6 left-6 items-start text-left",
 "bottom-right": "bottom-6 right-6 items-end text-right"
 }[posStr as string] || "top-6 left-6 items-start text-left";

 const avatarSizes = {
 "small": "h-8 w-8 text-xs",
 "medium": "h-11 w-11 text-sm",
 "large": "h-14 w-14 text-base"
 }[sizeStr as string] || "h-11 w-11 text-sm";

 const nameSizes = {
 "small": "text-[11px]",
 "medium": "text-xs",
 "large": "text-sm"
 }[sizeStr as string] || "text-xs";

 useEffect(() => {
 // Elegant system-tray or background HUD layout settings
 document.documentElement.style.background = "transparent";
 document.documentElement.style.backgroundColor = "transparent";
 document.body.style.background = "transparent";
 document.body.style.backgroundColor = "transparent";
 const rootEl = document.getElementById('root');
 if (rootEl) {
 rootEl.style.background = "transparent";
 rootEl.style.backgroundColor = "transparent";
 }

 const api = (window as any).electronAPI;
 let unsubscribePlayers: any = null;
 let unsubscribeInteractive: any = null;
 
 if (api) {
 if (api.getOverlayPlayers) {
 api.getOverlayPlayers().then((initialPlayers: OverlayPlayer[]) => {
 if (initialPlayers && Array.isArray(initialPlayers)) {
 setPlayers(initialPlayers);
 }
 });
 }

 if (api.onOverlayPlayersUpdate) {
 unsubscribePlayers = api.onOverlayPlayersUpdate((updatedPlayers: OverlayPlayer[]) => {
 setPlayers(updatedPlayers || []);
 });
 }

 if (api.onOverlayInteractionMode) {
 unsubscribeInteractive = api.onOverlayInteractionMode((interactive: boolean) => {
 setIsOverlayInteractive(interactive);
 });
 }
 }

 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.altKey && e.key === "F1") {
 e.preventDefault();
 // If running in Electron, the globalShortcut handles it.
 // We only toggle locally when running in a standard web browser.
 const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
 if (!isElectron) {
 setIsOverlayInteractive(prev => !prev);
 }
 }
 };

 window.addEventListener("keydown", handleKeyDown);

 return () => {
 if (unsubscribePlayers) unsubscribePlayers();
 if (unsubscribeInteractive) unsubscribeInteractive();
 window.removeEventListener("keydown", handleKeyDown);
 };
 }, []);

 return (
 <>
 {/* Full blurred backdrop when interactive / focused */}
 <AnimatePresence>
 {isOverlayInteractive && (
 <motion.div
 id="OverlayBackdrop"
 key="overlay-widget-backdrop"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.2, ease: "easeInOut" }}
 style={{ 
 width: "100vw", 
 height: "100vh", 
 background: "rgba(0, 0, 0, 0.4)", 
 backdropFilter: "blur(5px)",
 WebkitBackdropFilter: "blur(5px)",
 zIndex: 8000 
 }}
 className="fixed inset-0 pointer-events-auto select-none border-2 border-neon-blue/20"
 />
 )}
 </AnimatePresence>

 <div className={cn("fixed z-[9999] flex flex-col pointer-events-none select-none", positionClasses)}>
 {/* Title tag - minimal, matches Discord Overlay appearance */}
 {membersVisibleVal && players && players.length > 0 && (
 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 border border-white/5 mb-2 shadow-lg shadow-black/30 w-fit">
 <span className="h-2 w-2 rounded-full bg-[#22c55e] animate-ping" />
 <span className="text-[10px] font-black text-white uppercase font-sans">LOXX LOBBY</span>
 <span className="text-[9px] text-gray-400 font-mono">({players.length})</span>
 </div>
 )}

 <div className={cn("flex flex-col gap-3", posStr.includes("right") ? "items-end" : "items-start")}>
 <AnimatePresence>
 {membersVisibleVal && players?.map((player) => {
 const isMe = player.userId === currentUserId;
 
 // Speech detection comes strictly from IPC now, avoiding context reliance
 const isTalking = player.isSpeaking;
 const isMuted = player.isMuted;

 // If "show only talking" is enabled and player is silent, skip rendering
 // For now let's just make it always visible if overlayOnlyTalking is true it only shows when talking
 if (overlayOnlyTalking && !isTalking && !isMe) {
 return null;
 }

 return (
 <motion.div
 key={player.userId}
 initial={{ opacity: 0, x: posStr.includes("left") ? -30 : 30, scale: 0.9 }}
 animate={{ opacity: isTalking ? speakingOpacityVal : normalOpacityVal, x: 0, scale: 1 }}
 exit={{ opacity: 0, scale: 0.9 }}
 transition={{ type: "spring", damping: 20, stiffness: 200 }}
 className={cn("flex items-center gap-2.5", posStr.includes("right") ? "flex-row-reverse" : "flex-row")}
 dir="ltr"
 >
 {/* Profile Avatar / speaking glowing bubble */}
 <div className="relative shrink-0">
 <div 
 className={cn(
 "rounded-full bg-[#151921] border border-white/10 flex items-center justify-center relative overflow-hidden transition-all duration-150 shadow-md",
 avatarSizes
 )}
 style={
 isTalking && !isMuted
 ? { 
 boxShadow: "0 0 0 3px #22c55e, 0 0 16px rgba(34,197,94,0.6)", 
 borderColor: "#22c55e",
 transform: "scale(1.05)"
 }
 : {}
 }
 >
 {player.avatarUrl ? (
 <img 
 src={player.avatarUrl} 
 className="h-full w-full object-cover select-none" 
 alt="" 
 referrerPolicy="no-referrer"
 />
 ) : (
 <span className="font-bold text-white uppercase">
 {(player.username || "Guest").substring(0, 2)}
 </span>
 )}
 </div>

 {/* Status indicator badges */}
 <div className="absolute -bottom-0.5 -right-0.5 flex gap-0.5">
 {isMuted ? (
 <div className="bg-red-500 rounded-full p-0.5 border border-black shadow-[0_0_5px_rgba(239,68,68,0.5)]">
 <MicOff size={8} className="text-white" />
 </div>
 ) : isTalking ? (
 <div className="bg-[#22c55e] rounded-full p-0.5 border border-black animate-bounce">
 <Volume2 size={8} className="text-white" />
 </div>
 ) : null}
 </div>
 </div>

 {/* Player Name Tag with speak indicators */}
 <div 
 className={cn(
  "px-3 py-1 rounded-lg transition-all duration-150 border w-[130px]",
 isTalking 
 ? "bg-[#22c55e]/15 border-[#22c55e]/30 text-white font-black shadow-[0_0_10px_rgba(34,197,94,0.1)]" 
 : "bg-[#10141a]/85 border-white/5 text-gray-300 font-bold",
 nameSizes
 )}
 >
 <div className="flex items-center gap-1.5 flex-row">
 <span className="font-sans truncate flex-1">
 {player.username ? (player.username.length > 10 ? player.username.substring(0, 10) + "..." : player.username) : "بازیکن"}
 </span>
 {isMe && <span className="text-[8px] bg-white/10 text-white/70 px-1 py-0.2 rounded font-sans scale-90">Me</span>}
 </div>
 </div>
 </motion.div>
 );
 })}
 </AnimatePresence>
 </div>
 </div>
 </>
 );
};


