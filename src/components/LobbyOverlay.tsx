import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useLobby } from "../context/LobbyContext";
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
  Cpu, 
  Compass, 
  Maximize2,
  Tv,
  Wifi,
  ChevronRight,
  Sparkles,
  Laptop
} from "lucide-react";
import { cn } from "../lib/utils";

export const LobbyOverlay = () => {
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
  const [simulatedPing, setSimulatedPing] = useState(19);

  // Periodically fluctuate simulated ping for supreme responsiveness immersion
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedPing(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const next = prev + change;
        return next < 12 ? 12 : next > 32 ? 32 : next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Don't show if not in a lobby or already on the lobby room page
  if (!lobby || location.pathname.startsWith("/lobby/")) return null;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  // Determine actual lowest ping among voice peers if available, else use simulated high speed ping
  const activePing = peerPings && Object.keys(peerPings).length > 0
    ? Math.min(...(Object.values(peerPings) as number[]))
    : simulatedPing;

  // Track if any players are speaking
  const anyoneSpeaking = lobby.talkingUsers && lobby.talkingUsers.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, scale: 0.9, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 80, scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="fixed bottom-24 md:bottom-8 right-6 z-[9999] flex items-center justify-end select-none"
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
            {/* Holographic Glowing Radiator */}
            <div className={cn(
              "absolute inset-0 rounded-full blur-xl transition-all duration-700 opacity-60 scale-125",
              anyoneSpeaking 
                ? "bg-emerald-500/30 blur-2xl" 
                : lobby.status === "STARTING" 
                  ? "bg-rose-500/30 blur-2xl animate-[ping_2s_infinite]" 
                  : "bg-neon-blue/20"
            )} />
            
            {/* Spinning gradient tracks */}
            <div className="absolute inset-0 rounded-full border border-dashed border-neon-blue/20 animate-[spin_16s_linear_infinite]" />
            <div className="absolute inset-[3px] rounded-full border border-dashed border-neon-pink/15 animate-[spin_10s_linear_infinite_reverse]" />

            <div className={cn(
              "h-16 w-16 rounded-full bg-slate-950/90 flex items-center justify-center relative overflow-hidden z-10 transition-all duration-500",
              anyoneSpeaking 
                ? "border-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]" 
                : "border-2 border-neon-blue/40 hover:border-neon-blue shadow-[0_0_20px_rgba(0,229,255,0.25)]"
            )}>
              {/* Animated Equalizer bars overlay when speaking */}
              {anyoneSpeaking ? (
                <div className="flex items-end justify-center gap-0.5 h-6 w-8 absolute bottom-2.5 z-0 opacity-40">
                  <span className="h-3 w-0.5 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_delay-100]" />
                  <span className="h-5 w-0.5 bg-emerald-400 rounded-full animate-[bounce_0.9s_infinite_delay-200]" />
                  <span className="h-4 w-0.5 bg-emerald-400 rounded-full animate-[bounce_0.7s_infinite]" />
                  <span className="h-5.5 w-0.5 bg-emerald-400 rounded-full animate-[bounce_0.8s_infinite_delay-300]" />
                  <span className="h-3 w-0.5 bg-emerald-400 rounded-full animate-[bounce_0.5s_infinite_delay-150]" />
                </div>
              ) : null}

              {/* Central Dynamic Face/Icon Display */}
              <div className="relative z-10 flex flex-col items-center justify-center">
                {lobby.status === "STARTING" && lobby.countdown ? (
                  <span className="text-lg font-black text-neon-pink animate-[pulse_0.8s_infinite]">{lobby.countdown}</span>
                ) : anyoneSpeaking ? (
                  <Volume2 size={24} className="text-emerald-400 animate-[pulse_1s_infinite]" />
                ) : (
                  <Activity size={24} className="text-neon-blue animate-pulse" />
                )}
              </div>

              {/* Status indicator pip */}
              <div className={cn(
                "absolute top-1.5 right-1.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 shadow-md transition-all duration-500",
                anyoneSpeaking 
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" 
                  : lobby.status === "READY" 
                    ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                    : lobby.status === "STARTING" 
                      ? "bg-neon-pink shadow-[0_0_8px_rgba(255,0,153,0.8)]"
                      : "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
              )} />
            </div>

            {/* Float badge floating above */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 rounded-full bg-slate-950 border border-white/10 text-[8px] font-black tracking-widest text-[#00E5FF] uppercase flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00E5FF] animate-ping" />
              <span>{lobby.status === "IN_PROGRESS" ? "در بازی" : "صوت فعال"}</span>
            </div>
          </div>

          {/* Interactive Tactical Command Deck (Expands on Hover) */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, x: 25 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.92, x: 25 }}
                transition={{ type: "spring", damping: 20, stiffness: 240 }}
                className="w-[330px] rounded-2xl bg-slate-950/85 backdrop-blur-3xl border border-neon-blue/30 shadow-[0_15px_45px_rgba(0,0,0,0.9),0_0_30px_rgba(0,229,255,0.15)] overflow-hidden p-4 flex flex-col gap-3 relative"
              >
                {/* Cyberpunk ambient scanning glow decor */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
                  <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-[pulse_3s_infinite]" />
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF0099]/30 to-transparent animate-[pulse_2s_infinite]" />
                </div>

                {/* Header info */}
                <div className="flex flex-col gap-1 relative z-10 border-b border-white/5 pb-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-black text-gray-500 uppercase tracking-widest">کنترل لابی شناور</span>
                    
                    {/* Live Desktop Client badge or Web indicator */}
                    {isElectron ? (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#00e5ff]/10 text-[9px] font-bold text-neon-blue border border-[#00e5ff]/20">
                        <Laptop size={10} className="animate-pulse" />
                        لوکس کلاینت (PC)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-black text-gray-400 border border-white/5">
                        <Compass size={10} />
                        کلاینت تحت وب
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <h4 className="text-white font-extrabold text-[15px] max-w-[170px] truncate leading-tight">
                      {lobby.gameTitle || lobby.title || "اتاق بازی گروهی"}
                    </h4>

                    {/* Status Badge */}
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-black border bg-gradient-to-r shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                      statusColors[lobby.status] || "from-gray-500 to-gray-700 text-white"
                    )}>
                      {statusFarsi[lobby.status] || lobby.status}
                    </span>
                  </div>

                  {/* Player Capacity fill bar */}
                  <div className="mt-2 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                      <span>ظرفیت اتاق بازی</span>
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

                {/* Live Channel details & speaking state */}
                <div className="flex flex-col gap-1.5 relative z-10 bg-white/5 p-2 rounded-xl border border-white/[0.04]">
                  <span className="text-[10px] font-extrabold text-gray-400 block mb-1">وضعیت گفتگو صوتی</span>
                  
                  {anyoneSpeaking ? (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold text-[#34d399] ml-1">در حال صحبت:</span>
                      {lobby.players
                        .filter(p => lobby.talkingUsers?.includes(p.userId))
                        .map(p => (
                          <span 
                            key={p.userId} 
                            className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px] font-bold border border-emerald-400/20 shadow-[0_0_8px_rgba(52,211,153,0.15)] flex items-center gap-1 animate-pulse"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                            {p.username}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 px-1 py-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-cyan-400/40 animate-pulse" />
                        <span>سیستم صوتی آماده بکار</span>
                      </div>
                      <span className="text-[10px] font-black text-neon-blue tracking-wide uppercase">Open Mic</span>
                    </div>
                  )}
                </div>

                {/* PC/Desktop Client Premium Power-ups */}
                {isElectron ? (
                  <div className="flex flex-col gap-2 relative z-10 border-t border-white/5 pt-2.5 mt-0.5">
                    <div className="flex items-center justify-between text-[10px] font-black text-gray-400">
                      <div className="flex items-center gap-1 text-neon-pink">
                        <Tv size={12} />
                        <span>قابلیت‌های پیشرفته دسکتاپ</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        <Wifi size={10} className="animate-pulse" />
                        <span>{activePing} ms</span>
                      </div>
                    </div>

                    {/* Fast Overlay Interactive Switcher */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setTransparentOverlayEnabled(!transparentOverlayEnabled);
                      }}
                      className={cn(
                        "w-full py-1.5 px-3 rounded-lg flex items-center justify-between text-[11px] font-extrabold transition-all duration-300 border",
                        transparentOverlayEnabled 
                          ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400" 
                          : "bg-slate-900/60 hover:bg-slate-900 border-white/5 text-gray-400 hover:text-white"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <Monitor size={12} className={transparentOverlayEnabled ? "animate-pulse" : ""} />
                        اورلی شفاف روی بازی
                      </span>
                      <span className="text-[10px] uppercase tracking-wider">
                        {transparentOverlayEnabled ? "فعال 🟢" : "خاموس 🔴"}
                      </span>
                    </button>

                    <div className="flex items-center justify-between px-1 text-[9px] font-semibold text-gray-500">
                      <span>انتقال به بازی با کلیک میانبر دکمه</span>
                      <span>کلید صوتی پیش‌فرض: <strong className="text-neon-blue uppercase">V</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 text-[10px] text-gray-400 relative z-10 border-t border-white/5 pt-2 mt-0.5 bg-slate-950/40 p-2 rounded-lg">
                    <div className="flex items-center gap-1 font-bold text-amber-500">
                      <Sparkles size={11} />
                      <span>می‌خواهید اورلی روی بازی داشته باشید؟</span>
                    </div>
                    <p className="text-[9px] text-gray-500 leading-normal mt-0.5">
                      برای فعال‌سازی و کنترل اورلی شفاف بر روی بازی‌های تمام صفحه و کلید صوتی سراسری (PTT)، می‌توانید نسخه دسکتاپ را دانلود کنید.
                    </p>
                    <Link 
                      to="/download" 
                      className="text-neon-blue font-bold text-[10px] mt-1 hover:underline flex items-center gap-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      دانلود رایگان کلاینت ویندوز
                      <ChevronRight size={10} className="inline rotate-180" />
                    </Link>
                  </div>
                )}

                {/* Quick Control Bar Grid Button Row */}
                <div className="flex items-center justify-between gap-1.5 border-t border-white/5 pt-2.5 mt-1 relative z-10">
                  <div className="flex items-center gap-1 px-1">
                    {/* Mic Toggle Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setLobbyMuted(!lobby.isMuted);
                      }}
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all border shrink-0",
                        lobby.isMuted 
                          ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" 
                          : "bg-slate-900 border-white/5 text-gray-300 hover:text-white hover:border-neon-blue/40"
                      )}
                      title={lobby.isMuted ? "وصل کردن میکروفون" : "بی‌صدا کردن میکروفون"}
                    >
                      {lobby.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                    </button>

                    {/* Deafen Toggle Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setIsDeafened(!isDeafened);
                      }}
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all border shrink-0",
                        isDeafened 
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20" 
                          : "bg-slate-900 border-white/5 text-gray-300 hover:text-white hover:border-neon-blue/40"
                      )}
                      title={isDeafened ? "باز کردن صدای خروجی" : "بستن کل صداها (Deafen)"}
                    >
                      {isDeafened ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>

                    {/* Copy Code button */}
                    <button
                      onClick={handleCopyCode}
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all border shrink-0",
                        copied 
                          ? "bg-green-500/10 text-green-400 border-green-500/20" 
                          : "bg-slate-900 border-white/5 text-gray-300 hover:text-white hover:border-neon-blue/40"
                      )}
                      title="کپی لینک دعوت لابی"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Large Call-To-Action buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* Enter Lobby Page */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        navigate(`/lobby/${lobby.id}`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-neon-blue text-slate-950 font-black text-[11px] hover:bg-cyan-300 hover:shadow-[0_0_12px_rgba(0,163,255,0.4)] transition-all flex items-center gap-1 active:scale-95 shrink-0"
                    >
                      <Maximize2 size={11} />
                      <span>ورود به اتاق</span>
                    </button>

                    {/* Rapid Exit button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        leaveLobby();
                      }}
                      className="h-8 w-8 rounded-lg bg-slate-900 border border-white/5 text-gray-400 hover:text-white hover:bg-red-500/80 hover:border-red-500/40 transition-all flex items-center justify-center shrink-0"
                      title="خروج سریع از گروه"
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
