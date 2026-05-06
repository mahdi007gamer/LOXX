import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useLobby } from "../context/LobbyContext";
import { useAuth } from "../context/AuthContext";
import { useWebRTC } from "../hooks/useWebRTC";
import { chatSocket, lobbySocket, voiceSocket } from "../lib/socket";
import { toast } from "react-hot-toast";
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
    joinLobby,
    leaveLobby,
    toggleReady,
    setLobbyMuted,
    sendMessage,
    updateLobbySettings
  } = useLobby();
  const { user } = useAuth();
  const { openChat, addFriend } = useFriends();
  
  const [copied, setCopied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeProfileUserId, setActiveProfileUserId] = useState<string | null>(null);

  const [wasInLobby, setWasInLobby] = useState(false);

  // Join lobby on mount
  useEffect(() => {
    if (id) {
       joinLobby(id);
    }
  }, [id]);

  // Redirect if lobby becomes null (e.g., closed by host)
  const [countdown, setCountdown] = useState(5);
  const [localVolume, setLocalVolume] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  // Voice Settings
  const [voiceMode, setVoiceMode] = useState<"activation" | "ptt">("activation");
  const [pttKey, setPttKey] = useState<string>("v");
  const [isPttPressed, setIsPttPressed] = useState(false);
  const [isListeningForKey, setIsListeningForKey] = useState(false);

  useEffect(() => {
    if (lobby) setWasInLobby(true);
    if (wasInLobby && !lobby && id) {
       navigate("/lobbies");
    }
  }, [lobby, wasInLobby, id, navigate]);

  const [peerVolumes, setPeerVolumes] = useState<Record<string, number>>({});
  const [peerActivity, setPeerActivity] = useState<Record<string, number>>({});

  const handlePeerVolumeChange = useCallback((peerUserId: string, vol: number) => {
    setPeerActivity(prev => {
      if (prev[peerUserId] === vol) return prev;
      // Only update if difference is significant to throttle re-renders
      if (Math.abs((prev[peerUserId] || 0) - vol) < 15 && vol !== 0) return prev;
      return { ...prev, [peerUserId]: vol };
    });
  }, []);

  const players = useMemo(() => {
    const list = lobby?.players?.map(p => ({
      id: p.userId,
      name: p.username || "Guest Player",
      avatar: p.role === "HOST" ? "👑" : "👤",
      rank: "Verified Gamer",
      isHost: p.role === "HOST",
      isReady: !!p.isReady,
      hasMic: true,
      isMuted: !!p.micMuted,
      ping: 25,
      isSpeaking: p.userId === user?.id 
        ? localVolume > 15 
        : (peerActivity[p.userId] || 0) > 15 || (lobby?.talkingUsers?.includes(p.userId) || false),
      volume: p.userId === user?.id 
        ? localVolume 
        : (peerVolumes[p.userId] !== undefined ? peerVolumes[p.userId] : 100),
      activity: p.userId === user?.id ? localVolume : (peerActivity[p.userId] || 0)
    })) || [];

    // Add empty slots
    const maxPlayers = lobby?.maxPlayers || 5;
    const result = [...list];
    while (result.length < maxPlayers) {
      result.push({
        id: `slot-${result.length}`,
        name: "Empty Slot",
        avatar: "",
        rank: "",
        isReady: false,
        hasMic: false,
        isMuted: false,
        ping: 0,
        isSpeaking: false,
        volume: 100
      });
    }
    return result;
  }, [lobby?.players, lobby?.maxPlayers, localVolume, peerActivity, lobby?.talkingUsers, peerVolumes, user?.id, user?.username]);

  const isReady = lobby?.players?.find(p => p.userId === user?.id)?.isReady || false;
  const isMicMuted = !!(lobby?.players?.find(p => p.userId === user?.id) as any)?.micMuted;
  const isHost = lobby?.hostId === user?.id;
  
  const isStarting = lobby?.status === "STARTING";
  const isMatchStarted = lobby?.status === "IN_PROGRESS";
  
  // Calculate if all current active players are ready
  const activePlayersList = lobby?.players || [];
  const activePlayersCount = activePlayersList.length;
  const readyCountValue = activePlayersList.filter(p => p.isReady).length;
  // Use backend status if available, fallback to dynamic check
  const allReadyPulse = lobby?.status === "READY" || (activePlayersCount > 1 && readyCountValue === activePlayersCount);


  useEffect(() => {
    let audioContext: AudioContext;
    let analyzer: AnalyserNode;
    let microphone: MediaStreamAudioSourceNode;
    let stream: MediaStream;
    let rafId: number;
    let isTalking = false;
    let lastVol = 0;

    if (lobby && user) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(str => {
          stream = str;
          setLocalStream(str);

          audioContext = new AudioContext();
          analyzer = audioContext.createAnalyser();
          microphone = audioContext.createMediaStreamSource(stream);
          microphone.connect(analyzer);
          
          analyzer.fftSize = 256;
          const bufferLength = analyzer.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const analyzeVoice = () => {
             if (stream.getAudioTracks()[0]?.enabled) {
               analyzer.getByteFrequencyData(dataArray);
               let sum = 0;
               for(let i = 0; i < bufferLength; i++) {
                 sum += dataArray[i];
               }
               const avg = sum / bufferLength;
               const newVol = Math.min(100, Math.round(avg * 2));
               
               // Only update local state if change is very significant
               if (Math.abs(newVol - lastVol) > 20 || (newVol === 0 && lastVol !== 0)) {
                 lastVol = newVol;
                 setLocalVolume(newVol);
               }

               const talkingNow = avg > 20; 
               if (talkingNow !== isTalking) {
                 isTalking = talkingNow;
                 voiceSocket.emit("voice.talking", { roomId: lobby.id, isTalking });
               }
             } else {
               if (lastVol !== 0) {
                 lastVol = 0;
                 setLocalVolume(0);
               }
               if (isTalking) {
                 isTalking = false;
                 voiceSocket.emit("voice.talking", { roomId: lobby.id, isTalking: false });
               }
             }
             rafId = requestAnimationFrame(analyzeVoice);
          };
          analyzeVoice();
        })
        .catch(err => {
          console.error("Mic access denied", err);
          toast.error("دسترسی به میکروفون داده نشد");
          setLobbyMuted(true);
        });
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioContext && audioContext.state !== "closed") audioContext.close();
      setLocalVolume(0);
      setLocalStream(null);
    };
  }, [lobby?.id, user?.id]);

  useEffect(() => {
    if (localStream && localStream.getAudioTracks().length > 0) {
      if (isMicMuted) {
        localStream.getAudioTracks()[0].enabled = false;
      } else if (voiceMode === "ptt") {
        localStream.getAudioTracks()[0].enabled = isPttPressed;
      } else {
        localStream.getAudioTracks()[0].enabled = true;
      }
    }
  }, [isMicMuted, localStream, voiceMode, isPttPressed]);

  useEffect(() => {
    if (voiceMode !== "ptt") return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === pttKey.toLowerCase()) {
        if (!isPttPressed) setIsPttPressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === pttKey.toLowerCase()) {
        setIsPttPressed(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [voiceMode, pttKey, isPttPressed]);

  const { remoteStreams } = useWebRTC(lobby?.id || null, localStream, user?.id);

  const toggleMic = () => {
    if (lobby) {
      setLobbyMuted(!isMicMuted);
    }
  };

  const messages = useMemo(() => {
    return [
      { id: "system-1", user: "LOXX BOT", text: "لابی ساخته شد. منتظر همرزمان هستیم...", time: "System", isSystem: true, fromUserId: "system" },
      ...(lobby?.messages?.map(m => ({
        id: m.id,
        fromUserId: m.from?.userId,
        user: m.from?.username || "بازیکن",
        text: m.content,
        time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"
      })) || [])
    ];
  }, [lobby?.messages]);

  const [inputMessage, setInputMessage] = useState("");

  const handleCopyCode = () => {
    navigator.clipboard.writeText(lobby?.id || "LX-LOBBY");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !id) return;
    
    sendMessage(inputMessage);
    setInputMessage("");
  };

  const onToggleReady = () => {
    toggleReady(); // This already emits "lobby.ready" in LobbyContext
  };

  const handleStartMatch = () => {
    if (isHost) {
      lobbySocket.emit("lobby.start", { lobbyId: lobby?.id });
    }
  };

  const handleCancelMatch = () => {
    if (isHost) {
      lobbySocket.emit("cancel_match", { lobbyId: lobby?.id });
    }
  };

  const handleReopenLobby = () => {
    if (isHost) {
      lobbySocket.emit("reopen_lobby", { lobbyId: lobby?.id });
    }
  };
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isStarting && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && isStarting) {
      if (isHost) {
        lobbySocket.emit("start_match_confirm", { lobbyId: lobby?.id });
      }
    }
    return () => clearTimeout(timer);
  }, [isStarting, countdown, isHost, lobby?.id]);

  useEffect(() => {
    if (!isStarting) {
      setCountdown(5);
    }
  }, [isStarting]);

  const handlePlayerVolume = (id: string, vol: number) => {
    // Local volume state if needed
  };

  const { friends } = useFriends();

  return (
    <div className="h-[calc(100vh-64px)] bg-[#050508] text-white p-2 md:p-6 lg:p-8 flex flex-col gap-4 md:gap-6 relative overflow-hidden font-sans" dir="rtl">
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
        className="relative z-10 glass rounded-[24px] md:rounded-[32px] p-3 md:p-6 flex flex-wrap items-center justify-between gap-3 md:gap-6 border-white/5 shadow-2xl shrink-0"
      >
        <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
           <button 
            onClick={() => {
              leaveLobby();
              navigate("/lobbies");
            }}
            className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-white/5 hover:bg-neon-pink/10 transition-colors text-gray-400 hover:text-neon-pink shrink-0"
           >
             <ChevronLeft size={18} className="md:size-5 rotate-180" />
           </button>
           
           <div className="min-w-0 flex-1">
             <div className="flex items-center gap-2 md:gap-3 mb-0.5 md:mb-1">
               <h1 className="text-sm md:text-3xl font-black tracking-tight text-white truncate max-w-[150px] md:max-w-none">
                 {lobby ? (lobby.title || "Elite Lobby") : "در حال بارگذاری..."}
               </h1>
               <div className="px-1.5 md:px-3 py-0.5 md:py-1 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-[7px] md:text-[10px] font-black text-neon-blue uppercase tracking-tighter shrink-0">
                 ME
               </div>
             </div>
             <div className="flex items-center gap-3 md:gap-5 text-[9px] md:text-[11px] text-gray-500 font-black uppercase tracking-widest">
               <span className="flex items-center gap-1 md:gap-1.5"><Users size={10} md:size={12} className="text-neon-blue shrink-0" /> {players.filter(p => p.name !== "Empty Slot").length} / 5</span>
               <span className="flex items-center gap-1 md:gap-1.5"><Trophy size={11} md:size={13} className="text-neon-pink shrink-0" /> حرفه‌ای</span>
             </div>
           </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-2 bg-black/60 rounded-2xl p-1 border border-white/10">
             <div className="px-4 py-2 text-[10px] font-black text-gray-500 border-l border-white/10 uppercase tracking-widest">کد لابی</div>
             <div className="px-4 py-2 font-mono text-sm text-neon-blue flex items-center gap-3">
               {lobby?.id ? lobby.id.substring(0, 8).toUpperCase() : "LX-LOBBY"}
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
              "px-4 md:px-10 h-10 md:h-14 text-[10px] md:text-sm shadow-xl shrink-0 uppercase italic font-black",
              (!allReadyPulse || isMatchStarted) && "opacity-50 grayscale cursor-not-allowed"
            )}
          >
            <Play size={14} md:size={20} className="ml-1.5 md:ml-2" />
            شروع
          </GlowButton>
        </div>
      </motion.header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 relative z-10 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-4 md:gap-6 overflow-y-auto overflow-x-hidden custom-scrollbar pb-24 md:pb-8 px-1 md:px-4">
          
          {/* Remote Audio Streams */}
          {Array.from(remoteStreams.entries()).map(([peerUserId, stream]) => (
            <RemoteAudioPlayer 
              key={peerUserId}
              stream={stream}
              volumeLevel={peerVolumes[peerUserId] !== undefined ? peerVolumes[peerUserId] : 100}
              onVolumeChange={(vol) => handlePeerVolumeChange(peerUserId, vol)}
            />
          ))}

          {/* Top Status Panel */}
          <MatchInfoPanel 
            isStarting={isStarting} 
            isMatchStarted={isMatchStarted} 
            countdown={countdown} 
            players={players} 
            lobby={lobby}
            onCancel={handleCancelMatch}
            onReopen={handleReopenLobby}
          />

          {/* Players Grid - Drastically improved for mobile */}
          <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-6 px-1">
            <AnimatePresence mode="popLayout">
              {players.map((player) => (
                <PlayerCard 
                  key={player.id} 
                  player={player} 
                  isSelected={selectedPlayer === player.id}
                  onSelect={() => setSelectedPlayer(selectedPlayer === player.id ? null : player.id)}
                  onVolumeChange={(val) => handlePlayerVolume(player.id, val)}
                  onMute={(id) => {
                    const p = players.find(player => player.id === id);
                    if (p && !p.id.startsWith("slot-")) {
                      // We don't have a specific contextual mute function, but we can set their volume to 0 locally
                      handlePlayerVolume(id, p.volume === 0 ? 100 : 0);
                    }
                  }}
                  onInvite={() => setIsInviteModalOpen(true)}
                  onProfile={(id) => setActiveProfileUserId(id)}
                  onDirectMessage={(id) => {
                    const p = players.find(player => player.id === id);
                    if (p && !p.id.startsWith("slot-")) {
                      openChat(id, p.name);
                    }
                  }}
                  onAddFriend={(id) => {
                    const p = players.find(player => player.id === id);
                    if (p && !p.id.startsWith("slot-")) {
                      addFriend(p.name);
                    }
                  }}
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
             currentUserId={user?.id}
           />
        </div>
      </div>

      {/* Mobile Chat Trigger & Bottom Actions - Fixed and Styled */}
      <div className="lg:hidden fixed bottom-20 left-4 right-4 z-50 p-2 glass rounded-[24px] border border-white/10 flex items-center justify-between gap-2 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={() => {
              leaveLobby();
              navigate("/lobbies");
            }}
            className="h-10 w-10 rounded-xl bg-neon-pink/10 text-neon-pink flex items-center justify-center border border-neon-pink/20"
            title="خروج"
          >
            <LogOut size={18} />
          </button>
          <button 
            onClick={() => setIsChatOpen(true)}
            className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-neon-blue relative border border-white/10"
          >
            <MessageSquare size={18} />
            <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-neon-pink" />
          </button>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none px-1 py-1">
           <ControlButton icon={isMicMuted ? <MicOff size={18} /> : <Mic size={18} />} active={!isMicMuted} onClick={toggleMic} className="h-10 w-10 rounded-xl shrink-0" />
           <ControlButton icon={<UserPlus size={18} />} onClick={() => setIsInviteModalOpen(true)} className="h-10 w-10 rounded-xl shrink-0" />
           <ControlButton icon={<Settings size={18} />} className="h-10 w-10 rounded-xl shrink-0" />
        </div>

        <GlowButton 
          variant={isReady ? "blue" : "pink"} 
          onClick={onToggleReady}
          disabled={isMatchStarted || isStarting}
          className={cn(
            "h-10 px-3 min-w-[70px] text-[9px] uppercase font-black italic rounded-xl shrink-0",
            (isMatchStarted || isStarting) && "opacity-50 grayscale cursor-not-allowed"
          )}
        >
          {isReady ? "آماده" : "GO"}
        </GlowButton>
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
                  currentUserId={user?.id}
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
                onClick={onToggleReady}
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
              <ControlButton icon={isMicMuted ? <MicOff size={20} /> : <Mic size={20} />} active={!isMicMuted} onClick={toggleMic} />
              <ControlButton icon={<UserPlus size={20} />} onClick={() => setIsInviteModalOpen(true)} />
              <ControlButton icon={<Settings size={20} />} onClick={() => setIsSettingsModalOpen(true)} />
           </div>
        </div>

        <button 
          onClick={() => {
            leaveLobby();
            navigate("/lobbies");
          }}
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
               {friends.length > 0 ? friends.map((friend, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-xl bg-neon-blue/20 flex items-center justify-center text-xl">👤</div>
                       <div>
                          <p className="text-sm font-black text-white">{friend.username}</p>
                          <p className="text-[10px] text-gray-500 uppercase">{friend.status} • {friend.activity}</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => {
                        lobbySocket.emit("invite_player", { lobbyId: lobby?.id, targetUserId: friend.id });
                        toast.success(`دعوت برای ${friend.username} ارسال شد`);
                      }}
                      className="px-4 py-2 rounded-xl bg-neon-blue text-dark-bg text-[10px] font-black uppercase hover:scale-105 transition-transform"
                    >
                       Invite
                    </button>
                 </div>
               )) : (
                 <div className="text-center py-10 opacity-50">
                    <p className="text-sm">لیست دوستان خالی است</p>
                 </div>
               )}
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

        {isSettingsModalOpen && (
          <Modal title="تنظیمات لابی" onClose={() => setIsSettingsModalOpen(false)}>
            <div className="space-y-6">
              {/* Host specific settings */}
              {isHost ? (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-neon-blue uppercase tracking-widest border-b border-white/10 pb-2">تنظیمات اصلی لابی</h4>
                  
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
                    <div>
                      <p className="text-sm font-black text-white">لابی خصوصی</p>
                      <p className="text-[10px] text-gray-500 font-bold">فقط با کد دعوت یا لینک</p>
                    </div>
                    <div 
                      onClick={() => updateLobbySettings({ isPrivate: !lobby?.isPrivate })}
                      className={cn(
                        "w-12 h-6 rounded-full relative cursor-pointer border transition-colors",
                         lobby?.isPrivate ? "bg-neon-blue/20 border-neon-blue/30" : "bg-white/5 border-white/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 h-4 w-4 rounded-full transition-all",
                        lobby?.isPrivate ? "right-1 bg-neon-blue shadow-[0_0_10px_rgba(0,229,255,1)]" : "right-7 bg-gray-500"
                      )} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
                    <div>
                      <p className="text-sm font-black text-white">دسترسی میکروفون</p>
                      <p className="text-[10px] text-gray-500 font-bold">بازیکنان برای چت صوتی نیاز به میکروفون دارند</p>
                    </div>
                    <div 
                      onClick={() => updateLobbySettings({ micRequired: !lobby?.micRequired })}
                      className={cn(
                        "w-12 h-6 rounded-full relative cursor-pointer border transition-colors",
                         lobby?.micRequired ? "bg-neon-blue/20 border-neon-blue/30" : "bg-white/5 border-white/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 h-4 w-4 rounded-full transition-all",
                        lobby?.micRequired ? "right-1 bg-neon-blue shadow-[0_0_10px_rgba(0,229,255,1)]" : "right-7 bg-gray-500"
                      )} />
                    </div>
                  </div>
                </div>
              ) : null}

              {/* General User settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-neon-pink uppercase tracking-widest border-b border-white/10 pb-2">تنظیمات صوتی بازیکن</h4>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400">حالت صحبت (Voice Mode)</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setVoiceMode("activation")}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-black transition",
                        voiceMode === "activation" 
                          ? "bg-neon-pink/10 border border-neon-pink/20 text-neon-pink" 
                          : "bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10"
                      )}
                    >
                      Voice Activation
                    </button>
                    <button 
                      onClick={() => setVoiceMode("ptt")}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-black transition",
                        voiceMode === "ptt" 
                          ? "bg-neon-pink/10 border border-neon-pink/20 text-neon-pink" 
                          : "bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10"
                      )}
                    >
                      Push to Talk
                    </button>
                  </div>
                </div>
                
                <div className={cn("space-y-2 transition-opacity", voiceMode !== "ptt" && "opacity-50 pointer-events-none")}>
                  <label className="text-xs font-black text-gray-400 flex items-center justify-between">
                    کلید Push to Talk
                    <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-white font-mono uppercase">{pttKey}</span>
                  </label>
                  <button 
                    onClick={() => {
                        setIsListeningForKey(true);
                    }}
                    onKeyDown={(e) => {
                        if (isListeningForKey) {
                            e.preventDefault();
                            if (e.key !== "Escape") {
                                setPttKey(e.key);
                            }
                            setIsListeningForKey(false);
                        }
                    }}
                    onBlur={() => setIsListeningForKey(false)}
                    className={cn(
                       "w-full py-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 text-xs font-black text-left pl-4 focus:outline-none transition-colors",
                       isListeningForKey && "border-neon-pink text-neon-pink"
                    )}
                  >
                     {isListeningForKey ? "Press any key..." : "Click to set keybinding..."}
                  </button>
                </div>
              </div>
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

const RemoteAudioPlayer = ({ stream, onVolumeChange, volumeLevel }: { stream: MediaStream, onVolumeChange: (vol: number) => void, volumeLevel: number }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    if (audioRef.current && stream) {
      console.log("RemoteAudioPlayer: attaching stream", stream.id);
      audioRef.current.srcObject = stream;
      audioRef.current.play()
        .then(() => { 
          console.log("RemoteAudioPlayer: playing success");
        })
        .catch(e => {
          if (e.name !== "AbortError") {
            console.error("Audio play failed:", e);
          }
        });
    }
  }, [stream]);

  // Handle local user volume adjustment for this specific remote peer
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volumeLevel / 100;
    }
  }, [volumeLevel]);

  useEffect(() => {
    let audioContext: AudioContext;
    let analyzer: AnalyserNode;
    let microphone: MediaStreamAudioSourceNode;
    let rafId: number;

    if (stream && stream.getAudioTracks().length > 0) {
      try {
        audioContext = new AudioContext();
        analyzer = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyzer);
        
        analyzer.fftSize = 256;
        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let lastVol = 0;
        const analyzeVoice = () => {
           if (stream.getAudioTracks()[0].enabled) {
             analyzer.getByteFrequencyData(dataArray);
             let sum = 0;
             for(let i = 0; i < bufferLength; i++) {
               sum += dataArray[i];
             }
             const avg = sum / bufferLength;
             const currentVol = Math.min(100, Math.round(avg * 2.5));
             
             // Only report significant changes to parent state to avoid re-render loops
             // Increased threshold to 25 and added absolute check for 0
             if (Math.abs(currentVol - lastVol) > 25 || (currentVol === 0 && lastVol !== 0) || (currentVol > 10 && lastVol === 0)) {
               lastVol = currentVol;
               onVolumeChange(currentVol);
             }
           } else if (lastVol !== 0) {
             lastVol = 0;
             onVolumeChange(0);
           }
           rafId = requestAnimationFrame(analyzeVoice);
        };
        analyzeVoice();
      } catch (e) {
        console.error("Voice analysis setup failed", e);
      }
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (audioContext && audioContext.state !== "closed") audioContext.close();
      onVolumeChange(0);
    };
  }, [stream, onVolumeChange]);

  return <audio ref={audioRef} autoPlay playsInline className="hidden" />;
};

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

const ControlButton = ({ icon, active = false, onClick, className }: { icon: React.ReactNode, active?: boolean, onClick?: () => void, className?: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "h-12 w-12 rounded-2xl flex items-center justify-center transition-all group",
      active ? "bg-white/10 text-white border border-white/10" : "bg-transparent text-gray-600 hover:text-white",
      className
    )}
  >
    <div className="group-hover:scale-110 transition-transform">{icon}</div>
  </button>
);

const MatchInfoPanel = ({ isStarting, isMatchStarted, countdown, players, lobby, onCancel, onReopen }: { 
  isStarting: boolean, 
  isMatchStarted: boolean,
  countdown: number, 
  players: Player[],
  lobby: any,
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
                 <span className="text-xs font-bold text-white max-w-[80px] truncate">
                  {(() => {
                    if (!lobby?.selectedMaps) return "Any";
                    try {
                      const parsed = JSON.parse(lobby.selectedMaps);
                      return Array.isArray(parsed) ? parsed.join(', ') : String(parsed);
                    } catch (e) {
                      return lobby.selectedMaps;
                    }
                  })()}
                </span>
               </div>
               <div className="flex items-center gap-3">
                 <span className="text-[10px] font-black text-gray-600 uppercase">MODE</span>
                 <span className="text-xs font-bold text-neon-blue">{lobby?.mode || "Competitive"}</span>
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
        "relative p-3 md:p-6 rounded-[24px] md:rounded-[32px] border transition-all duration-300 backdrop-blur-md cursor-pointer group h-full flex flex-col justify-between min-w-0 min-h-[220px] md:min-h-[360px] w-full",
        isSlot ? "border-dashed border-white/10 bg-transparent opacity-40 hover:opacity-100" : "bg-[#0a0a0f] border-white/10 shadow-2xl overflow-hidden",
        player.isReady && !isSlot && "scale-[1.02] ring-1 ring-neon-blue/40 border-neon-blue/30 shadow-[0_20px_40px_-5px_rgba(0,229,255,0.15)]",
        player.isSpeaking && "ring-2 ring-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]"
      )}
    >
      {!isSlot ? (
        <>
          <div className="flex-1 flex flex-col">
            {/* Rank & Ping */}
            <div className="mb-2 md:mb-4 flex items-center justify-between">
               <div className="flex items-center gap-1.5 md:gap-2">
                 <Trophy size={10} className="md:size-[14px] text-neon-pink shrink-0" />
                 <span className="text-[7px] md:text-[9px] font-black text-gray-500 uppercase tracking-widest truncate max-w-[50px] md:max-w-none">{player.rank}</span>
               </div>
               <div className="flex items-center gap-1 md:gap-1.5">
                  <span className="text-[7px] md:text-[9px] font-bold text-gray-600 font-mono shrink-0">{player.ping}ms</span>
                  <PingChart ping={player.ping} />
               </div>
            </div>

            <div className="flex flex-col items-center flex-1 justify-center py-2 md:py-4">
              {/* Avatar & Volume Indicator */}
              <div className="relative flex items-center justify-center h-16 w-16 sm:h-28 sm:w-28 md:h-32 md:w-32 mb-3 md:mb-6">
                {/* Volume Level Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none opacity-20">
                  <circle 
                    cx="50%" cy="50%" r="46%" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    className="text-gray-800"
                  />
                  <motion.circle 
                    cx="50%" cy="50%" r="46%" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    className="text-neon-blue"
                    style={{ strokeDasharray: "290" }}
                    initial={{ strokeDashoffset: 290 }}
                    animate={{ strokeDashoffset: 290 - (290 * (player.volume || 100)) / 100 }}
                    transition={{ type: "spring", bounce: 0 }}
                  />
                </svg>

                <div className={cn(
                  "h-10 w-10 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-[18px] md:rounded-[28px] flex items-center justify-center text-xl md:text-3xl relative z-10 transition-all duration-500 shadow-2xl",
                  player.isReady ? "bg-white/10" : "bg-white/5",
                  player.isSpeaking ? "scale-105" : ""
                )}>
                  <span className="relative z-10">{player.avatar}</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent rounded-[18px] md:rounded-[28px]" />
                  
                  {/* Voice Glow Overlay */}
                  {player.isSpeaking && (
                     <motion.div 
                       animate={{ opacity: [0.2, 0.4, 0.2] }} 
                       transition={{ duration: 1.5, repeat: Infinity }}
                       className="absolute -inset-1 md:-inset-2 bg-green-500 rounded-[24px] md:rounded-[32px] blur-lg md:blur-xl -z-10" 
                     />
                  )}
                </div>

                {/* Ready Indicator */}
                <AnimatePresence>
                  {player.isReady && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -bottom-1 -left-1 md:-bottom-2 md:-left-2 h-6 w-6 md:h-8 md:w-8 rounded-lg md:rounded-2xl bg-neon-blue border-2 md:border-4 border-[#0a0a0f] flex items-center justify-center shadow-lg z-20"
                    >
                      <Check size={10} className="md:size-[14px] text-dark-bg" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Speaker Indicator */}
                {player.isSpeaking && (
                  <div className="absolute -top-1 -right-1 h-6 w-6 md:h-8 md:w-8 rounded-lg md:rounded-2xl bg-green-500 border-2 md:border-4 border-[#0a0a0f] flex items-center justify-center text-dark-bg z-20">
                     <Mic size={10} className="md:size-[14px]" />
                  </div>
                )}
              </div>

              <h3 className="text-xs md:text-xl font-black text-white mb-0.5 md:mb-2 truncate max-w-full">{player.name}</h3>
              
              {/* Voice Status */}
              <div className="flex items-center gap-1 md:gap-2 mb-2 md:mb-4">
                 {player.isMuted ? (
                   <span className="text-[6px] md:text-[9px] text-neon-pink font-black uppercase flex items-center gap-0.5 md:gap-1">
                     <MicOff size={8} className="md:size-[10px]" /> Muted
                   </span>
                 ) : player.isSpeaking ? (
                   <span className="text-[6px] md:text-[9px] text-green-500 font-black uppercase flex items-center gap-0.5 md:gap-1 animate-pulse">
                     <Mic size={8} className="md:size-[10px]" /> Speaking
                   </span>
                 ) : (
                   <span className="text-[6px] md:text-[9px] text-gray-600 font-black uppercase flex items-center gap-0.5 md:gap-1 text-[7px]">
                     <Mic size={8} className="md:size-[10px]" /> IDLE
                   </span>
                 )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Volume Panel */}
          <div className="mt-auto pt-2 md:pt-6 border-t border-white/5 space-y-2 md:space-y-6">
             {/* Dynamic Volume Bar */}
             <div className="space-y-1 md:space-y-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center justify-between px-0.5 md:px-1">
                   <span className="text-[6px] md:text-[8px] font-black text-gray-700 uppercase tracking-tighter">Volume</span>
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

const ChatPanel = ({ messages, players, inputMessage, setInputMessage, onSend, onClose, currentUserId }: { 
  messages: Message[], 
  players: Player[],
  inputMessage: string, 
  setInputMessage: (v: string) => void,
  onSend: (e: React.FormEvent) => void,
  onClose?: () => void,
  currentUserId?: string
}) => {
  const filteredMessages = messages.filter(msg => !msg.toUserId || msg.isSystem);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [filteredMessages.length]);

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

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {filteredMessages.map((msg, index) => {
          const isYou = msg.fromUserId === currentUserId && currentUserId !== undefined;
          return (
          <div key={`${msg.id}-${index}`} className={cn(
            "group flex flex-col gap-1.5", 
            msg.isSystem ? "items-center my-4" : isYou ? "items-start" : "items-end"
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
                isYou ? "flex-row" : "flex-row-reverse"
              )}>
                <div className="h-8 w-8 rounded-xl bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center text-lg mt-1 font-black uppercase">
                   {isYou ? "ME" : msg.user.charAt(0)}
                </div>
                <div className={cn("flex-1 space-y-1", isYou ? "text-right" : "text-left")}>
                  <div className={cn("flex items-center gap-3", isYou ? "flex-row" : "flex-row-reverse")}>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]",
                      isYou ? "text-neon-pink" : "text-neon-blue"
                    )}>{msg.user}</span>
                    <span className="text-[8px] font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">{msg.time}</span>
                  </div>
                  <div className={cn(
                    "border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-gray-300 leading-relaxed shadow-lg",
                    isYou ? "bg-neon-pink/5 rounded-tr-none border-neon-pink/10" : "bg-white/5 rounded-tl-none"
                  )}>
                    {msg.text}
                  </div>
                </div>
              </div>
            )}
          </div>
        )})}
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
