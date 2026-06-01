import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLobby } from "../../context/LobbyContext";
import { useLanguage } from "../../context/LanguageContext";
import { toast } from "react-hot-toast";
import { 
  Users, 
  Mic, 
  MicOff, 
  Volume2,
  VolumeX,
  LogOut, 
  Copy, 
  Check, 
  Maximize2,
  Globe,
  Radio,
  Gamepad2
} from "lucide-react";
import { cn } from "../../lib/utils";

export const ActiveLobbyWidget = () => {
  const { lobby, leaveLobby, setLobbyMuted, isDeafened, setIsDeafened } = useLobby();
  const { language } = useLanguage();
  const isRtl = language === "fa";
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    // Loop pulsing scale for the live communication beacon
    const interval = setInterval(() => {
      setPulseScale(prev => (prev === 1 ? 1.08 : 1));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Don't show if not in a lobby OR if already on the lobby room page itself
  if (!lobby || !lobby.id || location.pathname.startsWith("/lobby/")) {
    return null;
  }

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lobby?.id) {
       navigator.clipboard.writeText(lobby.id);
       setCopied(true);
       setTimeout(() => setCopied(false), 2000);
       toast.success(isRtl ? "کد لابی با موفقیت کپی شد!" : "Lobby code copied to clipboard!");
    }
  };

  const statusColors: Record<string, string> = {
    WAITING: "from-amber-400 to-orange-500 shadow-amber-500/20 text-amber-400",
    READY: "from-emerald-400 to-teal-500 shadow-emerald-500/20 text-emerald-400",
    STARTING: "from-fuchsia-500 to-purple-600 shadow-fuchsia-500/20 text-fuchsia-400",
    IN_PROGRESS: "from-cyan-400 to-blue-500 shadow-cyan-500/20 text-cyan-400",
    FINISHED: "from-rose-500 to-red-600 shadow-red-500/20 text-rose-400",
  };

  const statusTexts: Record<string, string> = {
    WAITING: isRtl ? "در انتظار بازیکن" : "WAITING PLAYERS",
    READY: isRtl ? "هم‌تیمی‌ها آماده" : "TEAMMATES READY",
    STARTING: isRtl ? "در حال شروع..." : "STARTING MATCH...",
    IN_PROGRESS: isRtl ? "در حال بازی" : "MATCH IN PROGRESS",
    FINISHED: isRtl ? "پایان رقابت" : "MATCH ENDED",
  };

  return (
    <motion.div
      initial={{ y: -30, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -30, opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", damping: 20, stiffness: 160 }}
      className="fixed top-14 right-4 z-[99999] pointer-events-auto"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div 
        onClick={() => navigate(`/lobby/${lobby.id}`)}
        className="group relative flex items-center gap-3.5 pl-2 pr-4 py-2 rounded-2xl bg-[#080d19]/90 hover:bg-[#0b1326] border border-white/5 hover:border-cyan-400/30 shadow-[0_16px_50px_rgba(0,0,0,0.92)] duration-300 backdrop-blur-xl cursor-pointer"
      >
        {/* Animated dynamic pulse/glow background effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-purple-500/5 to-pink-500/10 opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        {/* High-end decorative light ray border shine */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[1px] pointer-events-none" />

        {/* Pulsing Game state emblem */}
        <div className="relative shrink-0 select-none">
          <motion.div 
            animate={{ scale: pulseScale }}
            className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center text-white relative z-10 transition-transform duration-300 bg-gradient-to-b from-[#131b2f] to-[#040813] border border-white/10 shadow-[inner_0_1px_3px_rgba(255,255,255,0.05)]",
              lobby.status === "STARTING" && "border-fuchsia-500/40"
            )}
          >
            {lobby.status === "STARTING" ? (
              <span className="text-sm font-black font-sans text-fuchsia-400 animate-pulse">{lobby.countdown}</span>
            ) : (
              <Gamepad2 size={18} className="text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]" />
            )}
            
            {/* Live voice activity indicator / visual equalizer when unmuted */}
            {!lobby.isMuted && !isDeafened && (
              <div className="absolute -bottom-1 -right-1 flex gap-[2px] items-end bg-[#0c162e] border border-cyan-400/30 rounded-md px-1 py-0.5 h-3.5 shadow-md">
                <span className="w-[1.5px] h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-duration:0.6s]" />
                <span className="w-[1.5px] h-2.5 bg-cyan-400 rounded-full animate-bounce [animation-duration:0.8s]" />
                <span className="w-[1.5px] h-1 bg-cyan-400 rounded-full animate-bounce [animation-duration:0.5s]" />
              </div>
            )}
          </motion.div>
          {/* Outer state glow shadow radial anchor */}
          <div className={cn("absolute inset-0 rounded-xl blur-lg opacity-40 group-hover:opacity-75 transition-opacity duration-300 bg-gradient-to-r", statusColors[lobby.status] || "from-gray-500 to-gray-600")} />
        </div>

        {/* Lobby Details Area */}
        <div className="flex flex-col select-none relative z-10 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-white/95 uppercase font-sans tracking-wide">
              {lobby.gameTitle || "Lobby"}
            </span>
            <span className="text-[8px] tracking-wider leading-none font-black text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 rounded-[4px]">
              {isRtl ? "پارتی" : "LIVE PARTY"}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 mt-0.5" dir={isRtl ? "rtl" : "ltr"}>
            <div className="flex items-center gap-0.5 text-[9.5px] font-extrabold text-white/70">
              <Users size={9} className="text-gray-400" />
              <span>
                {lobby.players?.length || 1}/{lobby.maxPlayers || 3}
              </span>
            </div>
            <span className="h-1 w-1 bg-white/10 rounded-full" />
            <span className={cn(
              "text-[9px] font-extrabold bg-gradient-to-r bg-clip-text text-transparent tracking-tight font-sans",
              statusColors[lobby.status] || "from-gray-400 to-gray-500"
            )}>
              {statusTexts[lobby.status] || lobby.status}
            </span>
          </div>
        </div>

        {/* Vertical Actions Partition */}
        <div className="flex items-center gap-1 pl-2.5 border-l border-white/5 relative z-10">
          
          {/* Action: Mic Toggle */}
          <QuickActionIcon 
            icon={lobby.isMuted ? <MicOff size={13} className="text-rose-400" /> : <Mic size={13} className="text-[#a5b4fc]" />} 
            onClick={(e) => {
              e.stopPropagation();
              setLobbyMuted(!lobby.isMuted);
              toast.dismiss();
              toast.success(
                lobby.isMuted 
                  ? (isRtl ? "🎙️ میکروفون لابی فعال شد." : "🎙️ Microphone active.")
                  : (isRtl ? "🔇 میکروفون شما صامت شد." : "🔇 Microphone muted.")
              );
            }}
            title={isRtl ? "روشن / خاموش میکروفون" : "Mute / Unmute Mic"}
          />

          {/* Action: Voice Deafen Toggle */}
          <QuickActionIcon 
            icon={isDeafened ? <VolumeX size={13} className="text-rose-400 animate-pulse" /> : <Volume2 size={13} className="text-[#a5b4fc]" />} 
            onClick={(e) => {
              e.stopPropagation();
              setIsDeafened(!isDeafened);
              toast.dismiss();
              toast.success(
                !isDeafened 
                  ? (isRtl ? "🔇 صدای هم‌تیمی‌ها قطع شد." : "🔇 Teammates voices deafened.") 
                  : (isRtl ? "🔊 صدای هم‌تیمی‌ها وصل شد." : "🔊 Teammates voices restored.")
              );
            }}
            title={isRtl ? "قطع / وصل صدای هم‌تیمی‌ها" : "Deafen / Restoration"}
          />

          {/* Action: Copy Code ID */}
          <QuickActionIcon 
            icon={copied ? <Check size={13} className="text-emerald-400 scale-110" /> : <Copy size={13} className="text-gray-400" />} 
            onClick={handleCopyCode}
            title={isRtl ? "کپی کد لابی" : "Copy Lobby Code ID"}
          />

          {/* Action: Leave active Lobby with alert feedback */}
          <QuickActionIcon 
            icon={<LogOut size={13} />} 
            danger 
            onClick={(e) => {
              e.stopPropagation();
              leaveLobby();
              toast.dismiss();
              toast.success(isRtl ? "🚪 از لابی با موفقیت خارج شدید." : "🚪 Successfully left the active lobby room.");
            }}
            title={isRtl ? "خروج از لابی" : "Leave active lobby"}
          />

          {/* Maximise / Enter page visual anchor indicator */}
          <div className="h-7 w-7 rounded-lg bg-cyan-400/5 hover:bg-cyan-400 hover:text-dark-bg text-cyan-400 flex items-center justify-center transition-all duration-300 shrink-0 ml-0.5 border border-cyan-400/10 shadow-[0_0_10px_rgba(6,182,212,0.05)]">
             <Maximize2 size={12} className="group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface QuickActionProps {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
  title?: string;
}

const QuickActionIcon = ({ icon, onClick, danger = false, title }: QuickActionProps) => (
  <button 
    onClick={onClick}
    title={title}
    className={cn(
      "h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-200 outline-none select-none border shrink-0",
      danger 
        ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border-rose-500/20 hover:border-transparent shadow-sm hover:shadow-rose-500/10" 
        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border-white/5 hover:border-white/10 shadow-sm"
    )}
  >
    {icon}
  </button>
);
