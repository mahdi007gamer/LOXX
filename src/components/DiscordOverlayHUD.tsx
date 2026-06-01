import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation } from "react-router-dom";
import { useLobby } from "../context/LobbyContext";
import { useAuth } from "../context/AuthContext";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { cn } from "../lib/utils";

export const DiscordOverlayHUD = () => {
  const { 
    lobby, 
    overlayEnabled, 
    overlayPosition, 
    overlaySize, 
    overlayOnlyTalking, 
    peerVolumes, 
    localVolume,
    isElectron,
    overlayNormalOpacity,
    overlaySpeakingOpacity
  } = useLobby();
  const { user } = useAuth();
  const location = useLocation();

  const isLobbyPage = location.pathname.startsWith("/lobby/");

  // Sync real-time FPS calculation loop
  const [overlayFps, setOverlayFps] = useState(60);
  const [showOverlayFps, setShowOverlayFps] = useState(() => localStorage.getItem("loxx_show_overlay_fps") !== "false");

  useEffect(() => {
    const handleStorage = () => {
      setShowOverlayFps(localStorage.getItem("loxx_show_overlay_fps") !== "false");
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("loxx_overlay_fps_update", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("loxx_overlay_fps_update", handleStorage);
    };
  }, []);

  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;
    let animId: number;
    const update = (time: number) => {
      frames++;
      const now = time || performance.now();
      if (now >= lastTime + 1000) {
        setOverlayFps(Math.round((frames * 1000) / (now - lastTime)));
        frames = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, []);

  // If overlay is disabled or user is not in any lobby, do not render HUD
  if (!overlayEnabled || !lobby) return null;
  if (isElectron) return null;
  if (isLobbyPage) return null;

  const currentUserId = user?.id;

  const normalOpacityVal = overlayNormalOpacity !== undefined ? overlayNormalOpacity : 0.75;
  const speakingOpacityVal = overlaySpeakingOpacity !== undefined ? overlaySpeakingOpacity : 1.0;

  // Determine positions classes
  const positionClasses = {
    "top-left": "top-6 left-6 items-start text-left",
    "top-right": "top-6 right-6 items-end text-right",
    "bottom-left": "bottom-6 left-6 items-start text-left",
    "bottom-right": "bottom-6 right-6 items-end text-right"
  }[overlayPosition || "top-left"];

  const getOppositePosition = (pos: string) => {
    if (pos.endsWith("-left")) return pos.replace("-left", "-right");
    if (pos.endsWith("-right")) return pos.replace("-right", "-left");
    return "top-right";
  };
  const fpsPosStr = getOppositePosition(overlayPosition || "top-left");
  const fpsPositionClasses = {
    "top-left": "top-6 left-6 items-start text-left",
    "top-right": "top-6 right-6 items-end text-right",
    "bottom-left": "bottom-6 left-6 items-start text-left",
    "bottom-right": "bottom-6 right-6 items-end text-right"
  }[fpsPosStr] || "top-6 right-6 items-end text-right";

  // Determine size classes
  const avatarSizes = {
    "small": "h-8 w-8 text-xs",
    "medium": "h-11 w-11 text-sm",
    "large": "h-14 w-14 text-base"
  }[overlaySize || "medium"];

  const nameSizes = {
    "small": "text-[11px]",
    "medium": "text-xs",
    "large": "text-sm"
  }[overlaySize || "medium"];

  return (
    <>
      <div className={cn("fixed z-[9999] flex flex-col pointer-events-none select-none", positionClasses)}>
        {/* Title tag - minimal, matches Discord Overlay appearance */}
        {lobby.players && lobby.players.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 border border-white/5 backdrop-blur-md mb-2 shadow-lg shadow-black/30 w-fit">
            <span className="h-2 w-2 rounded-full bg-[#22c55e] animate-ping" />
            <span className="text-[10px] font-black tracking-wider text-white uppercase font-sans">LOXX LOBBY</span>
            <span className="text-[9px] text-gray-400 font-mono">({lobby.players?.length || 0})</span>
          </div>
        )}

        <div className="flex flex-row flex-wrap gap-3 items-center">
          <AnimatePresence>
            {lobby.players?.map((player) => {
              const isMe = player.userId === currentUserId;
              
              // Speech detection
              const vol = isMe ? localVolume : (peerVolumes[player.userId] || 0);
              const isTalking = vol > 15;
              const isMuted = !!(player as any).micMuted;

              // If "show only talking" is enabled and player is silent, skip rendering
              if (overlayOnlyTalking && !isTalking && !isMe) {
                return null;
              }

              return (
                <motion.div
                  key={player.userId}
                  initial={{ opacity: 0, x: (overlayPosition || "top-left").includes("left") ? -30 : 30, scale: 0.9 }}
                  animate={{ opacity: isTalking ? speakingOpacityVal : normalOpacityVal, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", damping: 20, stiffness: 200 }}
                  className="flex items-center gap-2.5 flex-row"
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
                      "px-3 py-1 rounded-lg backdrop-blur-md transition-all duration-150 border",
                      isTalking 
                        ? "bg-[#22c55e]/15 border-[#22c55e]/30 text-white font-black shadow-[0_0_10px_rgba(34,197,94,0.1)]" 
                        : "bg-[#10141a]/85 border-white/5 text-gray-300 font-bold",
                      nameSizes
                    )}
                  >
                    <div className="flex items-center gap-1.5 flex-row">
                      <span className="font-sans tracking-wide truncate max-w-[120px]">
                        {player.username ? (player.username.length > 10 ? player.username.substring(0, 10) + "..." : player.username) : "Player"}
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

      {/* Real-time FPS Overlay Box (Opposite Corner) */}
      {showOverlayFps && lobby.players && lobby.players.length > 0 && (
        <div className={cn("fixed z-[9999] flex flex-col pointer-events-none select-none transition-all duration-300", fpsPositionClasses)} style={{ opacity: normalOpacityVal }}>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a0f18]/98 border border-[#00e5ff]/20 shadow-lg shadow-black/40">
            <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-emerald-400">{overlayFps} FPS</span>
          </div>
        </div>
      )}
    </>
  );
};
