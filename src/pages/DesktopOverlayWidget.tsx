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
  const { user } = useAuth();
  const currentUserId = user?.id;

  // Sync settings instantly via storage events for Electron multi-process windows
  const [localOverlayPos, setLocalOverlayPos] = useState(() => localStorage.getItem("loxx_overlay_position") || "top-left");
  const [localOverlaySize, setLocalOverlaySize] = useState(() => localStorage.getItem("loxx_overlay_size") || "medium");
  const [localMembersVisible, setLocalMembersVisible] = useState(() => localStorage.getItem("loxx_overlay_members_visible") !== "false");
  const [localNormalOpacity, setLocalNormalOpacity] = useState(() => {
    const val = localStorage.getItem("loxx_overlay_normal_opacity");
    return val !== null ? parseFloat(val) : 0.75;
  });
  const [localSpeakingOpacity, setLocalSpeakingOpacity] = useState(() => {
    const val = localStorage.getItem("loxx_overlay_speaking_opacity");
    return val !== null ? parseFloat(val) : 1.0;
  });
  const [localOnlyTalking, setLocalOnlyTalking] = useState(() => localStorage.getItem("loxx_overlay_only_talking") === "true");
  const [localShowOverlayFps, setLocalShowOverlayFps] = useState(() => localStorage.getItem("loxx_show_overlay_fps") !== "false");

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "loxx_overlay_position" && e.newValue) {
        setLocalOverlayPos(e.newValue);
      } else if (e.key === "loxx_overlay_size" && e.newValue) {
        setLocalOverlaySize(e.newValue);
      } else if (e.key === "loxx_overlay_members_visible" && e.newValue) {
        setLocalMembersVisible(e.newValue === "true");
      } else if (e.key === "loxx_overlay_normal_opacity" && e.newValue) {
        setLocalNormalOpacity(parseFloat(e.newValue));
      } else if (e.key === "loxx_overlay_speaking_opacity" && e.newValue) {
        setLocalSpeakingOpacity(parseFloat(e.newValue));
      } else if (e.key === "loxx_overlay_only_talking" && e.newValue) {
        setLocalOnlyTalking(e.newValue === "true");
      } else if (e.key === "loxx_show_overlay_fps" && e.newValue) {
        setLocalShowOverlayFps(e.newValue !== "false");
      }
    };
    const handleCustomFpsUpdate = () => {
      setLocalShowOverlayFps(localStorage.getItem("loxx_show_overlay_fps") !== "false");
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("loxx_overlay_fps_update", handleCustomFpsUpdate);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("loxx_overlay_fps_update", handleCustomFpsUpdate);
    };
  }, []);

  // Sync local real-time FPS calculation loop
  const [overlayFps, setOverlayFps] = useState(60);
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

  const posStr = localOverlayPos;
  const sizeStr = localOverlaySize;
  const membersVisibleVal = localMembersVisible;
  const normalOpacityVal = localNormalOpacity;
  const speakingOpacityVal = localSpeakingOpacity;
  const overlayOnlyTalkingVal = localOnlyTalking;

  const positionClasses = {
    "top-left": "top-6 left-6 items-start text-left",
    "top-right": "top-6 right-6 items-end text-right",
    "bottom-left": "bottom-6 left-6 items-start text-left",
    "bottom-right": "bottom-6 right-6 items-end text-right"
  }[posStr as string] || "top-6 left-6 items-start text-left";

  const getOppositePosition = (pos: string) => {
    if (pos.endsWith("-left")) return pos.replace("-left", "-right");
    if (pos.endsWith("-right")) return pos.replace("-right", "-left");
    return "top-right";
  };
  const fpsPosStr = getOppositePosition(posStr);
  const fpsPositionClasses = {
    "top-left": "top-6 left-6 items-start text-left",
    "top-right": "top-6 right-6 items-end text-right",
    "bottom-left": "bottom-6 left-6 items-start text-left",
    "bottom-right": "bottom-6 right-6 items-end text-right"
  }[fpsPosStr] || "top-6 right-6 items-end text-right";

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
      {/* Full high-performance transparent dark overlay backdrop when interactive / focused */}
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
              background: "rgba(3, 3, 6, 0.65)", 
              zIndex: 8000 
            }}
            className="fixed inset-0 pointer-events-auto select-none border-2 border-neon-blue/20"
          />
        )}
      </AnimatePresence>

      {/* Roster Container */}
      <div className={cn("fixed z-[9999] flex flex-col pointer-events-none select-none", positionClasses)}>
        {/* Title tag - minimal, matches Discord Overlay appearance */}
        {membersVisibleVal && players && players.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#030306]/95 border border-white/5 mb-2 shadow-lg shadow-black/30 w-fit">
            <span className="h-2 w-2 rounded-full bg-[#22c55e] animate-ping" />
            <span className="text-[10px] font-black tracking-wider text-white uppercase font-sans">LOXX LOBBY</span>
            <span className="text-[9px] text-gray-400 font-mono">({players.length})</span>
          </div>
        )}

        <div className="flex flex-col gap-3 items-start">
          <AnimatePresence>
            {membersVisibleVal && players?.map((player) => {
              const isMe = player.userId === currentUserId;
              
              // Speech detection comes strictly from IPC now, avoiding context reliance
              const isTalking = player.isSpeaking;
              const isMuted = player.isMuted;

              // If "show only talking" is enabled and player is silent, skip rendering
              if (overlayOnlyTalkingVal && !isTalking && !isMe) {
                return null;
              }

              return (
                <motion.div
                  key={player.userId}
                  initial={{ opacity: 0, x: posStr.includes("left") ? -30 : 30, scale: 0.9 }}
                  animate={{ opacity: isTalking ? speakingOpacityVal : normalOpacityVal, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", damping: 20, stiffness: 200 }}
                  className="flex items-center gap-2.5 flex-row"
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
                      "px-3 py-1 rounded-lg transition-all duration-150 border",
                      isTalking 
                        ? "bg-[#22c55e]/90 border-[#22c55e]/50 text-white font-black shadow-[0_0_10px_rgba(34,197,94,0.15)]" 
                        : "bg-[#0a0f18]/95 border-white/5 text-gray-300 font-bold",
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
      {localShowOverlayFps && membersVisibleVal && players && players.length > 0 && (
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
