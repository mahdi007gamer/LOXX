import React, { useState } from "react";
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
  Lock,
  Unlock
} from "lucide-react";
import { cn } from "../../lib/utils";

export const ActiveLobbyWidget = () => {
  const { lobby, leaveLobby, setLobbyMuted, isDeafened, setIsDeafened } = useLobby();
  const { language } = useLanguage();
  const isRtl = language === "fa";
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

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
    }
  };

  const statusColors: Record<string, string> = {
    WAITING: "bg-amber-500 shadow-amber-500/30",
    READY: "bg-emerald-500 shadow-emerald-500/30",
    STARTING: "bg-purple-500 shadow-purple-500/30",
    IN_PROGRESS: "bg-blue-500 shadow-blue-500/30",
    FINISHED: "bg-rose-500 shadow-rose-500/30",
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
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      transition={{ type: "spring", damping: 22, stiffness: 180 }}
      // Float beneath the primary titlebar (which takes top-9) at top-14 safely away from bottom navs/chat boxes
      className="fixed top-12 md:top-14 right-4 z-[99999] pointer-events-auto"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div 
        onClick={() => navigate(`/lobby/${lobby.id}`)}
        className="group relative flex items-center gap-4 pl-1.5 pr-4 py-1.5 md:py-2 rounded-2xl bg-[#080b11]/90 hover:bg-[#0c101a] border border-white/5 hover:border-[#00e5ff]/35 shadow-[0_12px_44px_rgba(0,0,0,0.85)] hover:shadow-[0_0_30px_rgba(0,229,255,0.15)] transition-all duration-300 backdrop-blur-xl cursor-pointer"
      >
        {/* Subtle holographic border shine feedback */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-neon-pink/10 to-neon-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Pulsing Game / Status Badge */}
        <div className="relative shrink-0 select-none">
          <div className={cn("h-10 w-10 md:h-11 md:w-11 rounded-xl flex items-center justify-center text-white relative z-10 transition-transform group-hover:scale-105 duration-300 bg-gradient-to-b from-[#111827] to-[#030712] border border-white/10")}>
            {lobby.status === "STARTING" ? (
              <span className="text-sm font-black font-sans text-purple-400">{lobby.countdown}</span>
            ) : (
              <Users size={18} className="text-[#00e5ff] drop-shadow-[0_0_4px_rgba(0,229,255,0.4)]" />
            )}
            
            {/* Status light dot */}
            <span className={cn("absolute -top-1 -right-1 h-3 w-3 rounded-full border border-[#080b11] shadow-lg animate-pulse", statusColors[lobby.status] || "bg-gray-500")} />
          </div>
          <div className={cn("absolute inset-0 rounded-xl blur-md opacity-30 group-hover:opacity-60 transition-opacity duration-300", statusColors[lobby.status] || "bg-gray-500")} />
        </div>

        {/* Lobby Details Texts */}
        <div className="flex flex-col select-none relative z-10 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10.5px] font-black text-white/95 uppercase font-sans tracking-wide">
              {lobby.gameTitle || "Lobby"}
            </span>
            <span className="text-[9px] bg-white/5 text-gray-400 font-extrabold px-1.5 py-0.2 rounded border border-white/5">
              {isRtl ? "پارتی" : "PARTY"}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5" dir={isRtl ? "rtl" : "ltr"}>
            <span className="text-[10px] font-bold text-gray-400">
              {lobby.players?.length || 1} / {lobby.maxPlayers || 3} {isRtl ? "نفر" : "players"}
            </span>
            <span className="h-1 w-1 bg-white/15 rounded-full" />
            <span className="text-[9.5px] font-extrabold text-[#00e5ff] tracking-tight uppercase font-sans">
              {statusTexts[lobby.status] || lobby.status}
            </span>
          </div>
        </div>

        {/* Actions Partition Row */}
        <div className="flex items-center gap-1.5 pl-3 border-l border-white/10 relative z-10">
          {/* Action 1: Toggle mute personal microphone */}
          <QuickActionIcon 
            icon={lobby.isMuted ? <MicOff size={14} className="text-rose-400" /> : <Mic size={14} className="text-emerald-400" />} 
            onClick={(e) => {
              e.stopPropagation();
              setLobbyMuted(!lobby.isMuted);
              toast.success(
                lobby.isMuted 
                  ? (isRtl ? "میکروفون فعال شد." : "Microphone unmuted.") 
                  : (isRtl ? "میکروفون شما صامت شد." : "Microphone muted.")
              );
            }}
            title={isRtl ? "روشن/خاموش میکروفون خودمان" : "Mute/Unmute microphone"}
          />

          {/* Action 2: Toggle mute/deafen others */}
          <QuickActionIcon 
            icon={isDeafened ? <VolumeX size={14} className="text-rose-400" /> : <Volume2 size={14} className="text-[#00e5ff]" />} 
            onClick={(e) => {
              e.stopPropagation();
              setIsDeafened(!isDeafened);
              toast.success(
                !isDeafened 
                  ? (isRtl ? "صدای لابی برای شما قطع شد." : "Lobby teammates muted.") 
                  : (isRtl ? "صدای لابی وصل شد." : "Lobby teammates voice restored.")
              );
            }}
            title={isRtl ? "قطع/وصل صدای بقیه " : "Deafen/Deafen voices of others"}
          />

          {/* Action 3: Copy Lobby Room ID */}
          <QuickActionIcon 
            icon={copied ? <Check size={14} className="text-emerald-400 animate-scale-up" /> : <Copy size={14} className="text-gray-400" />} 
            onClick={handleCopyCode}
            title={isRtl ? "کپی کردن کد لابی" : "Copy Lobby Code ID"}
          />

          {/* Action 4: Exit Lobby */}
          <QuickActionIcon 
            icon={<LogOut size={14} />} 
            danger 
            onClick={(e) => {
              e.stopPropagation();
              leaveLobby();
              toast.success(isRtl ? "از لابی خارج شدید." : "Left lobby room successfully.");
            }}
            title={isRtl ? "خروج از لابی" : "Leave active lobby"}
          />

          {/* Maximise Overlay Hover Badge */}
          <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-[#00e5ff]/5 border border-[#00e5ff]/20 hover:bg-[#00e5ff] hover:text-dark-bg text-[#00e5ff] flex items-center justify-center transition-all duration-300">
             <Maximize2 size={13} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const QuickActionIcon = ({ icon, onClick, danger = false, title }: { icon: React.ReactNode, onClick: (e: React.MouseEvent) => void, danger?: boolean, title?: string }) => (
  <button 
    onClick={onClick}
    title={title}
    className={cn(
      "h-7 w-7 md:h-8 md:w-8 rounded-lg flex items-center justify-center transition-all duration-200 outline-none select-none",
      danger 
        ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white" 
        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/10"
    )}
  >
    {icon}
  </button>
);
