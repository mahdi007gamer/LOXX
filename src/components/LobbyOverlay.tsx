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
          
          <div className="relative glass border border-white/10 p-4 rounded-[24px] shadow-2xl flex items-center gap-4 min-w-[280px]">
            <Link to={`/lobby/${lobby.id}`} className="flex items-center gap-4 flex-1">
              <div className="h-12 w-12 rounded-2xl bg-neon-blue/10 flex items-center justify-center text-neon-blue relative overflow-hidden">
                <Activity size={24} className="animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-tr from-neon-blue/20 to-transparent" />
              </div>

              <div>
                <h4 className="text-white font-black text-sm uppercase tracking-tight truncate max-w-[140px]">
                  {lobby.title || "Active Lobby"}
                </h4>
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mt-0.5">
                  <span className="flex items-center gap-1">
                    <Users size={10} className="text-neon-blue" />
                    {lobby.players.length}/{lobby.maxPlayers}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full bg-white/5",
                    lobby.status === "STARTING" && "text-neon-pink animate-pulse"
                  )}>
                    {lobby.status}
                  </span>
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2 border-r border-white/10 pr-4">
              <button
                onClick={() => leaveLobby()}
                className="h-10 w-10 rounded-xl bg-white/5 hover:bg-neon-pink/10 text-gray-500 hover:text-neon-pink transition-all flex items-center justify-center group/btn"
              >
                <X size={18} className="group-hover/btn:rotate-90 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
