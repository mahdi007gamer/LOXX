import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  Shield, 
  Mic, 
  MicOff, 
  Settings, 
  LogOut, 
  Copy, 
  Check, 
  MessageSquare, 
  Send,
  UserPlus,
  Play,
  RotateCcw,
  Ban,
  Lock,
  Globe,
  Clock,
  Trophy,
  ChevronLeft
} from "lucide-react";
import { GlowButton } from "../components/ui/GlowButton";
import { cn } from "@/src/lib/utils";

interface Player {
  id: string;
  name: string;
  avatar: string;
  rank: string;
  isHost?: boolean;
  isReady: boolean;
  hasMic: boolean;
  isMuted: boolean;
}

interface Message {
  id: string;
  user: string;
  text: string;
  time: string;
  isSystem?: boolean;
}

export const LobbyRoomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isPrivate, setIsPrivate] = useState(true);
  
  // Mock State
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: "Apex_Hunter", avatar: "👨‍🎤", rank: "Global Elite", isHost: true, isReady: true, hasMic: true, isMuted: false },
    { id: "2", name: "NeonGhost", avatar: "🥷", rank: "Supreme", isReady: false, hasMic: true, isMuted: false },
    { id: "3", name: "CyberViper", avatar: "🧛", rank: "LEM", isReady: true, hasMic: false, isMuted: true },
    { id: "4", name: "Empty Slot", avatar: "", rank: "", isReady: false, hasMic: false, isMuted: false },
    { id: "5", name: "Empty Slot", avatar: "", rank: "", isReady: false, hasMic: false, isMuted: false },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    { id: "1", user: "System", text: "Lobby created. Waiting for teammates...", time: "12:00", isSystem: true },
    { id: "2", user: "NeonGhost", text: "Yo! Let's win this one.", time: "12:01" },
    { id: "3", user: "System", text: "CyberViper joined the lobby.", time: "12:02", isSystem: true },
  ]);

  const [inputMessage, setInputMessage] = useState("");

  const handleCopyCode = () => {
    navigator.clipboard.writeText("LX-9921-XP");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      user: "You",
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setInputMessage("");
  };

  const handleStartMatch = () => {
    setIsStarting(true);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isStarting && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      // Logic for match start
    }
    return () => clearTimeout(timer);
  }, [isStarting, countdown]);

  return (
    <div className="min-h-screen bg-[#050508] text-white p-4 md:p-8 flex flex-col gap-6 relative overflow-hidden">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.05)_1px,transparent_1px)] bg-[length:100px_100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050508_80%)]" />
      </div>

      {/* Header Bar */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 glass rounded-3xl p-4 md:p-6 flex flex-wrap items-center justify-between gap-6 overflow-hidden border-white/5"
      >
        <div className="flex items-center gap-5">
           <button 
            onClick={() => navigate("/lobbies")}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
           >
             <ChevronLeft size={20} />
           </button>
           
           <div>
             <div className="flex items-center gap-2 mb-1">
               <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">[CS2] Competitive Grinders</h1>
               <div className="px-2 py-0.5 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-[10px] font-black text-neon-blue uppercase">
                 Middle East
               </div>
             </div>
             <div className="flex items-center gap-4 text-xs text-gray-500 font-bold uppercase tracking-widest">
               <span className="flex items-center gap-1.5"><Users size={12} className="text-neon-blue" /> 3 / 5 Players</span>
               <span className="flex items-center gap-1.5"><Clock size={12} className="text-neon-pink" /> 12:00 Activation</span>
             </div>
           </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 bg-black/40 rounded-2xl p-1 border border-white/5">
             <div className="px-4 py-2 text-xs font-black text-gray-500 border-r border-white/5 uppercase tracking-widest">Lobby Code</div>
             <div className="px-4 py-2 font-mono text-sm text-neon-blue flex items-center gap-3">
               LX-9921-XP
               <button onClick={handleCopyCode} className="hover:text-white transition-colors">
                 {copied ? <Check size={16} /> : <Copy size={16} />}
               </button>
             </div>
          </div>

          <GlowButton 
            variant="blue" 
            onClick={handleStartMatch}
            disabled={isStarting}
            className="px-8 h-12 shadow-[0_10px_30px_rgba(0,229,255,0.2)]"
          >
            <Play size={18} className="mr-2" />
            START MATCH
          </GlowButton>
        </div>
      </motion.header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 relative z-10 overflow-hidden">
        {/* Main Player Grid */}
        <div className="flex-1 space-y-6">
          {/* Status Alert */}
          <AnimatePresence>
            {isStarting ? (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="bg-neon-blue/20 border border-neon-blue/40 rounded-2xl p-4 flex items-center justify-center overflow-hidden"
              >
                <div className="flex items-center gap-6">
                  <span className="text-neon-blue font-black tracking-widest uppercase text-sm">Match Starting in</span>
                  <span className="text-4xl font-black text-white tabular-nums">{countdown}s</span>
                  <button 
                    onClick={() => setIsStarting(false)}
                    className="text-[10px] font-black text-gray-400 hover:text-white underline uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between px-2"
              >
                <div className="flex items-center gap-3">
                   <div className="h-2 w-2 rounded-full bg-neon-blue animate-pulse shadow-[0_0_10px_rgba(0,229,255,0.8)]" />
                   <span className="text-xs font-black uppercase text-gray-400 tracking-widest">Waiting for 2 more players</span>
                </div>
                <div className="flex items-center gap-6">
                   <button 
                    onClick={() => setIsPrivate(!isPrivate)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 hover:text-white transition-colors"
                   >
                     {isPrivate ? <Lock size={14} className="text-neon-pink" /> : <Globe size={14} className="text-neon-blue" />}
                     {isPrivate ? "Private Lobby" : "Public Lobby"}
                   </button>
                   <button className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 hover:text-white transition-colors">
                     <Settings size={14} />
                     Lobby Settings
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {players.map((player) => (
              <motion.div
                key={player.id}
                layout
                whileHover={{ scale: 1.02, y: -4 }}
                className={cn(
                  "relative p-6 rounded-[28px] border bg-[#0a0a0f] transition-all duration-300",
                  player.name === "Empty Slot" ? "border-dashed border-white/5 opacity-50" : "border-white/10 group shadow-lg"
                )}
              >
                {player.name !== "Empty Slot" ? (
                  <>
                    {player.isHost && (
                      <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-black text-gray-400 tracking-widest uppercase">
                        Host
                      </div>
                    )}
                    
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        <div className="h-24 w-24 rounded-3xl bg-glass border border-white/10 flex items-center justify-center text-4xl shadow-2xl relative overflow-hidden group-hover:border-neon-blue/50 transition-colors">
                           {player.avatar}
                           <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>
                        {player.isReady && (
                          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-neon-blue border-4 border-[#0a0a0f] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.5)]">
                             <Check size={10} className="text-dark-bg" />
                          </div>
                        )}
                      </div>

                      <h3 className="text-lg font-black text-white group-hover:text-neon-blue transition-colors">{player.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Trophy size={12} className="text-neon-pink" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{player.rank}</span>
                      </div>

                      <div className="flex gap-2 mt-6">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center border transition-all",
                          player.hasMic ? (player.isMuted ? "bg-neon-pink/10 border-neon-pink/20 text-neon-pink" : "bg-white/5 border-white/10 text-gray-400") : "bg-black/20 border-white/5 text-gray-700"
                        )}>
                          {player.hasMic ? (player.isMuted ? <MicOff size={16} /> : <Mic size={16} />) : <MicOff size={16} />}
                        </div>
                        {player.id !== "1" && (
                          <div className="h-10 w-10 rounded-xl flex items-center justify-center border border-white/10 bg-white/5 text-gray-500 hover:text-neon-pink hover:border-neon-pink/50 cursor-pointer transition-all">
                            <Ban size={16} />
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-10">
                    <div className="h-16 w-16 rounded-3xl border-2 border-dashed border-white/5 flex items-center justify-center text-white/10 mb-4 group-hover:border-white/20 transition-colors">
                      <UserPlus size={24} />
                    </div>
                    <button className="text-[10px] font-black uppercase text-gray-600 hover:text-white tracking-widest transition-colors">Invite Player</button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Chat / Sidebar */}
        <motion.aside 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full lg:w-96 flex flex-col glass rounded-3xl border-white/5 overflow-hidden"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
              <MessageSquare size={16} className="text-neon-blue" />
              Lobby Comms
            </h2>
            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex flex-col gap-1", msg.isSystem ? "items-center" : "items-start")}>
                {msg.isSystem ? (
                  <div className="px-4 py-1.5 rounded-full bg-white/5 text-[9px] font-black text-gray-500 uppercase tracking-widest text-center">
                    {msg.text}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-neon-blue">{msg.user}</span>
                      <span className="text-[9px] font-bold text-gray-600">{msg.time}</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm text-gray-300 max-w-[90%] leading-relaxed">
                      {msg.text}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-black/20 border-t border-white/5">
            <div className="relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-neon-blue/50 transition-all"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1.5 h-9 w-9 flex items-center justify-center rounded-xl bg-neon-blue text-dark-bg hover:bg-neon-blue/90 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </motion.aside>
      </div>

      {/* Footer Controls (Host Only) */}
      <motion.footer 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 flex flex-wrap items-center justify-between gap-6 p-4 glass rounded-[28px] border-white/5 mt-auto"
      >
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-4 px-6 border-r border-white/5">
             <button 
                onClick={() => setIsReady(!isReady)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                  isReady ? "bg-neon-blue text-dark-bg shadow-lg shadow-neon-blue/20" : "bg-white/5 text-gray-500 hover:text-white border border-white/5"
                )}
             >
               {isReady ? <Check size={16} /> : null}
               {isReady ? "Ready to Play" : "Mark Ready"}
             </button>
           </div>
           
           <div className="flex items-center gap-4">
              <button className="h-11 w-11 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors group">
                 <Mic size={20} className="group-hover:scale-110 transition-transform" />
              </button>
              <button className="h-11 w-11 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors group">
                 <UserPlus size={20} className="group-hover:scale-110 transition-transform" />
              </button>
              <button className="h-11 w-11 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors group">
                 <RotateCcw size={20} className="group-hover:scale-110 transition-transform" />
              </button>
           </div>
        </div>

        <button 
          onClick={() => navigate("/lobbies")}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase text-neon-pink hover:bg-neon-pink/10 transition-all"
        >
          <LogOut size={16} />
          Leave Lobby
        </button>
      </motion.footer>
    </div>
  );
};
