import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useLobby } from "../../context/LobbyContext";
import { 
  Users, 
  Activity, 
  X, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Monitor, 
  Maximize2,
  Tv,
  Wifi,
  Laptop
} from "lucide-react";
import { cn } from "../../lib/utils";

export const ActiveLobbyWidget = () => {
  const { 
    lobby, 
    leaveLobby, 
    setLobbyMuted, 
    isDeafened, 
    setIsDeafened, 
    isElectron, 
    transparentOverlayEnabled, 
    setTransparentOverlayEnabled, 
    peerPings 
  } = useLobby();
  const location = useLocation();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [simulatedPing, setSimulatedPing] = useState(21);

  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedPing(prev => {
        const change = Math.floor(Math.random() * 4) - 2;
        const next = prev + change;
        return next < 15 ? 15 : next > 30 ? 30 : next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Don't show if not in a lobby OR if already on the lobby room page
  if (!lobby || !lobby.id || location.pathname.startsWith("/lobby/")) {
    return null;
  }

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (lobby?.id) {
      navigator.clipboard.writeText(lobby.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statusColors: Record<string, string> = {
    WAITING: "from-amber-500/80 to-orange-600/80 text-amber-200 border-amber-500/30",
    READY: "from-emerald-500/80 to-green-600/80 text-emerald-200 border-emerald-500/30",
    STARTING: "from-pink-500 to-rose-600 text-pink-100 border-pink-500/30",
    IN_PROGRESS: "from-purple-500 to-indigo-600 text-purple-200 border-purple-500/30",
    FINISHED: "from-red-500 to-rose-800 text-red-200 border-red-500/30",
  };

  const statusFarsi: Record<string, string> = {
    WAITING: "در انتظار بازیکن",
    READY: "آماده شروع",
    STARTING: "در حال شروع...",
    IN_PROGRESS: "در حال بازی",
    FINISHED: "پایان بازی",
  };

  const activePing = peerPings && Object.keys(peerPings).length > 0
    ? Math.min(...(Object.values(peerPings) as number[]))
    : simulatedPing;

  const anyoneSpeaking = lobby.talkingUsers && lobby.talkingUsers.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        className="fixed bottom-[88px] md:bottom-6 right-4 md:right-6 z-[9999] pointer-events-auto"
        dir="rtl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative flex items-center gap-4 flex-row-reverse">
          {/* Main Breathing Capsule Orb */}
          <div 
            onClick={() => navigate(`/lobby/${lobby.id}`)}
            className={cn(
              "relative shrink-0 cursor-pointer transition-transform duration-300 hover:scale-105 z-20",
              anyoneSpeaking ? "animate-pulse" : ""
            )}
          >
            {/* Glow Backplate */}
            <div className={cn(
              "absolute inset-0 rounded-full blur-xl transition-all duration-700 opacity-60 scale-125",
              anyoneSpeaking ? "bg-emerald-500/30 blur-2xl" : "bg-neon-blue/20"
            )} />
            
            {/* Orbit animation lines */}
            <div className="absolute inset-0 rounded-full border border-dashed border-neon-blue/20 animate-[spin_16s_linear_infinite]" />

            <div className={cn(
              "h-16 w-16 rounded-full bg-slate-950/95 flex items-center justify-center relative overflow-hidden z-10 transition-all duration-500 border-2",
              anyoneSpeaking 
                ? "border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]" 
                : "border-neon-blue/40 hover:border-neon-blue shadow-[0_0_20px_rgba(0,229,255,0.25)]"
            )}>
              <div className="relative z-10 flex flex-col items-center justify-center">
                {lobby.status === "STARTING" && lobby.countdown ? (
                  <span className="text-lg font-black text-neon-pink">{lobby.countdown}</span>
                ) : anyoneSpeaking ? (
                  <Volume2 size={24} className="text-emerald-400 animate-[pulse_1s_infinite]" />
                ) : (
                  <Activity size={24} className="text-neon-blue animate-pulse" />
                )}
              </div>

              {/* Status Indicator */}
              <div className={cn(
                "absolute top-1.5 right-1.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 shadow-md",
                anyoneSpeaking 
                  ? "bg-emerald-400 animate-pulse" 
                  : lobby.status === "READY" 
                    ? "bg-green-500"
                    : lobby.status === "STARTING" 
                      ? "bg-neon-pink animate-pulse"
                      : "bg-cyan-500"
              )} />
            </div>
          </div>

          {/* Interactive Tactical Command Deck */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, x: 25 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.92, x: 25 }}
                transition={{ type: "spring", damping: 20, stiffness: 240 }}
                className="w-[330px] rounded-2xl bg-slate-950/85 backdrop-blur-3xl border border-neon-blue/30 shadow-[0_15px_45px_rgba(0,0,0,0.9)] overflow-hidden p-4 flex flex-col gap-3 relative"
              >
                {/* Header card info */}
                <div className="flex flex-col gap-1 relative z-10 border-b border-white/5 pb-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-black text-gray-500 uppercase tracking-widest">کپسول لابی فعال</span>
                    {isElectron ? (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#00e5ff]/10 text-[9px] font-bold text-neon-blue border border-[#00e5ff]/20">
                        <Laptop size={10} />
                        لوکس کلاینت (PC)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-black text-gray-400 border border-white/5">
                        نسخه وب
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <h4 className="text-white font-extrabold text-[15px] max-w-[170px] truncate leading-tight">
                      {lobby.gameTitle || "اتاق بازی گروهی"}
                    </h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-black border bg-gradient-to-r",
                      statusColors[lobby.status] || "from-gray-500 to-gray-700"
                    )}>
                      {statusFarsi[lobby.status] || lobby.status}
                    </span>
                  </div>

                  {/* Player fill bar */}
                  <div className="mt-2 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                      <span>ظرفیت لابی</span>
                      <span className="text-neon-blue">{lobby.players?.length || 1} / {lobby.maxPlayers || 8} نفر</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="bg-gradient-to-r from-neon-blue to-neon-purple h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (((lobby.players?.length || 1) / (lobby.maxPlayers || 8)) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Live Speaking Indicator */}
                <div className="flex flex-col gap-1 relative z-10 bg-white/5 p-2 rounded-xl border border-white/[0.04]">
                  {anyoneSpeaking ? (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold text-[#34d399]">در حال صحبت:</span>
                      {lobby.players
                        .filter(p => lobby.talkingUsers?.includes(p.userId))
                        .map(p => (
                          <span key={p.userId} className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px] font-bold animate-pulse">
                            {p.username}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-500"> آماده مکالمه صوتی... (Open Mic)</span>
                  )}
                </div>

                {/* PC Overlay Fast Toggle */}
                {isElectron && (
                  <div className="flex flex-col gap-2 relative z-10 border-t border-white/5 pt-2.5">
                    <div className="flex items-center justify-between text-[10px] font-black text-gray-400">
                      <span className="text-neon-pink">امکانات ویژه کلاینت</span>
                      <span className="text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">{activePing} ms</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setTransparentOverlayEnabled(!transparentOverlayEnabled);
                      }}
                      className={cn(
                        "w-full py-1.5 px-3 rounded-lg flex items-center justify-between text-[11px] font-extrabold transition-all border",
                        transparentOverlayEnabled 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                          : "bg-slate-900 border-white/5 text-gray-400"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <Monitor size={12} />
                        اورلی شفاف روی بازی
                      </span>
                      <span>
                        {transparentOverlayEnabled ? "فعال 🟢" : "غیرفعال 🔴"}
                      </span>
                    </button>
                  </div>
                )}

                {/* Quick Action Operations */}
                <div className="flex items-center justify-between gap-1.5 border-t border-white/5 pt-2.5 mt-1 relative z-10">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setLobbyMuted(!lobby.isMuted);
                      }}
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all border shrink-0",
                        lobby.isMuted ? "bg-red-500/10 text-red-100 border-red-500/20" : "bg-slate-900 border-white/5 text-gray-300"
                      )}
                    >
                      {lobby.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setIsDeafened(!isDeafened);
                      }}
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all border shrink-0",
                        isDeafened ? "bg-amber-500/10 text-amber-100 border-amber-500/20" : "bg-slate-900 border-white/5 text-gray-300"
                      )}
                    >
                      {isDeafened ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>

                    <button
                      onClick={handleCopyCode}
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all border shrink-0",
                        copied ? "bg-green-500/10 text-green-100 border-green-500/20" : "bg-slate-900 border-white/5 text-gray-300"
                      )}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        navigate(`/lobby/${lobby.id}`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-neon-blue text-slate-950 font-black hover:bg-cyan-300 transition-all flex items-center gap-1"
                    >
                      <Maximize2 size={11} />
                      <span>اتاق لابی</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        leaveLobby();
                      }}
                      className="h-8 w-8 rounded-lg bg-slate-900 border border-white/5 text-gray-400 hover:text-white hover:bg-red-500 flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
