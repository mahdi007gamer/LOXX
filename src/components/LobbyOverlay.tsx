import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useLobby } from "../context/LobbyContext";
import { Users, Activity, X } from "lucide-react";
import { cn } from "../lib/utils";

export const LobbyOverlay = () => {
  const { lobby, leaveLobby } = useLobby();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  // Don't show if not in a lobby or already on the lobby room page
  if (!lobby || location.pathname.startsWith("/lobby/")) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 md:bottom-6 right-6 z-[999] flex items-center justify-end group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative flex items-center gap-4 flex-row shadow-[0_0_20px_rgba(0,229,255,0.3)] rounded-full">
          {/* Activity Icon - Always visible, animates pulse */}
          <Link to={`/lobby/${lobby.id}`} className="relative shrink-0 z-10 transition-transform duration-300 hover:scale-110 cursor-pointer">
            <div className="absolute inset-0 bg-neon-blue/40 rounded-full blur-xl animate-pulse" />
            <div className="h-16 w-16 rounded-full bg-[#10141a] border-2 border-neon-blue flex items-center justify-center relative overflow-hidden transition-all duration-300 z-10">
               <Activity size={28} className="text-neon-blue animate-pulse" />
            </div>
            {/* Status indicator pip */}
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-[#10141a] z-20 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </Link>

          {/* Details panel - Expands on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative bg-[#10141a]/95 backdrop-blur-xl border border-neon-blue/20 py-2 pl-2 pr-6 rounded-3xl flex items-center justify-between gap-4 w-[280px] z-0 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/10 rounded-full blur-3xl -z-10" />
                
                <Link to={`/lobby/${lobby.id}`} className="flex flex-col flex-1 pl-4 text-right pointer-events-auto z-10">
                  <h4 className="text-white font-black text-xl tracking-tight truncate max-w-[150px] leading-tight" dir="auto">
                    {lobby.title || "لابی"}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 flex-row">
                    <span className="px-2 py-0.5 rounded-[10px] bg-neon-blue/10 text-[9px] font-black text-neon-blue uppercase tracking-widest border border-neon-blue/20">
                      {lobby.status}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-white/10" />
                    <span className="flex items-center gap-1 text-[11px] font-black text-neon-blue flex-row">
                      {lobby.players?.length || 1}/{lobby.maxPlayers || 8}
                      <Users size={12} className="text-neon-blue/70" />
                    </span>
                  </div>
                </Link>
                
                {/* Separator */}
                <div className="h-10 w-px bg-white/10 mx-1 z-10 shrink-0" />

                {/* Close Button */}
                <div className="mr-1 z-10 pointer-events-auto shrink-0">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      leaveLobby();
                    }}
                    className="h-[46px] w-[46px] rounded-[18px] bg-[#1a1f26] border border-white/5 text-gray-400 hover:text-white hover:bg-red-500/80 transition-all flex items-center justify-center group/btn shrink-0"
                    title="خروج از لابی"
                  >
                    <X size={20} className="group-hover/btn:scale-110 transition-transform flex-shrink-0" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
