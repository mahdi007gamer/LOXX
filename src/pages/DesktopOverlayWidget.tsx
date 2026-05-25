import React, { useEffect, useState } from "react";
import { MicOff, Volume2 } from "lucide-react";

interface OverlayPlayer {
  userId: string;
  username: string;
  avatarUrl?: string;
  isSpeaking: boolean;
  isMuted: boolean;
}

export const DesktopOverlayWidget = () => {
  const [players, setPlayers] = useState<OverlayPlayer[]>([]);
  
  // We need to fetch position/size configs from local storage or IPC. 
  // Let's assume standard for now or read from localStorage if accessible 
  // (Note: localStorage in another window might be different but let's try reading it)
  const posStr = "top-left";
  const sizeStr = localStorage.getItem("loxx_overlay_size") || "medium";
  
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
    
    if (api) {
      if (api.getOverlayPlayers) {
        api.getOverlayPlayers().then((initialPlayers: OverlayPlayer[]) => {
          if (initialPlayers && Array.isArray(initialPlayers)) {
            setPlayers(initialPlayers);
          }
        });
      }

      if (api.onOverlayPlayersUpdate) {
        const unsubscribe = api.onOverlayPlayersUpdate((updatedPlayers: OverlayPlayer[]) => {
          setPlayers(updatedPlayers || []);
        });
        return () => {
          if (unsubscribe) unsubscribe();
        };
      }
    }
  }, []);

  if (!players || players.length === 0) {
    return null; // Don't show anything if no players, like Discord HUD
  }

  return (
    <div className={`fixed z-[9999] flex flex-col gap-3 pointer-events-none select-none ${positionClasses}`} dir="ltr">
      {/* Title tag - minimal, matches Discord Overlay appearance */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 border border-white/5 backdrop-blur-md mb-1 shadow-lg shadow-black/30">
        <span className="h-2 w-2 rounded-full bg-[#22c55e] animate-ping" />
        <span className="text-[10px] font-black tracking-wider text-white uppercase font-sans">LOXX DISCORD OVERLAY</span>
        <span className="text-[9px] text-gray-400 font-mono">({players.length})</span>
      </div>

      <div className="flex flex-col gap-2 w-full">
        {players.map((player) => {
          const isTalking = player.isSpeaking;
          const isMuted = player.isMuted;

          return (
            <div
              key={player.userId}
              style={{ opacity: isTalking ? 1 : 0.75 }}
              className="flex items-center gap-2.5 flex-row transition-opacity duration-200"
            >
              {/* Profile Avatar / speaking glowing bubble */}
              <div className="relative shrink-0">
                <div 
                  className={`rounded-full bg-[#151921] border border-white/10 flex items-center justify-center relative overflow-hidden transition-all duration-150 shadow-md ${avatarSizes}`}
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
                className={`px-3 py-1 rounded-lg backdrop-blur-md transition-all duration-150 border ${
                  isTalking 
                    ? "bg-[#22c55e]/15 border-[#22c55e]/30 text-white font-black shadow-[0_0_10px_rgba(34,197,94,0.1)]" 
                    : "bg-[#10141a]/85 border-white/5 text-gray-300 font-bold"
                } ${nameSizes}`}
              >
                <div className="flex items-center gap-1.5 flex-row">
                  <span className="font-sans tracking-wide truncate max-w-[120px]">{player.username || "بازیکن"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
