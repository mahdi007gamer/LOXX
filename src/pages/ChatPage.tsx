import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { GlowButton } from "../components/ui/GlowButton";
import { Send, Hash, Users, MoreVertical, Plus, Smile, Image as ImageIcon, Reply, Heart, ChevronDown, Award, Star, Zap, Crown, Play, Check } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useGames } from "../context/GamesContext";
import { useFriends } from "../context/FriendsContext";
import { BadgeType, ChatMessage, Channel } from "../types";

import { useProfilePopover } from "../context/ProfilePopoverContext";

// --- Sub-components ---

interface BadgeIconProps {
  type: BadgeType;
}

const BadgeIcon: React.FC<BadgeIconProps> = ({ type }) => {
  switch(type) {
    case BadgeType.STREAMER: return <div title="Streamer" className="text-neon-blue"><Zap size={12} fill="currentColor" /></div>;
    case BadgeType.PRO: return <div title="Pro Player" className="text-neon-pink"><Award size={12} fill="currentColor" /></div>;
    case BadgeType.LOBBY_MASTER: return <div title="Lobby Master" className="text-yellow-500"><Star size={12} fill="currentColor" /></div>;
    case BadgeType.VIP: return <div title="VIP" className="text-purple-500"><Crown size={12} fill="currentColor" /></div>;
    default: return null;
  }
};

interface MessageItemProps {
  message: ChatMessage;
  onReaction: (msgId: string, emoji: string) => void;
  onSaveGif: (url: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onReaction, onSaveGif }) => {
  const { openProfile } = useProfilePopover();
  // Level based colors
  const nameColorClass = message.senderLevel > 40 ? "text-neon-blue shadow-[0_0_8px_rgba(0,229,255,0.3)]" : 
                        message.senderLevel > 20 ? "text-neon-pink" : "text-white/80";

  return (
    <div 
      id={`msg-${message.id}`}
      className={cn(
        "flex gap-3 group transition-all duration-300 mb-2 items-start px-2 md:px-0",
        message.self ? "flex-row" : "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div 
        className="shrink-0 cursor-pointer relative"
        onClick={() => openProfile({
          senderName: message.senderName,
          senderAvatar: message.senderAvatar,
          senderLevel: message.senderLevel,
          senderBadges: message.senderBadges,
          id: message.id
        }, message.self)}
      >
        <div className={cn(
          "h-9 w-9 md:h-11 md:w-11 rounded-xl flex items-center justify-center text-lg md:text-xl relative z-[10] transition-transform hover:scale-105 shadow-xl",
          message.self ? "bg-neon-pink/20 border border-neon-pink/30 shadow-neon-pink/10" : "bg-white/5 border border-white/10 shadow-black/50",
          message.senderBadges?.includes(BadgeType.STREAMER) && "ring-2 ring-neon-blue/50"
        )}>
          {message.senderAvatar || "👤"}
          {message.senderBadges?.includes(BadgeType.STREAMER) && (
             <div className="absolute inset-0 rounded-xl border border-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.4)] animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Message Content Area */}
      <div className={cn(
        "flex flex-col gap-0.5 max-w-[85%] md:max-w-[65%]",
        message.self ? "items-start" : "items-end" 
      )}>
        {/* Header - Compact */}
        <div className={cn(
          "flex items-center gap-2 mb-0.5 px-1 opacity-60 hover:opacity-100 transition-opacity",
          message.self ? "flex-row" : "flex-row-reverse"
        )}>
           <span 
              className={cn("text-[10px] font-black tracking-tight cursor-pointer hover:underline", nameColorClass)}
              onClick={() => openProfile({
                senderName: message.senderName,
                senderAvatar: message.senderAvatar,
                senderLevel: message.senderLevel,
                senderBadges: message.senderBadges,
                id: message.id
              }, message.self)}
            >
              {message.senderName}
            </span>
          <span className="text-[9px] text-gray-500 font-bold">{message.timestamp}</span>
        </div>

        {/* Message Container with embedded actions and reply */}
        <div className="relative group/bubble-container">
          {/* Action Buttons - Tighter and Cleaner */}
          <div className={cn(
            "absolute top-0 bottom-0 flex items-center gap-1.5 opacity-0 group-hover/bubble-container:opacity-100 transition-all duration-200 z-10",
            message.self ? "right-full mr-2" : "left-full ml-2"
          )}>
            <button 
              className="p-1.5 rounded-lg bg-black/80 text-gray-400 hover:text-neon-pink hover:bg-neon-pink/10 border border-white/5 backdrop-blur-md transition-all active:scale-90"
              onClick={() => onReaction(message.id, "❤️")}
            >
              <Heart size={14} className={cn(message.reactions?.some(r => r.emoji === "❤️" && r.users.includes("me")) && "fill-neon-pink text-neon-pink")} />
            </button>
            <button className="p-1.5 rounded-lg bg-black/80 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 backdrop-blur-md transition-all active:scale-90">
              <Reply size={14} />
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={cn(
              "relative rounded-2xl overflow-hidden shadow-2xl transition-all border",
              "rtl text-right",
              message.self 
                ? "bg-[#140e1a] text-white border-neon-pink/20 rounded-tr-none" 
                : "bg-[#0c0f16] text-white border-neon-blue/20 rounded-tl-none"
            )}
          >
            {/* Reply Preview - Embedded inside bubble area */}
            {message.replyTo && (
               <div 
                 onClick={(e) => {
                   e.stopPropagation();
                   const el = document.getElementById(`msg-${message.replyTo?.id}`);
                   if (el) {
                     el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                     el.classList.add('ring-2', 'ring-neon-blue', 'ring-offset-4', 'ring-offset-black', 'rounded-2xl');
                     setTimeout(() => {
                       el.classList.remove('ring-2', 'ring-neon-blue', 'ring-offset-4', 'ring-offset-black');
                     }, 2000);
                   }
                 }}
                 className={cn(
                   "px-3 py-2 bg-white/5 border-b border-white/5 text-[11px] text-gray-400 flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors",
                   message.self ? "border-neon-pink/10" : "border-neon-blue/10"
                 )}
               >
                 <div className={cn("w-0.5 h-3 rounded-full", message.self ? "bg-neon-pink" : "bg-neon-blue")} />
                 <span className="font-black text-gray-300">{message.replyTo.user}:</span>
                 <span className="truncate opacity-60 italic">{message.replyTo.text.substring(0, 40)}{message.replyTo.text.length > 40 && "..."}</span>
               </div>
            )}

            <div className="px-4 py-2.5">
              {/* Lobby Invite Card */}
              {message.lobbyInvite ? (
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
                       <h5 className="text-xs font-black text-white truncate">{message.lobbyInvite.gameTitle}</h5>
                       <p className="text-[8px] text-gray-500 font-bold uppercase truncate">{message.lobbyInvite.region}</p>
                     </div>
                     <div className="shrink-0 flex items-center gap-1.5">
                       <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-gray-400 font-bold uppercase border border-white/5">
                         <Users size={10} className="text-neon-blue" />
                         {message.lobbyInvite.slots}
                       </div>
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
                         <GlowButton variant="blue" className="h-7 px-4 !rounded-lg font-black text-[10px]">ورود</GlowButton>
                       </motion.div>
                     </div>
                   </div>
                 </div>
              ) : (
                <p className="leading-relaxed text-[13px] font-medium text-gray-200">
                  {message.text.split(/(@\w+)/g).map((part, i) => (
                    part.startsWith('@') ? (
                      <span key={i} className="text-neon-blue font-black hover:underline cursor-pointer">{part}</span>
                    ) : part
                  ))}
                </p>
              )}

              {/* GIF */}
              {message.gif && (
                <div className="mt-2 rounded-xl overflow-hidden border border-white/10 shadow-lg group/gif relative">
                  <img src={message.gif} alt="GIF" className="w-full h-auto max-w-[280px]" />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/gif:opacity-100 transition-opacity">
                    <button 
                      className="p-1.5 bg-black/70 hover:bg-neon-blue/40 rounded-lg text-white transition-colors" 
                      title="Save GIF"
                      onClick={() => onSaveGif(message.gif!)}
                    >
                      <Star size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Reactions Row - More Offset */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={cn("flex flex-wrap gap-1 mt-1 px-1", message.self ? "flex-row-reverse" : "flex-row")}>
              {message.reactions.map((r, i) => (
                <button 
                  key={i} 
                  onClick={() => onReaction(message.id, r.emoji)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black transition-all hover:scale-110",
                    r.users.includes("me") 
                      ? "bg-neon-blue/20 border-neon-blue/40 text-neon-blue shadow-[0_0_8px_rgba(0,229,255,0.2)]" 
                      : "bg-black/60 border-white/10 text-gray-400"
                  )}
                >
                  <span>{r.emoji}</span>
                  <span>{r.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ChannelButtonProps {
  channel: Channel;
  active: boolean;
  onClick: () => void;
}

const ChannelButton: React.FC<ChannelButtonProps> = ({ channel, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "group flex w-full items-center justify-between rounded-xl px-4 py-3.5 transition-all relative overflow-hidden",
      active 
        ? "bg-neon-blue/10 border border-neon-blue/20" 
        : "text-gray-500 hover:bg-white/5 hover:text-gray-100 border border-transparent"
    )}
  >
    <div className="flex items-center gap-3 relative z-10 rtl:flex-row-reverse">
      {channel.type === "game" && channel.icon ? (
        <div className="relative">
          <img src={channel.icon} alt="" className="h-5 w-5 rounded-md object-cover grayscale group-hover:grayscale-0 transition-all opacity-60 group-hover:opacity-100" />
          <div className={cn("absolute -bottom-0.5 -left-0.5 h-2 w-2 rounded-full border-2 border-black", active ? "bg-neon-blue" : "bg-gray-700")}></div>
        </div>
      ) : (
        <Hash size={18} className={active ? "text-neon-blue" : "text-gray-600 group-hover:text-gray-400"} />
      )}
      <span className={cn("text-xs font-black tracking-tight", active ? "text-white" : "")}>{channel.name}</span>
    </div>
    <div className="flex items-center gap-2 relative z-10">
      <span className="text-[9px] font-bold opacity-0 group-hover:opacity-60 transition-opacity">{channel.users}</span>
      {active && <div className="h-1.5 w-1.5 rounded-full bg-neon-blue shadow-[0_0_8px_rgba(0,229,255,0.8)]"></div>}
    </div>
    
    {active && (
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-neon-blue shadow-[-2px_0_15px_rgba(0,229,255,0.5)]"></div>
    )}
  </button>
);

// --- Main Page ---

const INITIAL_CHANNELS: Channel[] = [
  { id: "general", name: "چت عمومی", type: "public", users: 124 },
  { id: "news", name: "اخبار گیمینگ", type: "public", users: 45 },
  { id: "lfg", name: "پیدا کردن یار", type: "public", users: 89 },
];

const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  general: [
    { 
      id: "1", 
      senderId: "u1", 
      senderName: "مازیار", 
      senderLevel: 24, 
      senderBadges: [BadgeType.PRO],
      text: "سلام بچه‌ها! کسی پایه هست بریم CS2؟", 
      timestamp: "۱۲:۳۰", 
      isRead: true,
      self: false,
      reactions: [{ emoji: "🔥", count: 2, users: ["u2", "me"] }]
    },
    { 
      id: "2", 
      senderId: "u2", 
      senderName: "امیر", 
      senderLevel: 15,
      senderBadges: [BadgeType.VIP],
      text: "من هستم، لابی بساز جوین شیم.", 
      timestamp: "۱۲:۳۱", 
      isRead: true,
      self: false 
    },
    { 
      id: "3", 
      senderId: "me", 
      senderName: "خودم", 
      senderLevel: 42,
      senderColor: "#00e5ff",
      senderBadges: [BadgeType.STREAMER],
      text: "منم میام، فقط پینگ چطوره؟", 
      timestamp: "۱۲:۳۲", 
      isRead: true,
      self: true 
    },
    { 
      id: "4", 
      senderId: "u1", 
      senderName: "مازیار", 
      senderLevel: 24,
      text: "پینگ عالیه، زیر ۵۰ هست.", 
      timestamp: "۱۲:۳۳", 
      isRead: true,
      self: false,
      replyTo: { id: "3", user: "خودم", text: "منم میام، فقط پینگ چطوره؟" }
    },
    {
      id: "5",
      senderId: "u1",
      senderName: "مازیار",
      senderLevel: 24,
      text: "دعوتتون می‌کنم به لابی، زود بیاید!",
      timestamp: "۱۲:۳۵",
      isRead: true,
      self: false,
      lobbyInvite: {
        lobbyId: "LX-9921",
        gameTitle: "CS2",
        region: "MIDDLE EAST",
        slots: "3/5",
        rank: "GLOBAL ELITE"
      }
    }
  ],
  news: [],
  lfg: [],
};

const GIF_GALLERY = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3VxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXF&ep=v1_gifs_search&rid=giphy.gif&ct=g",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3QxdnZ4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R&ep=v1_gifs_search&rid=giphy.gif&ct=g",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3VxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXF&ep=v1_gifs_search&rid=3.gif&ct=g",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3VxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXF&ep=v1_gifs_search&rid=4.gif&ct=g",
];

export const ChatPage: React.FC = () => {
  const { allGames: games, myGames } = useGames();
  const [activeChannelId, setActiveChannelId] = useState("general");
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(MOCK_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [savedGifs, setSavedGifs] = useState<string[]>([]);
  const [showSaveFeedback, setShowSaveFeedback] = useState(false);
  const [showFriendsSidebar, setShowFriendsSidebar] = useState(false);
  const [userLvl, setUserLvl] = useState(42);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { friends, sendMessage: sendFriendMessage } = useFriends();
  const [isFriendsLoading, setIsFriendsLoading] = useState(false);

  useEffect(() => {
    if (showFriendsSidebar) {
      setIsFriendsLoading(true);
      const timer = setTimeout(() => setIsFriendsLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showFriendsSidebar]);
  const myGamesChannels = (games || [])
    .filter(g => myGames?.includes(g.id))
    .map(g => ({
      id: `game-${g.id}`,
      name: `چت ${g.title}`,
      type: "game" as const,
      users: Math.floor(Math.random() * 50) + 10,
      icon: g.image
    }));

  const allChannels = [...INITIAL_CHANNELS, ...myGamesChannels];
  const activeChannel = allChannels.find(c => c.id === activeChannelId) || INITIAL_CHANNELS[0];

  useEffect(() => {
    if (scrollRef.current && !showNewMessageButton) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeChannelId, showNewMessageButton]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowNewMessageButton(!isAtBottom);
  };

  const handleSend = (textOverride?: string, gifUrl?: string) => {
    const messageText = textOverride || input;
    if (!messageText.trim() && !gifUrl) return;
    
    setUserLvl(prev => prev + 0.1); // xp gain

    const mentions = messageText.match(/@(\w+)/g)?.map(m => m.slice(1)) || [];
    
    // Auto-reply simulation for mentions
    if (mentions.length > 0) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const replyMsg: ChatMessage = {
            id: Date.now().toString() + "-reply",
            senderId: "u1",
            senderName: "مازیار",
            senderLevel: 24,
            text: `@خودم سلام! چطوری؟`,
            timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
            isRead: true,
            self: false,
            mentions: ["خودم"]
          };
          setMessages(prev => ({
            ...prev,
            [activeChannelId]: [...(prev[activeChannelId] || []), replyMsg]
          }));
        }, 1500);
      }, 500);
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: "me",
      senderName: "خودم",
      senderLevel: Math.floor(userLvl),
      senderColor: "#00e5ff",
      senderBadges: [BadgeType.STREAMER, BadgeType.VIP],
      text: messageText,
      timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
      isRead: true,
      self: true,
      mentions,
      gif: gifUrl
    };

    setMessages(prev => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] || []), newMessage]
    }));
    if (!textOverride) setInput("");
    setShowGifPicker(false);
  };

  const handleReaction = (msgId: string, emoji: string) => {
    setMessages(prev => {
      const channelMsgs = [...(prev[activeChannelId] || [])];
      const msgIndex = channelMsgs.findIndex(m => m.id === msgId);
      if (msgIndex === -1) return prev;

      const msg = { ...channelMsgs[msgIndex] };
      const reactions = [...(msg.reactions || [])];
      const reactionIndex = reactions.findIndex(r => r.emoji === emoji);

      if (reactionIndex > -1) {
        const r = { ...reactions[reactionIndex] };
        if (r.users.includes("me")) {
           r.users = r.users.filter(u => u !== "me");
           r.count--;
        } else {
           r.users.push("me");
           r.count++;
        }
        if (r.count <= 0) {
          reactions.splice(reactionIndex, 1);
        } else {
          reactions[reactionIndex] = r;
        }
      } else {
        reactions.push({ emoji, count: 1, users: ["me"] });
      }

      msg.reactions = reactions;
      channelMsgs[msgIndex] = msg;
      return { ...prev, [activeChannelId]: channelMsgs };
    });
  };

  const handleSaveGif = (url: string) => {
    if (savedGifs.includes(url)) return;
    setSavedGifs(prev => [url, ...prev]);
    setShowSaveFeedback(true);
    setTimeout(() => setShowSaveFeedback(false), 2000);
  };

  const sendLobbyInvite = () => {
     if (activeChannel.type !== 'game') return;
     
     const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: "me",
      senderName: "خودم",
      senderLevel: Math.floor(userLvl),
      senderBadges: [BadgeType.STREAMER],
      text: "بیاین لابی، من منتظرم!",
      timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
      isRead: true,
      self: true,
      lobbyInvite: {
        lobbyId: "LX-CUSTOM",
        gameTitle: activeChannel.name.replace("چت ", ""),
        region: "EUROPE",
        slots: "1/5",
        rank: "ANY"
      }
    };

    setMessages(prev => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] || []), newMessage]
    }));
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setShowNewMessageButton(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-128px)] md:h-[calc(100vh-64px)] overflow-hidden bg-dark-bg rtl text-right relative">
      <Sidebar />
      
      {/* Channels Sidebar */}
      <div className="hidden w-80 border-r border-white/5 bg-black/20 backdrop-blur-3xl lg:flex flex-col relative z-20 md:mr-64 mr-0">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-white tracking-widest uppercase">کانال‌ها</h2>
            <button className="p-2 rounded-xl bg-white/5 text-neon-blue hover:scale-110 transition-all border border-white/5 shadow-inner">
              <Plus size={18} />
            </button>
          </div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Global Comms Network</p>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-6">
          {/* Public Channels */}
          <div className="px-4">
            <h3 className="px-4 text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="h-px flex-1 bg-white/5"></span>
              عمومی
              <span className="h-px flex-1 bg-white/5"></span>
            </h3>
            <div className="space-y-1">
              {INITIAL_CHANNELS.map((channel) => (
                <ChannelButton 
                  key={channel.id}
                  channel={channel}
                  active={activeChannelId === channel.id}
                  onClick={() => setActiveChannelId(channel.id)}
                />
              ))}
            </div>
          </div>

          {/* Game Specific Channels */}
          {myGamesChannels.length > 0 && (
            <div className="px-4">
               <h3 className="px-4 text-[10px] font-black text-neon-blue/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="h-px flex-1 bg-neon-blue/5"></span>
                بازی‌های من
                <span className="h-px flex-1 bg-neon-blue/5"></span>
              </h3>
              <div className="space-y-1">
                {myGamesChannels.map((channel) => (
                  <ChannelButton 
                    key={channel.id}
                    channel={channel}
                    active={activeChannelId === channel.id}
                    onClick={() => setActiveChannelId(channel.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Quick Info Footer */}
        <div className="p-4 bg-white/5 border-t border-white/5">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-black/40 border border-white/5">
            <div className="h-10 w-10 rounded-lg bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center relative overflow-hidden">
              <span className="text-xl">👤</span>
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-black"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">خودم</p>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-neon-blue font-bold">LVL {Math.floor(userLvl)}</span>
                <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-neon-blue transition-all" style={{ width: `${(userLvl % 1) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="relative flex flex-1 flex-col bg-[#050507] min-w-0">
        {/* Chat Header */}
        <header className="flex h-16 items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-neon-blue/10 border border-neon-blue/20 text-neon-blue shadow-[0_0_15px_rgba(0,229,255,0.1)] overflow-hidden">
              {activeChannel.type === 'game' ? (
                <img src={activeChannel.icon} alt="" className="h-full w-full object-cover opacity-80" />
              ) : (
                <Hash size={20} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white tracking-widest">{activeChannel.name}</h3>
                {activeChannel.type === 'game' && (
                  <span className="px-1.5 py-0.5 rounded bg-neon-blue/10 text-[8px] text-neon-blue font-bold border border-neon-blue/20 uppercase">Game Room</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{activeChannel.users} نفر در حال گفتگو</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeChannel.type === 'game' && (
              <GlowButton 
                variant="pink" 
                size="sm" 
                className="hidden sm:flex h-9 text-[11px] gap-2 font-black !rounded-xl"
                onClick={sendLobbyInvite}
              >
                 <Plus size={14} />
                 دعوت به لابی
              </GlowButton>
            )}
            <div className="h-8 w-px bg-white/5 mx-2"></div>
            <button 
              onClick={() => setShowFriendsSidebar(!showFriendsSidebar)}
              className={cn(
                "p-2 rounded-lg transition-all",
                showFriendsSidebar ? "text-neon-blue bg-neon-blue/10" : "text-gray-500 hover:text-white hover:bg-white/5"
              )}
            >
              <Users size={20} />
            </button>
            <button className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"><MoreVertical size={20} /></button>
          </div>
        </header>

        {/* Messages List */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth custom-scrollbar relative"
        >
          {/* Date Separator */}
          <div className="flex items-center gap-4 py-4">
             <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/5 to-transparent"></div>
             <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">امروز</span>
             <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/5 to-transparent"></div>
          </div>

          {(messages[activeChannelId] || []).map((msg) => (
            <MessageItem 
              key={msg.id} 
              message={msg} 
              onReaction={handleReaction}
              onSaveGif={handleSaveGif}
            />
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-3 mr-2 opacity-50 animate-in fade-in slide-in-from-bottom-2">
               <div className="flex gap-1">
                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
               </div>
               <span className="text-[10px] text-gray-500 font-bold">مازیار در حال نوشتن...</span>
            </div>
          )}
        </div>

        {/* Floating Messages Feedback */}
        <AnimatePresence>
          {showSaveFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-black text-[10px] shadow-2xl z-40 backdrop-blur-md"
            >
              <Check size={14} />
              گیف با موفقیت ذخیره شد
            </motion.div>
          )}

          {showNewMessageButton && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={scrollToBottom}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-neon-blue text-dark-bg font-black text-[10px] shadow-[0_10px_30px_rgba(0,229,255,0.3)] z-40 hover:scale-105 transition-transform"
            >
              <ChevronDown size={14} />
              پیام‌های جدید
            </motion.button>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="p-4 md:p-8 bg-gradient-to-t from-dark-bg to-transparent relative">
          
          {/* GIF Picker Popover */}
          <AnimatePresence>
            {showGifPicker && (
               <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="absolute bottom-32 right-4 md:right-8 w-72 md:w-80 h-96 bg-[#000000] border border-white/10 rounded-[32px] shadow-2xl z-50 overflow-hidden flex flex-col"
               >
                 <div className="p-4 border-b border-white/5 flex items-center justify-between rtl">
                   <h4 className="text-xs font-black text-white uppercase tracking-widest">گالری گیف</h4>
                   <button onClick={() => setShowGifPicker(false)} className="text-gray-500 hover:text-white">×</button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2 custom-scrollbar rtl">
                   {savedGifs.length > 0 && (
                     <>
                        <div className="col-span-2 py-2 border-b border-white/5 mb-2">
                           <p className="text-[10px] text-neon-blue font-bold uppercase tracking-widest flex items-center gap-2">
                             <Star size={10} fill="currentColor" />
                             گیف‌های ذخیره شده
                           </p>
                        </div>
                        {savedGifs.map((url, i) => (
                          <button 
                            key={`saved-${i}`} 
                            onClick={() => handleSend("", url)}
                            className="rounded-xl overflow-hidden border border-neon-blue/20 hover:border-neon-blue transition-all"
                          >
                             <img src={url} alt="Saved GIF" className="w-full h-24 object-cover" />
                          </button>
                        ))}
                        <div className="col-span-2 py-2 border-b border-white/5 my-2">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">گالری عمومی</p>
                        </div>
                     </>
                   )}
                   {GIF_GALLERY.map((url, i) => (
                     <button 
                      key={i} 
                      onClick={() => handleSend("", url)}
                      className="rounded-xl overflow-hidden border border-white/5 hover:border-neon-blue transition-all"
                     >
                       <img src={url} alt="GIF" className="w-full h-24 object-cover" />
                     </button>
                   ))}
                   {savedGifs.length === 0 && (
                      <div className="col-span-2 py-4 text-center">
                        <p className="text-[10px] text-gray-600 font-bold uppercase">گیف‌های ذخیره شده خالی است</p>
                      </div>
                   )}
                 </div>
               </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group flex flex-row-reverse">
            <div className="absolute inset-0 bg-neon-blue/5 rounded-[24px] blur-2xl group-focus-within:bg-neon-blue/10 transition-all"></div>
            <div className="relative flex flex-1 items-center p-2 rounded-[24px] border border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl focus-within:border-neon-blue/30 transition-all">
              <div className="flex items-center gap-1 px-2 border-l border-white/5">
                <button 
                  onClick={() => setShowGifPicker(!showGifPicker)}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    showGifPicker ? "text-neon-blue bg-neon-blue/10" : "text-gray-500 hover:text-neon-blue hover:bg-neon-blue/5"
                  )} 
                  title="ارسال گیف"
                >
                  <ImageIcon size={20} />
                </button>
                <button className="p-2 text-gray-500 hover:text-neon-blue hover:bg-neon-blue/5 rounded-xl transition-all">
                  <Smile size={20} />
                </button>
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setIsTyping(e.target.value.length > 0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder={`پیام در ${activeChannel.name}...`}
                className="flex-1 bg-transparent py-4 px-6 text-white text-sm focus:outline-none placeholder:text-gray-600 placeholder:font-bold text-right"
              />
              <div className="flex items-center gap-2 pl-2 border-r border-white/5">
                 <button className="p-2 text-gray-500 hover:text-white transition-colors">
                   <Plus size={20} />
                 </button>
                 <GlowButton 
                  variant="blue" 
                  size="sm" 
                  className="h-10 w-10 !rounded-2xl !p-0 shadow-lg shadow-neon-blue/20"
                  onClick={() => handleSend()}
                >
                  <Send size={18} className="rotate-180" />
                </GlowButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Friends Sidebar - Mobile optimized */}
      <AnimatePresence mode="popLayout">
        {showFriendsSidebar && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFriendsSidebar(false)}
              className="fixed inset-0 z-[40] bg-black/60 backdrop-blur-sm lg:hidden md:hidden"
            />
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-[50] flex flex-col w-[85%] md:w-80 md:relative md:inset-auto md:z-20 md:flex flex-col bg-[#0d0d12]/95 border-r border-white/10 shadow-[-20px_0_40px_rgba(0,0,0,0.3)] overflow-hidden backdrop-blur-xl shrink-0"
            >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white tracking-widest uppercase">لیست دوستان</h3>
                <p className="text-[10px] text-neon-blue font-bold tracking-widest uppercase">Social Hub</p>
              </div>
              <button 
                onClick={() => setShowFriendsSidebar(false)}
                className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isFriendsLoading ? (
                // Skeleton Loading
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 animate-pulse">
                      <div className="h-10 w-10 rounded-xl bg-white/10" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-20 bg-white/10 rounded" />
                        <div className="h-2 w-12 bg-white/10 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.length > 0 ? (
                    friends.map((friend) => (
                      <motion.div
                        key={friend.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group relative flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all cursor-pointer"
                      >
                        <div className="relative">
                          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shadow-lg overflow-hidden group-hover:scale-105 transition-transform">
                            {friend.avatar ? (
                              <img src={friend.avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xl">👤</span>
                            )}
                          </div>
                          <div className={cn(
                            "absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#0d0d12]",
                            friend.status === "online" ? "bg-green-500" :
                            friend.status === "in_game" ? "bg-neon-purple shadow-[0_0_8px_rgba(160,32,240,0.8)]" :
                            "bg-gray-600"
                          )} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-black text-white">{friend.displayName}</p>
                            {friend.isFavorite && <Star size={10} className="fill-neon-blue text-neon-blue" />}
                          </div>
                          <p className="text-[10px] text-gray-500 font-bold">سطح {friend.level}</p>
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute inset-0 bg-dark-bg/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 rounded-2xl transition-all duration-300">
                           <button 
                            onClick={() => sendFriendMessage(friend.id, "سلام!")}
                            className="h-9 w-9 rounded-xl bg-neon-blue/20 text-neon-blue hover:bg-neon-blue hover:text-dark-bg transition-all flex items-center justify-center shadow-lg shadow-neon-blue/10"
                            title="پیام"
                           >
                             <Plus size={16} />
                           </button>
                           <button 
                            className="h-9 w-9 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
                            title="پروفایل"
                           >
                             <Users size={16} />
                           </button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-4 opacity-50">
                       <Users size={40} className="mx-auto text-gray-600" />
                       <p className="text-xs font-bold text-gray-500">لیست دوستان خالی است</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="p-4 bg-white/5 border-t border-white/5">
              <GlowButton variant="blue" className="w-full !rounded-2xl text-xs font-black h-12 shadow-neon-blue/10">
                یافتن دوستان جدید
              </GlowButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </div>
  );
};
