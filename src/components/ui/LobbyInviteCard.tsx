import React, { useMemo } from 'react';
import useSWR from 'swr';
import { Play, Users, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import api from '../../lib/api';
import { cn } from '../../lib/utils';
import { GlowButton } from './GlowButton';
import { useLobby } from '../../context/LobbyContext';

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

interface LobbyInviteCardProps {
  initialData: any;
}

export const LobbyInviteCard: React.FC<LobbyInviteCardProps> = ({ initialData }) => {
  const { data: lobby, error } = useSWR(`/lobbies/${initialData.lobbyId}`, fetcher, {
    fallbackData: null,
    refreshInterval: 5000 // Poll every 5s for updates
  });

  const { joinLobby, lobby: activeLobby } = useLobby();

  // Combine initial + live state
  const currentLobby = lobby || initialData;
  const isFull = lobby ? (lobby.members?.length || lobby.players?.length) >= lobby.maxPlayers : false;
  const isClosed = error?.response?.status === 404; // Deleted lobby
  const isPlaying = lobby ? ['STARTING', 'IN_PROGRESS'].includes(lobby.status) : false;
  
  // Decide button state based on real data
  let btnVariant = "blue";
  let btnText = "ورود";
  let btnDisabled = false;

  if (isClosed) {
    btnVariant = "gray";
    btnText = "به پایان رسیده!";
    btnDisabled = true;
  } else if (isPlaying) {
    btnVariant = "pink";
    btnText = "در حال بازی کردن";
    btnDisabled = true;
  } else if (isFull && activeLobby?.id !== currentLobby.id) {
    btnVariant = "green";
    btnText = "پر شده!";
    btnDisabled = true;
  }

  const handleJoin = () => {
    if (!btnDisabled) {
      const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
      const isOverlayWidget = isElectron && (
        window.location.pathname === '/overlay' || 
        window.location.pathname === '/lobby/overlay-widget' ||
        window.location.hash.includes('/overlay')
      ) && (new URLSearchParams(window.location.search).get("is_overlay_window") === "true" || window.location.hash.includes("is_overlay_window=true"));
      
      if (isOverlayWidget && (window as any).electronAPI?.sendOverlayAction) {
        (window as any).electronAPI.sendOverlayAction({ type: 'join-lobby', lobbyId: initialData.lobbyId });
      } else {
        joinLobby(initialData.lobbyId);
      }
    }
  };

  const slotsText = lobby ? `${lobby.members?.length || lobby.players?.length}/${lobby.maxPlayers}` : initialData.slots;
  const gameTitle = lobby?.game?.title || initialData.gameTitle;
  const region = lobby?.region || initialData.region;

  return (
    <div className="space-y-3 py-1">
      <p className="font-black text-neon-blue text-[9px] flex items-center gap-1.5 px-0 uppercase tracking-widest opacity-70">
        <Zap size={10} fill="currentColor" />
        دعوت به لابی اختصاصی
      </p>
      
      <div className="group/lobby relative overflow-hidden rounded-xl bg-white/[0.03] border border-white/5 p-2.5 pr-4 shadow-xl backdrop-blur-xl flex items-center gap-3 transition-all hover:bg-white/[0.05] min-w-[260px]">
        <div className="absolute top-0 right-0 bottom-0 w-[2px] bg-neon-blue opacity-50"></div>
        <div className="h-9 w-9 shrink-0 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue group-hover:scale-105 transition-transform">
          <Play size={16} fill="currentColor" className="ml-0.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="text-xs font-black text-white truncate">{gameTitle}</h5>
          <p className="text-[8px] text-gray-500 font-bold uppercase truncate">{region}</p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-gray-400 font-bold uppercase border border-white/5">
            <Users size={10} className={isFull ? "text-green-500" : "text-neon-blue"} />
            {slotsText}
          </div>
          {btnDisabled ? (
            <div className={cn(
              "h-7 px-4 rounded-lg font-black text-[10px] flex items-center cursor-not-allowed",
              btnVariant === 'gray' ? "bg-gray-600/50 text-gray-400" :
              btnVariant === 'green' ? "bg-green-500/20 text-green-500 border border-green-500/30" :
              "bg-neon-pink/20 text-neon-pink border border-neon-pink/30"
            )}>
              {btnText}
            </div>
          ) : (
            <motion.div
              animate={{ 
                boxShadow: [
                  "0 0 10px rgba(0, 229, 255, 0.2)",
                  "0 0 25px rgba(0, 229, 255, 0.4)",
                  "0 0 10px rgba(0, 229, 255, 0.2)"
                ] 
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <GlowButton variant={btnVariant as any} className="h-7 px-4 !rounded-lg font-black text-[10px]" onClick={handleJoin}>
                {btnText}
              </GlowButton>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
