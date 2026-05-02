import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useLobby } from "../context/LobbyContext";
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
  ChevronLeft,
  X,
  Crown
} from "lucide-react";
import { GlowButton } from "../components/ui/GlowButton";
import { useFriends } from "../context/FriendsContext";
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
  ping: number;
  isSpeaking: boolean;
  volume: number;
}

interface Message {
  id: string;
  user: string;
  text: string;
  time: string;
  isSystem?: boolean;
  toUserId?: string; // null for lobby chat
  fromUserId?: string;
}

export const LobbyRoomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    lobby, 
    setLobbyId, 
    setLobbyStatus, 
    setLobbyPlayers, 
    setLobbyCountdown, 
    leaveLobby 
  } = useLobby();
  const { openChat } = useFriends();
  
  const [copied, setCopied] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isMatchStarted, setIsMatchStarted] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [allReadyPulse, setAllReadyPulse] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeProfileUserId, setActiveProfileUserId] = useState<string | null>(null);

  // Initialize Lobby in context
  useEffect(() => {
    if (id) {
       setLobbyId(id);
    }
    return () => {};
  }, [id]);
  
  // Mock State
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: "Apex_Hunter", avatar: "👨‍🎤", rank: "Global Elite", isHost: true, isReady: true, hasMic: true, isMuted: false, ping: 24, isSpeaking: false, volume: 80 },
    { id: "2", name: "NeonGhost", avatar: "🥷", rank: "Supreme", isReady: false, hasMic: true, isMuted: false, ping: 45, isSpeaking: true, volume: 100 },
    { id: "3", name: "CyberViper", avatar: "🧛", rank: "LEM", isReady: true, hasMic: false, isMuted: true, ping: 12, isSpeaking: false, volume: 50 },
    { id: "slot-4", name: "Empty Slot", avatar: "", rank: "", isReady: false, hasMic: false, isMuted: false, ping: 0, isSpeaking: false, volume: 100 },
    { id: "slot-5", name: "Empty Slot", avatar: "", rank: "", isReady: false, hasMic: false, isMuted: false, ping: 0, isSpeaking: false, volume: 100 },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    { id: "1", user: "LOXX BOT", text: "لابی ساخته شد. منتظر هم‌تیمی‌ها هستیم...", time: "10:22 PM", isSystem: true },
    { id: "2", user: "NeonGhost", text: "بچه‌ها بریم برای برد! 🔥", time: "10:22 PM" },
    { id: "3", user: "Apex_Hunter", text: "همه آماده باشن.", time: "10:22 PM" },
  ]);

  const [inputMessage, setInputMessage] = useState("");

  // Simulate players joining and becoming ready
  useEffect(() => {
    // 1. MISO joins after 2 seconds
    const joinTimer = setTimeout(() => {
      setPlayers(prev => {
        const newPlayers = [...prev];
        const emptySlotIndex = newPlayers.findIndex(p => p.name === "Empty Slot");
        if (emptySlotIndex !== -1) {
          newPlayers[emptySlotIndex] = {
            id: "4",
            name: "MISO",
            avatar: "👧",
            rank: "Master Guardian",
            isReady: false,
            hasMic: true,
            isMuted: false,
            ping: 32,
            isSpeaking: false,
            volume: 100
          };
        }
        return newPlayers;
      });
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        user: "LOXX BOT",
        text: "MISO به لابی پیوست.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      }]);
    }, 2000);

    // 2. Everyone becomes ready after 6 seconds
    const readyTimer = setTimeout(() => {
      setPlayers(prev => prev.map(p => p.name !== "Empty Slot" ? { ...p, isReady: true } : p));
      setIsReady(true);
      setMessages(prev => [...prev, {
        id: Date.now().toString() + "ready",
        user: "LOXX BOT",
        text: "همه بازیکنان آماده هستند. مسابقه می‌تواند شروع شود.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      }]);
    }, 6000);

    return () => {
      clearTimeout(joinTimer);
      clearTimeout(readyTimer);
    };
  }, []);

  useEffect(() => {
    const activePlayers = players.filter(p => p.name !== "Empty Slot");
    const readyPlayers = activePlayers.filter(p => p.isReady);
    setLobbyPlayers(activePlayers.length);
    if (activePlayers.length >= 3 && readyPlayers.length === activePlayers.length) {
      setAllReadyPulse(true);
      setLobbyStatus("ready");
    } else {
      setAllReadyPulse(false);
      setLobbyStatus("waiting");
    }
  }, [players]);

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

  const toggleReady = () => {
    setIsReady(!isReady);
    setPlayers(prev => prev.map(p => p.id === "1" ? { ...p, isReady: !isReady } : p));
  };

  const handleStartMatch = () => {
    setIsStarting(true);
    setCountdown(5);
    setLobbyStatus("starting");
  };

  const handleCancelMatch = () => {
    setIsStarting(false);
    setCountdown(5);
    setLobbyStatus("ready");
  };

  const handleReopenLobby = () => {
    setIsMatchStarted(false);
    setIsStarting(false);
    setLobbyStatus("ready");
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isStarting && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
        setLobbyCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && isStarting) {
      setIsStarting(false);
      setIsMatchStarted(true);
      setLobbyStatus("started");
    }
    return () => clearTimeout(timer);
  }, [isStarting, countdown]);

  const handlePlayerVolume = (id: string, vol: number) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, volume: vol } : p));
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-[#050508] text-white p-4 md:p-6 lg:p-8 flex flex-col gap-6 relative overflow-hidden font-sans" dir="rtl">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.03)_1px,transparent_1px)] bg-[length:60px_60px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,229,255,0.1)_0%,transparent_50%)]" />
        <div className="absolute top-[20%] left-[10%] h-96 w-96 bg-neon-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] h-96 w-96 bg-neon-pink/5 rounded-full blur-[120px]" />
      </div>

      {/* Achievement Pulse Overlay */}
      <AnimatePresence>
        {allReadyPulse && !isStarting && !isMatchStarted && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <div className="relative">
               <motion.div 
                 animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="absolute inset-0 bg-neon-blue rounded-full blur-3xl" 
               />
               <h2 className="text-5xl md:text-7xl font-black text-white tracking-widest uppercase text-center relative z-10 drop-shadow-[0_0_20px_rgba(0,229,255,0.8)] px-10">
                 ALL PLAYERS READY
               </h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 glass rounded-[32px] p-4 md:p-6 flex flex-wrap items-center justify-between gap-6 border-white/5 shadow-2xl"
      >
        <div className="flex items-center gap-5">
           <button 
            onClick={() => navigate("/lobbies")}
            className="p-3 rounded-2xl bg-white/5 hover:bg-neon-pink/10 transition-colors text-gray-400 hover:text-neon-pink"
           >
             <ChevronLeft size={20} className="rotate-180" />
           </button>
           
           <div>
             <div className="flex items-center gap-3 mb-1">
               <h1 className="text-xl md:text-3xl font-black tracking-tight text-white">[CS2] رقابتی | رنک‌آپ سریع</h1>
               <div className="px-3 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-[10px] font-black text-neon-blue uppercase tracking-tighter">
                 خاورمیانه (Middle East)
               </div>
             </div>
             <div className="flex items-center gap-5 text-[11px] text-gray-500 font-black uppercase tracking-widest">
               <span className="flex items-center gap-1.5"><Users size={12} className="text-neon-blue" /> {players.filter(p => p.name !== "Empty Slot").length} / 5 بازیکن</span>
               <span className="flex items-center gap-1.5"><Trophy size={13} className="text-neon-pink" /> سطح حرفه‌ای</span>
             </div>
           </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 bg-black/60 rounded-2xl p-1 border border-white/10">
             <div className="px-4 py-2 text-[10px] font-black text-gray-500 border-l border-white/10 uppercase tracking-widest">کد لابی</div>
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
            disabled={isStarting || !allReadyPulse || isMatchStarted}
            className={cn(
              "px-10 h-14 text-sm shadow-[0_15px_40px_-5px_rgba(0,229,255,0.3)]",
              (!allReadyPulse || isMatchStarted) && "opacity-50 grayscale cursor-not-allowed"
            )}
          >
            <Play size={20} className="ml-2" />
            شروع مسابقه
          </GlowButton>
        </div>
      </motion.header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 relative z-10 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto overflow-x-hidden custom-scrollbar pb-24 md:pb-0">
          
          {/* Top Status Panel */}
          <MatchInfoPanel 
            isStarting={isStarting} 
            isMatchStarted={isMatchStarted} 
            countdown={countdown} 
            players={players} 
            onCancel={handleCancelMatch}
            onReopen={handleReopenLobby}
          />

          {/* Players Grid - Responsive: Better wrapping to avoid horizontal scroll */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {players.map((player) => (
                <PlayerCard 
                  key={player.id} 
                  player={player} 
                  isSelected={selectedPlayer === player.id}
                  onSelect={() => setSelectedPlayer(selectedPlayer === player.id ? null : player.id)}
                  onVolumeChange={(val) => handlePlayerVolume(player.id, val)}
                  onMute={(id) => setPlayers(prev => prev.map(p => p.id === id ? { ...p, isMuted: !p.isMuted } : p))}
                  onInvite={() => setIsInviteModalOpen(true)}
                  onProfile={(id) => setActiveProfileUserId(id)}
                  onDirectMessage={(id) => {
                    const p = players.find(player => player.id === id);
                    openChat(id, p?.name);
                  }}
                  onAddFriend={() => {}}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop Chat Sidebar (Right) */}
        <div className="hidden lg:flex w-full lg:w-[280px] xl:w-[320px] flex-col h-full overflow-hidden order-first">
           <ChatPanel 
             messages={messages} 
             players={players}
             inputMessage={inputMessage} 
             setInputMessage={setInputMessage} 
             onSend={handleSendMessage} 
           />
        </div>
      </div>

      {/* Mobile Chat Trigger & Bottom Actions */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-dark-bg/80 backdrop-blur-xl border-t border-white/5 flex items-center gap-3">
        <GlowButton 
          variant={isReady ? "blue" : "pink"} 
          onClick={toggleReady}
          disabled={isMatchStarted || isStarting}
          className={cn(
            "flex-1 h-12",
            (isMatchStarted || isStarting) && "opacity-50 grayscale cursor-not-allowed"
          )}
        >
          {isReady ? "آماده!" : "بزن روی آماده"}
        </GlowButton>
        <button 
          onClick={() => setIsChatOpen(true)}
          className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-neon-blue relative"
        >
          <MessageSquare size={20} />
          <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-neon-pink" />
        </button>
      </div>

      {/* Mobile Chat Drawer */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/80 z-[100] lg:hidden"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 h-[80vh] bg-[#0a0a0f] rounded-t-[40px] z-[101] lg:hidden border-t border-white/10 overflow-hidden flex flex-col"
            >
              <div className="h-1.5 w-12 bg-white/10 rounded-full mx-auto mt-4 mb-2" />
              <div className="flex-1 overflow-hidden">
                <ChatPanel 
                  messages={messages} 
                  players={players}
                  inputMessage={inputMessage} 
                  setInputMessage={setInputMessage} 
                  onSend={handleSendMessage} 
                  onClose={() => setIsChatOpen(false)}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer Controls (Fixed Desktop) */}
      <motion.footer 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="hidden lg:flex relative z-10 items-center justify-between gap-6 p-4 glass rounded-[40px] border-white/5 shadow-2xl mt-auto"
      >
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-4 px-8 border-l border-white/5">
             <GlowButton 
                variant={isReady ? "blue" : "pink"}
                onClick={toggleReady}
                disabled={isMatchStarted || isStarting}
                className={cn(
                  "px-8 h-12 text-xs",
                  isReady && "shadow-neon-blue/20",
                  (isMatchStarted || isStarting) && "opacity-50 grayscale cursor-not-allowed"
                )}
             >
               {isReady ? <Check size={18} className="ml-2" /> : null}
               {isReady ? "آماده" : "اعلام آمادگی"}
             </GlowButton>
           </div>
           
           <div className="flex items-center gap-4">
              <ControlButton icon={<Mic size={20} />} active />
              <ControlButton icon={<UserPlus size={20} />} onClick={() => setIsInviteModalOpen(true)} />
              <ControlButton icon={<Settings size={20} />} />
              <ControlButton icon={<RotateCcw size={20} />} />
           </div>
        </div>

        <button 
          onClick={() => navigate("/lobbies")}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl text-xs font-black uppercase text-neon-pink hover:bg-neon-pink/10 transition-all border border-transparent hover:border-neon-pink/20"
        >
          <LogOut size={18} className="ml-2" />
          خروج از لابی
        </button>
      </motion.footer>

      {/* MODALS */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <Modal title="دعوت دوستان" onClose={() => setIsInviteModalOpen(false)}>
            <div className="space-y-4">
               {["CyberWarrior", "Phantom_Sniper", "Saber", "DragonLord"].map((name, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-xl bg-neon-blue/20 flex items-center justify-center text-xl">👤</div>
                       <div>
                          <p className="text-sm font-black text-white">{name}</p>
                          <p className="text-[10px] text-gray-500 uppercase">آنلاین • در حال بازی</p>
                       </div>
                    </div>
                    <button className="px-4 py-2 rounded-xl bg-neon-blue text-dark-bg text-[10px] font-black uppercase hover:scale-105 transition-transform">Invite</button>
                 </div>
               ))}
            </div>
          </Modal>
        )}

        {activeProfileUserId && (
          <Modal title="پروفایل بازیکن" onClose={() => setActiveProfileUserId(null)}>
            <div className="flex flex-col items-center gap-6 py-4">
               <div className="h-32 w-32 rounded-[40px] bg-white/5 border border-white/10 flex items-center justify-center text-6xl shadow-2xl">
                 {players.find(p => p.id === activeProfileUserId)?.avatar || "👤"}
               </div>
               <div className="text-center">
                 <h3 className="text-2xl font-black text-white">{players.find(p => p.id === activeProfileUserId)?.name}</h3>
                 <p className="text-neon-blue text-sm font-black uppercase tracking-widest mt-1">Global Elite</p>
               </div>
               <div className="grid grid-cols-3 gap-4 w-full">
                  <StatCard label="بُردها" value="1,242" />
                  <StatCard label="K/D" value="1.42" />
                  <StatCard label="ساعت" value="3.5K" />
               </div>
               <GlowButton 
                variant="blue" 
                className="w-full h-12 flex items-center justify-center gap-2"
                onClick={() => window.open('/profile', '_blank')}
               >
                 <img src="/logo.png" className="h-5 w-auto" />
                 مشاهده پروفایل لوکس
               </GlowButton>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string, value: string }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
    <p className="text-[8px] font-black text-gray-500 uppercase mb-1">{label}</p>
    <p className="text-sm font-black text-white">{value}</p>
  </div>
);

const Modal = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    onClick={onClose}
  >
     <motion.div 
       initial={{ scale: 0.9, y: 20 }}
       animate={{ scale: 1, y: 0 }}
       exit={{ scale: 0.9, y: 20 }}
       onClick={(e) => e.stopPropagation()}
       className="w-full max-w-md bg-[#0a0a0f] rounded-[40px] border border-white/10 p-8 shadow-3xl relative overflow-hidden"
     >
        {/* Glow Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-neon-blue rounded-full blur-sm" />
        
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-xl font-black text-white uppercase tracking-tight">{title}</h2>
           <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-gray-500 hover:text-white transition-colors">
             <X size={20} />
           </button>
        </div>
        {children}
     </motion.div>
  </motion.div>
);

const ControlButton = ({ icon, active = false, onClick }: { icon: React.ReactNode, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "h-12 w-12 rounded-2xl flex items-center justify-center transition-all group",
      active ? "bg-white/10 text-white border border-white/10" : "bg-transparent text-gray-600 hover:text-white"
    )}
  >
    <div className="group-hover:scale-110 transition-transform">{icon}</div>
  </button>
);

const MatchInfoPanel = ({ isStarting, isMatchStarted, countdown, players, onCancel, onReopen }: { 
  isStarting: boolean, 
  isMatchStarted: boolean,
  countdown: number, 
  players: Player[],
  onCancel: () => void,
  onReopen: () => void
}) => {
  const activePlayers = players.filter(p => p.name !== "Empty Slot");
  const readyCount = activePlayers.filter(p => p.isReady).length;

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {isMatchStarted ? (
          <motion.div 
            key="started"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="bg-green-500/10 border border-green-500/30 rounded-[28px] p-6 flex items-center justify-between overflow-hidden shadow-[0_20px_50px_rgba(34,197,94,0.1)]"
          >
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                  <Play size={20} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white">در حال بازی کردن...</h3>
                  <p className="text-xs text-green-500 font-bold flex items-center gap-2">
                    <Lock size={12} /> لابی قفل شد و امکان ورود نیست.
                  </p>
               </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="px-5 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-500 text-[10px] font-black uppercase tracking-widest">
                   مدرج (LOBBY LOCKED)
                </div>
                <button 
                  onClick={onReopen}
                  className="px-5 py-2 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                >
                   باز کردن لابی
                </button>
            </div>
          </motion.div>
        ) : isStarting ? (
          <motion.div 
            key="starting"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-neon-blue/20 border border-neon-blue/40 rounded-[28px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden shadow-[0_20px_50px_rgba(0,229,255,0.1)]"
          >
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-full border-4 border-neon-blue border-t-white animate-spin" />
               <div>
                  <h3 className="text-xl font-black text-white">در حال شروع بازی...</h3>
                  <p className="text-xs text-neon-blue font-bold">بچه‌ها آماده باشید، سرور در حال پیکربندی است.</p>
               </div>
            </div>
            <div className="flex items-center gap-8">
               <span className="text-6xl font-black text-white tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{countdown}</span>
               <button 
                 onClick={onCancel}
                 className="text-[10px] font-black text-gray-400 hover:text-white underline uppercase tracking-widest transition-colors"
               >
                 لغو شروع
               </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 bg-white/5 py-4 rounded-[28px] border border-white/5"
          >
            <div className="flex items-center gap-4">
               <div className="relative">
                 <div className="h-3 w-3 rounded-full bg-neon-blue animate-pulse" />
                 <div className="absolute inset-0 h-3 w-3 rounded-full bg-neon-blue/50 animate-ping" />
               </div>
               <span className="text-xs font-black uppercase text-gray-400 tracking-widest">
                 {readyCount === activePlayers.length ? "همه بازیکنان آماده هستند!" : `در انتظار بازیکنان... (${readyCount}/${activePlayers.length})`}
               </span>
            </div>

            <div className="flex items-center gap-8">
               <div className="flex items-center gap-3">
                 <span className="text-[10px] font-black text-gray-600 uppercase">MAP</span>
                 <span className="text-xs font-bold text-white">Mirage</span>
               </div>
               <div className="flex items-center gap-3">
                 <span className="text-[10px] font-black text-gray-600 uppercase">MODE</span>
                 <span className="text-xs font-bold text-neon-blue">Competitive</span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PlayerCard = ({ player, isSelected, onSelect, onVolumeChange, onMute, onInvite, onProfile, onDirectMessage, onAddFriend, disabled }: { 
  player: Player, 
  isSelected: boolean,
  onSelect: () => void,
  onVolumeChange: (val: number) => void,
  onMute: (id: string) => void,
  onInvite: () => void,
  onProfile: (id: string) => void,
  onDirectMessage: (id: string) => void,
  onAddFriend: (id: string) => void,
  disabled?: boolean,
  key?: React.Key
}) => {
  const isSlot = player.name === "Empty Slot";

  return (
      <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={!isSlot ? { y: -8, transition: { duration: 0.2 } } : {}}
      onClick={!isSlot ? onSelect : () => onInvite()}
      className={cn(
        "relative p-4 rounded-[20px] border transition-all duration-300 backdrop-blur-md cursor-pointer group h-full flex flex-col justify-between min-w-0 min-h-[340px] w-full mx-auto",
        isSlot ? "border-dashed border-white/10 bg-transparent opacity-40 hover:opacity-100" : "bg-[#0a0a0f] border-white/10 shadow-2xl overflow-hidden",
        player.isReady && !isSlot && "scale-[1.02] ring-1 ring-neon-blue/40 border-neon-blue/30 shadow-[0_20px_40px_-5px_rgba(0,229,255,0.15)]",
        player.isSpeaking && "ring-2 ring-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]"
      )}
    >
      {!isSlot ? (
        <>
          <div className="flex-1 flex flex-col">
            {/* Rank & Ping */}
            <div className="mb-4 flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Trophy size={14} className="text-neon-pink" />
                 <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{player.rank}</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-gray-600 font-mono">{player.ping}ms</span>
                  <PingChart ping={player.ping} />
               </div>
            </div>

            <div className="flex flex-col items-center flex-1 justify-center">
              {/* Avatar & Volume Indicator */}
              <div className="relative mb-6">
                {/* Volume Level Ring */}
                <svg className="absolute -inset-4 w-36 h-36 -rotate-90 pointer-events-none opacity-20">
                  <circle 
                    cx="72" cy="72" r="64" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    className="text-gray-800"
                  />
                  <motion.circle 
                    cx="72" cy="72" r="64" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    strokeDasharray="402"
                    animate={{ strokeDashoffset: 402 - (402 * player.volume) / 100 }}
                    transition={{ type: "spring", bounce: 0 }}
                    className="text-neon-blue"
                  />
                </svg>

                <div className={cn(
                  "h-16 w-16 sm:h-20 sm:w-20 rounded-[20px] flex items-center justify-center text-2xl sm:text-3xl relative z-10 transition-all duration-500 shadow-2xl",
                  player.isReady ? "bg-white/10" : "bg-white/5",
                  player.isSpeaking ? "scale-105" : ""
                )}>
                  {player.avatar}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent rounded-[40px]" />
                  
                  {/* Voice Glow Overlay */}
                  {player.isSpeaking && (
                     <motion.div 
                       animate={{ opacity: [0.2, 0.4, 0.2] }} 
                       transition={{ duration: 1.5, repeat: Infinity }}
                       className="absolute -inset-2 bg-green-500 rounded-[44px] blur-xl -z-10" 
                     />
                  )}
                </div>

                {/* Ready Indicator */}
                <AnimatePresence>
                  {player.isReady && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -bottom-2 -left-2 h-8 w-8 rounded-2xl bg-neon-blue border-4 border-[#0a0a0f] flex items-center justify-center shadow-lg z-20"
                    >
                      <Check size={14} className="text-dark-bg" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Speaker Indicator */}
                {player.isSpeaking && (
                  <div className="absolute -top-1 -right-1 h-8 w-8 rounded-2xl bg-green-500 border-4 border-[#0a0a0f] flex items-center justify-center text-dark-bg z-20">
                     <Mic size={14} />
                  </div>
                )}
              </div>

              <h3 className="text-xl font-black text-white mb-2">{player.name}</h3>
              
              {/* Voice Status */}
              <div className="flex items-center gap-2 mb-4">
                 {player.isMuted ? (
                   <span className="text-[9px] text-neon-pink font-black uppercase flex items-center gap-1">
                     <MicOff size={10} /> Muted
                   </span>
                 ) : player.isSpeaking ? (
                   <span className="text-[9px] text-green-500 font-black uppercase flex items-center gap-1 animate-pulse">
                     <Mic size={10} /> Speaking...
                   </span>
                 ) : (
                   <span className="text-[9px] text-gray-500 font-black uppercase flex items-center gap-1">
                     <Mic size={10} /> IDLE
                   </span>
                 )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Volume Panel */}
          <div className="mt-auto pt-6 border-t border-white/5 space-y-6">
             {/* Dynamic Volume Bar */}
             <div className="space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center justify-between px-1">
                   <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">Volume</span>
                   <span className="text-[9px] font-bold text-white">{player.volume}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={player.volume} 
                  onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-neon-blue"
                />
             </div>

             <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-1 flex items-center justify-between shadow-xl" onClick={(e) => e.stopPropagation()}>
                <QuickAction icon={<Users size={14} />} tooltip="پروفایل" onClick={() => onProfile(player.id)} />
                <QuickAction icon={<MessageSquare size={14} />} tooltip="پیام" onClick={() => onDirectMessage(player.id)} />
                <QuickAction icon={<UserPlus size={14} />} tooltip="افزودن" onClick={() => onAddFriend(player.id)} />
                <QuickAction 
                  icon={player.isMuted ? <Mic size={14} /> : <MicOff size={14} />} 
                  tooltip={player.isMuted ? "آن‌میوت" : "میوت"} 
                  onClick={() => onMute(player.id)}
                  color={player.isMuted ? "blue" : "pink"}
                />
             </div>
          </div>

          {player.isHost && (
            <div className="absolute top-8 left-8 h-8 w-8 rounded-2xl bg-neon-pink/10 border border-neon-pink/20 flex items-center justify-center text-neon-pink shadow-[0_0_15px_rgba(255,69,143,0.2)]">
               <Crown size={14} />
            </div>
          )}
        </>
      ) : (
        <div className="h-full flex flex-col items-center justify-center py-6 min-h-[300px]">
          <div className="h-20 w-20 rounded-[32px] border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 mb-6 group-hover:border-white/30 transition-all duration-300 group-hover:scale-110">
            <UserPlus size={40} />
          </div>
          <span className="text-[11px] font-black uppercase text-gray-600 tracking-widest group-hover:text-white transition-colors">دعوت بازیکن</span>
        </div>
      )}
    </motion.div>
  );
};

const QuickAction = ({ icon, tooltip, color = "blue", onClick }: { icon: React.ReactNode, tooltip: string, color?: "blue" | "pink", onClick?: () => void }) => (
  <div className="relative group/btn cursor-pointer" onClick={onClick}>
    <div className={cn(
      "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
      color === "blue" ? "bg-white/5 text-gray-400 hover:bg-neon-blue hover:text-dark-bg" : "bg-white/5 text-gray-400 hover:bg-neon-pink hover:text-dark-bg"
    )}>
       {icon}
    </div>
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 rounded text-[8px] font-black text-white whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
      {tooltip}
    </div>
  </div>
);

const PingChart = ({ ping }: { ping: number }) => {
  const bars = [1, 2, 3];
  const color = ping < 30 ? "bg-green-500" : ping < 60 ? "bg-yellow-500" : "bg-red-500";
  const activeCount = ping < 30 ? 3 : ping < 60 ? 2 : 1;

  return (
    <div className="flex items-end gap-0.5 h-3">
      {bars.map((i) => (
        <div 
          key={i} 
          className={cn(
            "w-0.5 rounded-sm transition-colors",
            i <= activeCount ? color : "bg-white/10",
            i === 1 ? "h-1" : i === 2 ? "h-2" : "h-3"
          )} 
        />
      ))}
    </div>
  );
};

const ChatPanel = ({ messages, players, inputMessage, setInputMessage, onSend, onClose }: { 
  messages: Message[], 
  players: Player[],
  inputMessage: string, 
  setInputMessage: (v: string) => void,
  onSend: (e: React.FormEvent) => void,
  onClose?: () => void
}) => {
  const filteredMessages = messages.filter(msg => !msg.toUserId || msg.isSystem);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0d14]/40 backdrop-blur-xl border-l md:border-r border-white/5">
      <div className="flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.8)]" />
             <h2 className="text-xs font-black uppercase tracking-widest text-white">Lobby Comms</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-500 hover:text-white">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {filteredMessages.map((msg) => (
          <div key={msg.id} className={cn(
            "group flex flex-col gap-1.5", 
            msg.isSystem ? "items-center my-4" : msg.user === "You" ? "items-end" : "items-start"
          )}>
            {msg.isSystem ? (
              <div className="relative w-full flex items-center justify-center p-3 rounded-2xl border border-neon-blue/10 bg-neon-blue/[0.02]">
                 <span className="text-[10px] font-black text-neon-blue uppercase tracking-widest text-center px-4">
                  {msg.text}
                 </span>
              </div>
            ) : (
              <div className={cn(
                "flex items-start gap-3 max-w-[85%]",
                msg.user === "You" ? "flex-row-reverse" : "flex-row"
              )}>
                <div className="h-8 w-8 rounded-xl bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center text-lg mt-1">
                   {msg.user === "NeonGhost" ? "🥷" : msg.user === "Apex_Hunter" ? "👨‍🎤" : msg.user === "You" ? "👨‍🎤" : "👧"}
                </div>
                <div className={cn("flex-1 space-y-1", msg.user === "You" ? "text-left" : "text-right")}>
                  <div className={cn("flex items-center gap-3", msg.user === "You" ? "flex-row-reverse" : "flex-row")}>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      msg.user === "You" ? "text-neon-pink" : "text-neon-blue"
                    )}>{msg.user === "You" ? "شما" : msg.user}</span>
                    <span className="text-[8px] font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">{msg.time}</span>
                  </div>
                  <div className={cn(
                    "border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-gray-300 leading-relaxed shadow-lg",
                    msg.user === "You" ? "bg-neon-pink/5 rounded-tl-none border-neon-pink/10" : "bg-white/5 rounded-tr-none"
                  )}>
                    {msg.text}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={onSend} className="p-6 bg-black/20 border-t border-white/5">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-1 pr-4 focus-within:border-neon-blue/50 transition-all relative">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="چیزی بنویسید..."
            className="flex-1 bg-transparent py-4 text-xs text-white placeholder:text-gray-700 focus:outline-none font-medium pr-2"
          />
          <button 
            type="submit"
            className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-neon-blue text-dark-bg hover:bg-neon-blue/90 transition-colors shadow-lg shadow-neon-blue/20"
          >
            <Send size={18} className="translate-y-[1px] translate-x-[1px]" />
          </button>
        </div>
      </form>
    </div>
  );
};
