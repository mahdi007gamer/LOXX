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

  useEffect(() => {
    // Elegant system-tray or background HUD layout settings
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";

    const api = (window as any).electronAPI;
    if (api && api.onOverlayPlayersUpdate) {
      const unsubscribe = api.onOverlayPlayersUpdate((updatedPlayers: OverlayPlayer[]) => {
        setPlayers(updatedPlayers || []);
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, []);

  if (!players || players.length === 0) {
    return (
      <div className="p-4 bg-black/40 border border-white/5 rounded-2xl backdrop-blur-md text-center max-w-[280px]">
        <p className="text-[10px] text-gray-400 font-bold">بخش اورلی دسکتاپ لوکس</p>
        <p className="text-[9px] text-gray-500 font-sans mt-1 leading-normal">در حال انتظار برای پیوستن به لابی چت صوتی...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 p-3 select-none pointer-events-none text-right" dir="rtl">
      {/* Title Tag */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 border border-white/5 backdrop-blur-md self-start shadow-lg shadow-black/50">
        <span className="h-2 w-2 rounded-full bg-[#10b981] animate-ping shrink-0" />
        <span className="text-[9px] font-black tracking-wider text-white uppercase font-sans">LOXX DISCORD OVERLAY</span>
        <span className="text-[8px] text-gray-400 font-mono">({players.length})</span>
      </div>

      <div className="flex flex-col gap-2">
        {players.map((player) => {
          const isTalking = player.isSpeaking;
          const isMuted = player.isMuted;

          return (
            <div
              key={player.userId}
              className="flex items-center gap-2 flex-row self-start transition-all"
            >
              {/* Profile Avatar / speaking glowing bubble */}
              <div className="relative shrink-0">
                <div 
                  className="h-9 w-9 rounded-full bg-[#151921] border border-white/10 flex items-center justify-center relative overflow-hidden transition-all duration-150 shadow-md"
                  style={
                    isTalking && !isMuted
                      ? { 
                          boxShadow: "0 0 0 2.5px #10b981, 0 0 12px rgba(16,185,129,0.7)", 
                          borderColor: "#10b981",
                          transform: "scale(1.05)"
                        }
                      : {}
                  }
                >
                  {player.avatarUrl ? (
                    <img 
                      src={player.avatarUrl} 
                      className="h-full w-full object-cover" 
                      alt="" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="font-bold text-xs text-white uppercase">
                      {(player.username || "G").substring(0, 2)}
                    </span>
                  )}
                </div>

                {/* Status indicator badges */}
                <div className="absolute -bottom-0.5 -right-0.5 flex gap-0.5">
                  {isMuted ? (
                    <div className="bg-red-500 rounded-full p-0.5 border border-black shadow-[0_0_5px_rgba(239,68,68,0.5)]">
                      <MicOff size={7} className="text-white" />
                    </div>
                  ) : isTalking ? (
                    <div className="bg-[#10b981] rounded-full p-0.5 border border-black animate-bounce">
                      <Volume2 size={7} className="text-white" />
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Player Name Tag with speak indicators */}
              <div 
                className={`px-2.5 py-1 rounded-xl backdrop-blur-md transition-all duration-150 border text-xs shadow-md shadow-black/40 ${
                  isTalking 
                    ? "bg-[#10b981]/20 border-[#10b981]/30 text-white font-black" 
                    : "bg-[#10141a]/90 border-white/5 text-gray-300 font-bold"
                }`}
              >
                <span className="font-sans tracking-wide truncate max-w-[110px] block">{player.username || "بازیکن"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
