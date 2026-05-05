import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useLobby } from "../context/LobbyContext";
import { Users, Activity, Play, X, Mic, MicOff } from "lucide-react";
import { cn } from "../lib/utils";

export const LobbyOverlay = () => {
  const { lobby, leaveLobby } = useLobby();
  const location = useLocation();

  // Don't show if not in a lobby or already on the lobby room page
  if (!lobby || location.pathname.startsWith("/lobby/")) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 right-6 z-[999] group"
      >
        <div className="relative">
          {/* Pulsing Light Effect */}
          <div className="absolute inset-0 bg-neon-blue/20 rounded-[24px] blur-xl animate-pulse" />
          
            <div className="relative bg-[#10141a] border border-white/5 p-2 rounded-[24px] shadow-2xl flex items-center justify-between gap-4 min-w-[280px]">
              
              <Link to={`/lobby/${lobby.id}`} className="flex items-center gap-4 flex-1">
                {/* Right side in RTL (Icon) */}
                <div className="h-[52px] w-[52px] rounded-2xl bg-teal-600 border border-teal-500/30 shadow-[0_0_20px_rgba(13,148,136,0.3)] flex items-center justify-center text-teal-300 relative overflow-hidden shrink-0">
                  <Activity size={26} strokeWidth={2.5} className="animate-pulse" />
                </div>
                
                {/* Title and stats */}
                <div className="flex flex-col flex-1 pl-2 text-right">
                  <h4 className="text-white font-black text-xl tracking-tight truncate max-w-[140px] leading-tight">
                    {lobby.title || "تستس"}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-[10px] bg-white/5 text-[9px] font-black text-gray-500 uppercase tracking-widest border border-white/5">
                      {lobby.status === "STARTING" ? "STARTING" : "WAITING"}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-white/10" />
                    <span className="flex items-center gap-1 text-[11px] font-black text-gray-400">
                      {lobby.players.length}/{lobby.maxPlayers}
                      <Users size={12} className="text-teal-500" />
                    </span>
                  </div>
                </div>
              </Link>
              
              {/* Separator */}
              <div className="h-10 w-px bg-white/5 mx-1" />

              {/* Close Button */}
              <div className="ml-1">
                <button
                  onClick={() => leaveLobby()}
                  className="h-[46px] w-[46px] rounded-[18px] bg-[#1a1f26] border border-white/5 text-gray-500 hover:text-white hover:bg-red-500/20 transition-all flex items-center justify-center group/btn shrink-0"
                >
                  <X size={20} className="group-hover/btn:scale-110 transition-transform" />
                </button>
              </div>
            </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
