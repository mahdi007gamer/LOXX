import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { GlowButton } from "../components/ui/GlowButton";
import { LobbyInviteCard } from "../components/ui/LobbyInviteCard";
import { Send, Hash, Users, MoreVertical, Plus, Smile, Image as ImageIcon, Reply, Heart, ChevronDown, Award, Star, Zap, Crown, Play, Check, Menu, X, MessageSquare, User, Trophy, Palette, Trash, MessageCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useGames } from "../context/GamesContext";
import { useFriends } from "../context/FriendsContext";
import { BadgeType, ChatMessage, Channel, MembershipType, FriendStatus } from "../types";

import { useProfilePopover } from "../context/ProfilePopoverContext";
import { useAuth } from "../context/AuthContext";
import { useLobby } from "../context/LobbyContext";
import { chatSocket } from "../lib/socket";
import { toast } from "react-hot-toast";

// --- Sub-components ---

interface BadgeIconProps {
  type: BadgeType;
}

const BadgeIcon: React.FC<BadgeIconProps> = ({ type }) => {
  switch(type) {
    case BadgeType.STREAMER: return <div title="Streamer" className="text-neon-blue"><Zap size={12} fill="currentColor" /></div>;
    case BadgeType.PRO: return <div title="Pro Player" className="text-neon-pink"><Award size={12} fill="currentColor" /></div>;
    case BadgeType.LOBBY_MASTER: return <div title="Lobby Master" className="text-yellow-500"><Star size={12} fill="currentColor" /></div>;
    case BadgeType.VIP: return <div title="VIP" className="text-yellow-500 animate-pulse"><Crown size={12} fill="currentColor" /></div>;
    case BadgeType.CHAMPION: return <div title="Champion" className="text-yellow-400"><Trophy size={12} fill="currentColor" /></div>;
    case BadgeType.PLUS: return <div title="Plus" className="text-neon-blue"><Zap size={12} fill="currentColor" /></div>;
    default: return null;
  }
};

interface MessageItemProps {
  message: ChatMessage;
  onReaction: (msgId: string, emoji: string) => void;
  onSaveGif: (url: string) => void;
  onReply: (message: ChatMessage) => void;
  activeChannelId: string;
  onDelete: (msgId: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onReaction, onSaveGif, onReply, activeChannelId, onDelete }) => {
  const { openProfile } = useProfilePopover();
  const { user } = useAuth();
  const isAdmin = (user as any)?.role === 'ADMIN';
  const [showActions, setShowActions] = useState(false);

  // Level based colors
  const isVIP = message.senderBadges?.includes(BadgeType.VIP);
  const isPLUS = message.senderBadges?.includes(BadgeType.PLUS);
  const isChamp = message.senderBadges?.includes(BadgeType.CHAMPION);

  const nameColorClass = isVIP ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" :
                        isChamp ? "text-yellow-500" :
                        isPLUS ? "text-neon-blue" :
                        message.senderLevel > 40 ? "text-neon-blue shadow-[0_0_8px_rgba(0,229,255,0.3)]" : 
                        message.senderLevel > 20 ? "text-neon-pink" : "text-white/80";

  return (
    <div 
      id={`msg-${message.id}`}
      className={cn(
        "flex gap-2 md:gap-3 transition-all duration-300 mb-6 px-1 md:px-0 relative w-full",
        message.self ? "flex-row justify-start" : "flex-row-reverse justify-start"
      )}
    >
      {/* Interaction Menu Popover Overlay - Globally available */}
      <AnimatePresence>
        {showActions && (
          <div 
            className={cn(
              "fixed inset-0 z-40",
              showActions ? "pointer-events-auto" : "pointer-events-none"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(false);
            }}
          />
        )}
      </AnimatePresence>

      <div 
        className="shrink-0 cursor-pointer relative mt-1"
        onClick={(e) => {
          e.stopPropagation();
          openProfile({
            senderName: message.senderName,
            senderAvatar: message.senderAvatar,
            senderLevel: message.senderLevel,
            senderBadges: message.senderBadges,
            id: message.senderId,
            membership: isVIP ? MembershipType.VIP : isPLUS ? MembershipType.PLUS : MembershipType.NONE
          }, message.self);
        }}
      >
        <div className={cn(
          "h-9 w-9 md:h-11 md:w-11 rounded-xl flex items-center justify-center text-lg md:text-xl relative z-[10] transition-transform hover:scale-105 shadow-xl bg-cover bg-center overflow-visible",
          message.self ? "bg-neon-pink text-white" : "bg-neon-blue text-white",
          isVIP && "border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]",
          isPLUS && "border-2 border-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.3)]"
        )}>
          {message.senderAvatar && message.senderAvatar.startsWith("http") ? (
            <img src={message.senderAvatar} alt={message.senderName} className="w-full h-full object-cover rounded-xl" />
          ) : (
            message.senderAvatar || (message.senderName ? message.senderName[0] : "?")
          )}
          
          <div 
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#050507] z-[31] shadow-lg transition-colors duration-500", 
            )} 
            style={{ backgroundColor: (activeChannelId === 'news' || message.isOnline !== false) ? "#22c55e" : "#9ca3af" }} 
          />
        </div>
      </div>

      {/* Message Content Area */}
      <div 
        className={cn(
          "flex flex-col gap-1 max-w-[82%] md:max-w-[70%] min-w-0 transition-all duration-200 group/msg-content",
          message.self ? "items-start text-right" : "items-end text-left",
          showActions && "scale-[1.02] z-50 relative"
        )}
        onClick={() => setShowActions(!showActions)}
      >
        {/* Header - Name -> Badge -> Time (Order follows container flow) */}
        <div className={cn(
          "flex items-center gap-1.5 mb-1 px-0.5",
          message.self ? "flex-row" : "flex-row-reverse"
        )}>
          <span 
              className={cn("text-[11px] font-black tracking-tight cursor-pointer hover:underline flex items-center gap-1", nameColorClass)}
              onClick={(e) => {
                e.stopPropagation();
                openProfile({
                  senderName: message.senderName,
                  senderAvatar: message.senderAvatar,
                  senderLevel: message.senderLevel,
                  senderBadges: message.senderBadges,
                  id: message.senderId,
                  membership: isVIP ? MembershipType.VIP : isPLUS ? MembershipType.PLUS : MembershipType.NONE
                }, message.self);
              }}
            >
              {message.senderName}
            </span>
          
          <div className={cn(
            "flex gap-1 items-center",
            message.self ? "flex-row" : "flex-row-reverse"
          )}>
             {message.senderBadges?.map((b, i) => <BadgeIcon key={i} type={b} />)}
          </div>

          <span className={cn(
            "text-[9px] text-gray-500 font-bold opacity-60",
            message.self ? "mr-1" : "ml-1"
          )}>{message.timestamp}</span>
        </div>

        {/* Message Container Area */}
        <div className="flex flex-col w-full">
          <div className={cn("relative group/bubble-container flex items-center w-fit", message.self ? "ml-auto" : "mr-auto")}>
            {/* VIP Glow Backing */}
            {isVIP && !message.self && (
              <div className="absolute inset-0 bg-yellow-400/5 blur-3xl rounded-full scale-150 animate-pulse pointer-events-none" />
            )}
            
            {/* Action Buttons - Repositioned to prevent horizontal scroll */}
            <div className={cn(
              "absolute flex items-center gap-1 px-1.5 py-1 rounded-xl bg-[#0f0f15]/95 border border-white/10 shadow-2xl z-[60] backdrop-blur-2xl whitespace-nowrap transition-all duration-200 min-w-max",
              message.self ? "right-0 -top-10" : "left-0 -top-10",
              showActions ? "opacity-100 translate-y-0 visible" : "opacity-0 translate-y-2 invisible lg:group-hover/bubble-container:opacity-100 lg:group-hover/bubble-container:translate-y-0 lg:group-hover/bubble-container:visible"
            )}
            onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="h-6 w-6 md:h-7 md:w-7 flex items-center justify-center text-gray-400 hover:text-neon-blue transition-colors rounded-lg hover:bg-white/5 relative z-10 shrink-0" 
                onClick={(e) => { e.stopPropagation(); onReply(message); setShowActions(false); }}
              >
                <Reply size={14} />
              </button>
              {(isAdmin || message.self) && (
                <button 
                  className="h-6 w-6 md:h-7 md:w-7 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-white/5 relative z-10 shrink-0" 
                  onClick={(e) => { e.stopPropagation(); onDelete(message.id); setShowActions(false); }}
                  title="حذف پیام"
                >
                  <Trash size={14} />
                </button>
              )}
              <div className="flex items-center gap-0.5 md:gap-1.5 border-r border-white/5 pr-1 md:pr-2 relative z-10 shrink-0">
                  {["🔥", "🎯", "👑", "❤️"].map(emoji => (
                    <button 
                      key={emoji} 
                      className="h-6 w-6 md:h-7 md:w-7 flex items-center justify-center hover:bg-white/5 rounded-lg transition-transform hover:scale-110 active:scale-95 text-sm md:text-base"
                      onClick={(e) => { e.stopPropagation(); onReaction(message.id, emoji); }}
                    >
                      {emoji}
                    </button>
                  ))}
              </div>
              <button className="h-6 w-6 md:h-7 md:w-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 relative z-10 shrink-0"><Smile size={14} /></button>
            </div>
  
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={cn(
                "relative rounded-2xl overflow-hidden shadow-2xl transition-all border w-fit max-w-full",
                "rtl text-right break-words",
                activeChannelId === 'news'
                  ? "bg-[#0b0c14] text-white border-white/5 shadow-none rounded-xl px-0"
                  : message.self 
                    ? "bg-[#140e1a] text-white border-neon-pink/20 rounded-tr-none" 
                    : "bg-white/5 text-gray-100 border-white/10 rounded-tl-none",
                isVIP && !message.self && "border-yellow-400/40 bg-gradient-to-br from-yellow-400/[0.12] to-transparent shadow-[0_0_40px_rgba(250,204,21,0.12)]",
                isPLUS && !message.self && "border-neon-blue/40 bg-gradient-to-br from-neon-blue/[0.12] to-transparent shadow-[0_0_30px_rgba(0,229,255,0.12)]"
              )}
            >
               {/* VIP/PLUS Shimmer Effect */}
               {(isVIP || isPLUS) && !message.self && (
                <motion.div 
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className={cn(
                    "absolute inset-0 skew-x-12 pointer-events-none",
                    isVIP ? "bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent" : "bg-gradient-to-r from-transparent via-neon-blue/10 to-transparent"
                  )}
                />
              )}
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
                {/* Image Handling - News channel shows image first */}
                {activeChannelId === 'news' && message.image && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-white/10 shadow-xl max-w-full">
                    <img src={message.image} alt="News image" className="w-full h-auto object-contain cursor-pointer" onClick={() => window.open(message.image, '_blank')} />
                  </div>
                )}

                {/* Text Handling */}
                {message.text && (
                  <p className="leading-relaxed text-[13px] font-medium text-gray-200 mb-2">
                    {message.text.split(/(@\w+)/g).map((part, i) => (
                      part.startsWith('@') ? (
                        <span key={i} className="text-neon-blue font-black hover:underline cursor-pointer">{part}</span>
                      ) : part
                    ))}
                  </p>
                )}

                {/* Regular Image (Non-news or second in news) */}
                {activeChannelId !== 'news' && message.image && (
                  <div className="mt-1 rounded-lg overflow-hidden border border-white/10 shadow-xl max-w-[280px]">
                    <img src={message.image} alt="Chat image" className="w-full h-auto object-contain cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => window.open(message.image, '_blank')} />
                  </div>
                )}

                {/* Lobby Invite Card */}
                {message.lobbyInvite && (
                  <LobbyInviteCard initialData={message.lobbyInvite} />
                )}
                {false && (
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
          </div>
  
          {/* Reactions Row - Aligned with bubble container flow */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={cn(
              "flex flex-wrap gap-1 mt-1 w-fit transition-all mb-2", 
              message.self ? "ml-auto mr-0 flex-row" : "mr-auto ml-0 flex-row-reverse"
            )}>
              {message.reactions.map((r, i) => (
                <button 
                  key={i} 
                  onClick={(e) => {
                    e.stopPropagation();
                    onReaction(message.id, r.emoji);
                  }}
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black transition-all hover:scale-110",
                    r.users.includes(user?.id || "me") 
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
  unreadCount?: number;
}

const ChannelButton: React.FC<ChannelButtonProps> = ({ channel, active, onClick, unreadCount }) => (
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
      {unreadCount ? (
        <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
      <span className={cn("text-[9px] font-bold transition-opacity", unreadCount ? "opacity-40" : "opacity-0 group-hover:opacity-60")}>{channel.users}</span>
      {active && <div className="h-1.5 w-1.5 rounded-full bg-neon-blue shadow-[0_0_8px_rgba(0,229,255,0.8)]"></div>}
    </div>
    
    {active && (
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-neon-blue shadow-[-2px_0_15px_rgba(0,229,255,0.5)]"></div>
    )}
  </button>
);

// --- Themes ---

const CHAT_THEMES = {
  aura: {
    name: "Animated Neon Aura",
    bgClass: "bg-[#05070d]",
    radial: (
      <>
        <motion.div 
          animate={{ x: ["-10%", "10%"], y: ["-10%", "10%"] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "mirror" }}
          className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[80%] h-[80%] bg-[radial-gradient(circle,rgba(0,255,200,0.06),transparent_60%)] pointer-events-none z-0" 
        />
        <motion.div 
          animate={{ x: ["10%", "-10%"], y: ["10%", "-10%"] }}
          transition={{ duration: 25, repeat: Infinity, repeatType: "mirror" }}
          className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[80%] h-[80%] bg-[radial-gradient(circle,rgba(255,0,200,0.06),transparent_60%)] pointer-events-none z-0" 
        />
      </>
    ),
    overlay: null
  },
  default: {
    name: "Classic Dark",
    bgClass: "bg-[#050507]",
    radial: null,
    overlay: null
  },
  cyber: {
    name: "Cyber Grid Neon",
    bgClass: "bg-[#05070d]",
    overlay: (
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] z-0" 
           style={{ backgroundImage: `linear-gradient(to right, #00ffc8 1px, transparent 1px), linear-gradient(to bottom, #00ffc8 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
    ),
    radial: (
      <>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,200,0.08),transparent_40%)] pointer-events-none z-0" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,rgba(255,0,180,0.08),transparent_40%)] pointer-events-none z-0" />
      </>
    )
  },
  noise: {
    name: "Digital Noise",
    bgClass: "bg-[#05070d]",
    radial: null,
    overlay: (
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
    )
  }
};

// --- Main Page ---

const INITIAL_CHANNELS: Channel[] = [
      { id: "general", name: "چت عمومی", type: "public", users: 15420 },
      { id: "news", name: "اخبار گیمینگ", type: "public", users: 15420 },
      { id: "lfg", name: "پیدا کردن یار", type: "public", users: 15420 },
];

const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  general: [
    { 
      id: "1", 
      senderId: "u1", 
      senderName: "مازیار", 
      senderLevel: 24, 
      senderBadges: [BadgeType.PRO, BadgeType.CHAMPION],
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
      senderLevel: 35,
      senderBadges: [BadgeType.VIP, BadgeType.CHAMPION, BadgeType.FOUNDER],
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
      senderBadges: [BadgeType.STREAMER, BadgeType.PLUS, BadgeType.PRO],
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
      senderBadges: [BadgeType.PRO],
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
      senderBadges: [BadgeType.PRO],
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
  { name: "Laughing Cat", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3VxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXF&ep=v1_gifs_search&rid=giphy.gif&ct=g" },
  { name: "Mind Blown", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3QxdnZ4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R&ep=v1_gifs_search&rid=giphy.gif&ct=g" },
  { name: "Gaming Victory", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3VxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXF&ep=v1_gifs_search&rid=3.gif&ct=g" },
  { name: "Clap", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3VxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXF&ep=v1_gifs_search&rid=4.gif&ct=g" },
  { name: "Dancing", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMnVxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXF&ep=v1_gifs_search&rid=5.gif&ct=g" },
  { name: "Sad Face", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3VxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXF&ep=v1_gifs_search&rid=6.gif&ct=g" },
  { name: "Victory Royale", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHVxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXF&ep=v1_gifs_search&rid=7.gif&ct=g" },
  { name: "Headshot", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNXVxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXFxdXF&ep=v1_gifs_search&rid=8.gif&ct=g" },
];

export const ChatPage: React.FC = () => {
  const { allGames: games, myGames } = useGames();
  const { user } = useAuth();
  const { lobby } = useLobby();
  const [activeChannelId, setActiveChannelId] = useState("general");
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [memberCount, setMemberCount] = useState(15420);
  const [typers, setTypers] = useState<Record<string, Record<string, string>>>({});
  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [savedGifs, setSavedGifs] = useState<string[]>([]);
  const [showSaveFeedback, setShowSaveFeedback] = useState(false);
  const [showFriendsSidebar, setShowFriendsSidebar] = useState(false);
  const [showChannelMenu, setShowChannelMenu] = useState(false);
  const [chatTheme, setChatTheme] = useState<keyof typeof CHAT_THEMES>((localStorage.getItem("loxx-chat-theme") as any) || "aura");
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [userLvl, setUserLvl] = useState(42);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("loxx-chat-theme", chatTheme);
  }, [chatTheme]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { friends, chats, activeChatId, openChat, sendMessage: sendFriendMessage } = useFriends();
  const [isFriendsLoading, setIsFriendsLoading] = useState(false);

  useEffect(() => {
    if (showFriendsSidebar) {
      setIsFriendsLoading(true);
      const timer = setTimeout(() => setIsFriendsLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showFriendsSidebar]);

  useEffect(() => {
    // Join channel and fetch history when switched
    chatSocket.emit("chat.join", { type: "channel", id: activeChannelId }, (res: any) => {
      if (res.status === "ok" && res.data) {
        if (res.data.messages) {
          setMessages(prev => ({ ...prev, [activeChannelId]: res.data.messages.map((m: any) => formatIncomingMessage(m, user?.id)) }));
        }
        if (res.data.memberCount) {
          setMemberCount(res.data.memberCount);
        }
        setUnreadCounts(prev => ({ ...prev, [activeChannelId]: 0 }));
      }
    });
  }, [activeChannelId, user?.id]);

  useEffect(() => {
    const handleNewMessage = (msg: any) => {
       const channelId = msg.targetId;
       const formatted = formatIncomingMessage(msg, user?.id);
       
       setMessages(prev => {
         const channelMsgs = prev[channelId] || [];
         // Prevent duplicate messages
         if (msg.tempId && channelMsgs.some(m => m.id === msg.tempId)) {
           return {
             ...prev,
             [channelId]: channelMsgs.map(m => m.id === msg.tempId ? formatted : m)
           };
         }
         if (channelMsgs.some(m => m.id === formatted.id)) return prev;
         return {
           ...prev,
           [channelId]: [...channelMsgs, formatted]
         };
       });

       if (channelId !== activeChannelId) {
         setUnreadCounts(prev => ({ ...prev, [channelId]: (prev[channelId] || 0) + 1 }));
       }
    };

    chatSocket.on("chat.message", handleNewMessage);
    
    const handleTyping = (data: { targetId: string, userId: string, username: string, isTyping: boolean }) => {
      setTypers(prev => {
        const channelTypers = { ...(prev[data.targetId] || {}) };
        if (data.isTyping) {
          channelTypers[data.userId] = data.username;
        } else {
          delete channelTypers[data.userId];
        }
        return { ...prev, [data.targetId]: channelTypers };
      });
    };
    chatSocket.on("chat.typing", handleTyping);

    const handleReactionUpdate = (data: { messageId: string, reactions: any[] }) => {
      setMessages(prev => {
        const newMessages = { ...prev };
        Object.keys(newMessages).forEach(channelId => {
          newMessages[channelId] = newMessages[channelId].map(m => 
            m.id === data.messageId ? { ...m, reactions: data.reactions } : m
          );
        });
        return newMessages;
      });
    };
    chatSocket.on("chat.reaction", handleReactionUpdate);

    const handleDelete = (data: { messageId: string }) => {
      setMessages(prev => {
        const newMessages = { ...prev };
        Object.keys(newMessages).forEach(channelId => {
          newMessages[channelId] = newMessages[channelId].map(m => 
            m.id === data.messageId ? { ...m, isDeleted: true, text: "این پیام حذف شده است." } : m
          );
        });
        return newMessages;
      });
    };
    chatSocket.on("chat.delete", handleDelete);

    const handleRemove = (data: { messageId: string }) => {
      setMessages(prev => {
        const newMessages = { ...prev };
        Object.keys(newMessages).forEach(channelId => {
          newMessages[channelId] = newMessages[channelId].filter(m => m.id !== data.messageId);
        });
        return newMessages;
      });
    };
    chatSocket.on("chat.message_removed", handleRemove);

    return () => {
       chatSocket.off("chat.message", handleNewMessage);
       chatSocket.off("chat.typing", handleTyping);
       chatSocket.off("chat.reaction", handleReactionUpdate);
       chatSocket.off("chat.delete", handleDelete);
       chatSocket.off("chat.message_removed", handleRemove);
    };
  }, [activeChannelId, user?.id]);

  useEffect(() => {
    if (activeChannelId) {
      chatSocket.emit("chat.typing", { 
        target: { type: "channel", id: activeChannelId }, 
        isTyping: input.length > 0 
      });
    }
  }, [input, activeChannelId]);

  const formatIncomingMessage = (msg: any, currentUserId?: string): ChatMessage => {
     const badges: BadgeType[] = [];
     if (msg.from.membership === "VIP") badges.push(BadgeType.VIP);
     if (msg.from.membership === "PLUS") badges.push(BadgeType.PLUS);
     
     const isNewsChannel = msg.targetId === 'news' || msg.channelId === 'news';
     
     let text = msg.content || "";
     let image: string | undefined;
     let lobbyInvite: any | undefined;

     if (text.includes("[IMAGE]:")) {
       const parts = text.split("[IMAGE]:");
       text = parts[0].trim();
       // Take everything after [IMAGE]: as the image data, ignoring line breaks
       image = parts[1]?.trim();
     }

     if (text.includes("[LOBBY_INVITE]:")) {
       const parts = text.split("[LOBBY_INVITE]:");
       text = parts[0].trim();
       try {
         const inviteStr = parts[1]?.split("\n")[0].trim();
         lobbyInvite = JSON.parse(inviteStr);
       } catch (e) {
         console.error("Failed to parse lobby invite", e);
       }
     }
     
     return {
       id: msg.id,
       senderId: isNewsChannel ? "loxx-system" : msg.from.userId,
       senderName: isNewsChannel ? "لوکس" : msg.from.username,
       senderAvatar: isNewsChannel ? "/logo.png" : msg.from.avatar,
       senderLevel: msg.from.level,
       senderBadges: isNewsChannel ? [] : badges,
       text,
       image,
       lobbyInvite: lobbyInvite || msg.lobbyInvite,
       isOnline: isNewsChannel ? true : msg.from.isOnline,
       timestamp: new Date(msg.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
       isRead: true,
       self: msg.from.userId === currentUserId,
       reactions: msg.reactions || [],
       replyTo: msg.replyTo ? { 
           id: msg.replyTo.id, 
           user: isNewsChannel ? "لوکس" : (msg.replyTo.user || "ناشناس"), 
           text: msg.replyTo.text || "پیام ریپلای شده..." 
        } : (msg.replyToId ? { id: msg.replyToId.toString(), user: "ناشناس", text: "پیام ریپلای شده..." } : undefined)
     };
  };

  const myGamesChannels = (games || [])
    .filter(g => myGames?.includes(g.id))
    .map(g => ({
      id: `game-${g.id}`,
      name: `چت ${g.title}`,
      type: "game" as const,
      users: 15420, // Total Loxx members as requested
      icon: g.image
    }));

  const allChannels = [...INITIAL_CHANNELS, ...myGamesChannels];
  const activeChannel = allChannels.find(c => c.id === activeChannelId) || allChannels[0] || INITIAL_CHANNELS[0];

  const currentMessages = messages[activeChannelId] || [];

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

  const handleSend = () => {
    const messageText = input;
    if (!messageText.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const newMsgObj: ChatMessage = {
       id: tempId,
       senderId: user?.id || "me",
       senderName: user?.username || "شما",
       senderLevel: 1,
       text: messageText,
       timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
       isRead: true,
       self: true,
       replyTo: replyingTo ? { id: replyingTo.id, user: replyingTo.senderName, text: replyingTo.text } : undefined
    };

    setMessages(prev => ({
       ...prev,
       [activeChannelId]: [...(prev[activeChannelId] || []), newMsgObj]
    }));
    setInput("");
    setReplyingTo(null);

    chatSocket.emit("chat.send", {
      target: { type: "channel", id: activeChannelId },
      content: messageText,
      tempId,
      replyToId: replyingTo?.id
    }, (res: any) => {
       if (res.status === "error") {
          // Replace temp msg with error ? Or just log it.
          alert(res.error?.message || "Error sending message");
          setMessages(prev => ({
             ...prev,
             [activeChannelId]: prev[activeChannelId].filter(m => m.id !== tempId)
          }));
       } else {
          setMessages(prev => {
             const channelMsgs = prev[activeChannelId] || [];
             return {
               ...prev,
               [activeChannelId]: channelMsgs.map(m => m.id === tempId ? { ...m, id: res.data.messageId } : m)
             };
          });
       }
    });
  };

  const handleReaction = (msgId: string, emoji: string) => {
    chatSocket.emit("chat.reaction", { messageId: msgId, emoji });
    
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
     if (activeChannel.type !== 'game' || !lobby) return;
     
     const inviteData = {
        lobbyId: lobby.id!,
        gameTitle: lobby.gameTitle,
        region: lobby.region || lobby.selectedMaps || "IR",
        slots: `${lobby.players.length}/${lobby.maxPlayers}`,
        rank: "ANY"
     };

     const tempId = `temp-${Date.now()}`;
     
     chatSocket.emit("chat.send", {
       target: { type: "channel", id: activeChannelId },
       content: `بیاین لابی، من منتظرم!\n[LOBBY_INVITE]:${JSON.stringify(inviteData)}`,
       tempId
     });
     
     toast.success("دعوت‌نامه ارسال شد");
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setShowNewMessageButton(false);
    }
  };

  const { openProfile } = useProfilePopover();
  const isAdmin = (user as any)?.role === 'ADMIN';

  const [showImagePostModal, setShowImagePostModal] = useState(false);
  const [newsPostFile, setNewsPostFile] = useState<File | null>(null);
  const [newsPostPreview, setNewsPostPreview] = useState<string | null>(null);
  const [newsPostText, setNewsPostText] = useState("");

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setNewsPostFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setNewsPostPreview(e.target?.result as string);
      setShowImagePostModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSendNewsPost = () => {
    if (!newsPostPreview) return;
    
    // Switch to news channel if not already there
    if (activeChannelId !== "news") {
      setActiveChannelId("news");
    }

    chatSocket.emit("chat.send", {
      target: { type: "channel", id: "news" },
      content: `${newsPostText}\n[IMAGE]:${newsPostPreview}`,
      tempId: `temp-${Date.now()}`
    }, (res: any) => {
      if (res.status === "ok") {
        setShowImagePostModal(false);
        setNewsPostFile(null);
        setNewsPostPreview(null);
        setNewsPostText("");
      } else {
        alert("خطا در ارسال خبر: " + res.error?.message);
      }
    });
  };

  const deleteMessage = (msgId: string) => {
    if (confirm("آیا از حذف این پیام اطمینان دارید؟")) {
      chatSocket.emit("chat.delete", { messageId: msgId });
    }
  };

  return (
    <div 
      className="flex h-[calc(100vh-128px)] md:h-[calc(100vh-64px)] overflow-hidden bg-dark-bg rtl text-right relative overscroll-none" 
      style={{ overscrollBehavior: 'none' }} 
      onDragOver={(e) => {
        if (activeChannelId === 'news' && (user as any)?.role === 'ADMIN') {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onDrop={(e) => {
        if (activeChannelId === 'news' && (user as any)?.role === 'ADMIN') {
          e.preventDefault();
          e.stopPropagation();
          const file = e.dataTransfer.files?.[0];
          if (file) handleFileUpload(file);
        }
      }}
    >
      <Sidebar />
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          e.target.value = ""; // Reset
        }}
      />

      <AnimatePresence>
        {showImagePostModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0c10] border border-white/10 rounded-[32px] w-full max-w-[500px] overflow-hidden shadow-2xl p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white italic tracking-tighter">ارسال محتوا به اخبار</h3>
                <button onClick={() => setShowImagePostModal(false)} className="text-gray-500 hover:text-white"><X size={24}/></button>
              </div>
              
              <div className="rounded-2xl overflow-hidden border border-white/5 mb-6 aspect-video bg-black/40">
                <img src={newsPostPreview || ""} alt="Preview" className="w-full h-full object-contain" />
              </div>

              <textarea
                value={newsPostText}
                onChange={(e) => setNewsPostText(e.target.value)}
                placeholder="توضیحات خبر را اینجا بنویسید..."
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none focus:border-neon-blue/50 transition-all text-white font-medium text-sm resize-none mb-6"
                rows={4}
              />

              <div className="flex gap-3">
                 <GlowButton variant="blue" className="flex-1 font-black" onClick={handleSendNewsPost}>انتشار خبر</GlowButton>
                 <button onClick={() => setShowImagePostModal(false)} className="px-6 py-3 rounded-2xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 transition-colors">انصراف</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
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
                  unreadCount={unreadCounts[channel.id]}
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
                    unreadCount={unreadCounts[channel.id]}
                    onClick={() => setActiveChannelId(channel.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent Chats Section */}
          <div className="px-4">
            <h3 className="px-4 text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="h-px flex-1 bg-white/5"></span>
              گفتگوهای اخیر
              <span className="h-px flex-1 bg-white/5"></span>
            </h3>
            <div className="space-y-1 mb-6">
              {chats.map((chat) => {
                const friend = friends.find(f => f.id === chat.friendId);
                const displayName = friend?.displayName || chat.tempDisplayName || "گیمر";
                const avatar = friend?.avatar;
                const status = friend?.status || FriendStatus.OFFLINE;

                return (
                  <button
                    key={chat.friendId}
                    onClick={() => openChat(chat.friendId, displayName)}
                    className={cn(
                      "w-full group flex items-center justify-between p-2.5 rounded-2xl transition-all text-right border border-transparent",
                      activeChatId === chat.friendId 
                        ? "bg-neon-blue/10 border-neon-blue/20 shadow-[0_0_20px_rgba(0,229,255,0.05)]" 
                        : "hover:bg-white/5"
                    )}
                    dir="rtl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-xs overflow-hidden border border-white/5 group-hover:border-white/20 transition-colors">
                           {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <User size={16} className="text-gray-500" />}
                        </div>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0d0d12]",
                          status === FriendStatus.ONLINE ? "bg-green-500" :
                          status === FriendStatus.IN_GAME ? "bg-neon-purple shadow-[0_0_8px_rgba(160,32,240,0.8)]" : 
                          status === FriendStatus.IN_LOBBY ? "bg-neon-blue shadow-[0_0_8px_rgba(0,229,255,0.8)]" :
                          "bg-gray-600"
                        )} />
                      </div>
                      <div className="flex flex-col items-start overflow-hidden text-right">
                        <span className={cn(
                          "text-xs font-bold transition-colors truncate w-32",
                          activeChatId === chat.friendId ? "text-neon-blue" : "text-gray-300 group-hover:text-white"
                        )}>
                          {displayName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {chat.messages.length > 0 ? (
                            <span className="text-[10px] text-gray-500 truncate w-24">
                              {chat.messages[chat.messages.length - 1].text}
                            </span>
                          ) : (
                            <span className="text-[9px] text-gray-600 italic tracking-tight">بدون پیام</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="h-5 min-w-[20px] px-1.5 rounded-full bg-neon-pink text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-neon-pink/20">
                        {chat.unreadCount}
                      </div>
                    )}
                  </button>
                );
              })}
              {chats.length === 0 && (
                <p className="text-[9px] text-gray-700 text-center py-2 italic font-medium opacity-50">هیچ گفتگوی اخیری یافت نشد</p>
              )}
            </div>

            <h3 className="px-4 text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2 pt-2 border-t border-white/5">
              <span className="h-px flex-1 bg-white/5"></span>
              دوستان آنلاین
              <span className="h-px flex-1 bg-white/5"></span>
            </h3>
            <div className="space-y-1">
              {friends.filter(f => f.status !== FriendStatus.OFFLINE).slice(0, 10).map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => openChat(friend.id, friend.displayName)}
                  className="w-full group flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all text-right"
                  dir="rtl"
                >
                   <div className="flex items-center gap-3">
                     <div className="relative">
                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs overflow-hidden">
                           {friend.avatar ? <img src={friend.avatar} alt="" className="h-full w-full" /> : <User size={14} />}
                        </div>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0d0d12]",
                          friend.status === FriendStatus.ONLINE ? "bg-green-500" :
                          friend.status === FriendStatus.IN_GAME ? "bg-neon-purple shadow-[0_0_8px_rgba(160,32,240,0.8)]" : 
                          friend.status === FriendStatus.IN_LOBBY ? "bg-neon-blue shadow-[0_0_8px_rgba(0,229,255,0.8)]" :
                          "bg-gray-600"
                        )} />
                     </div>
                     <div className="flex flex-col items-start">
                        <span className="text-[11px] font-bold text-gray-400 group-hover:text-white transition-colors">{friend.displayName}</span>
                        <span className="text-[8px] text-gray-600 font-medium">LVL {friend.level}</span>
                     </div>
                   </div>
                   <MessageCircle size={14} className="text-gray-600 group-hover:text-neon-blue transition-all transform scale-0 group-hover:scale-100" />
                </button>
              ))}
              {friends.length === 0 && (
                <div className="py-8 text-center space-y-2 opacity-30">
                  <User size={24} className="mx-auto text-gray-600" />
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">لیست دوستان خالی است</p>
                </div>
              )}
            </div>
          </div>
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
      <div className={cn("relative flex flex-1 flex-col min-w-0 overflow-hidden transition-colors duration-500", CHAT_THEMES[chatTheme].bgClass)}>
        {/* Themes Overlays */}
        {CHAT_THEMES[chatTheme].radial}
        {CHAT_THEMES[chatTheme].overlay}

        {/* Chat Header - Always sticky at the top of this container */}
        <header className="flex h-12 md:h-16 items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-xl px-3 md:px-8 sticky top-0 z-[40] shrink-0 w-full shadow-2xl">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            {/* Mobile Channel Switcher Toggle */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowChannelMenu(!showChannelMenu);
              }}
              className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white md:hidden"
            >
              <Menu size={16} />
            </button>

            <div className="h-7 w-7 md:h-10 md:w-10 flex items-center justify-center rounded-xl bg-neon-blue/10 border border-neon-blue/20 text-neon-blue shadow-[0_0_15px_rgba(0,229,255,0.1)] overflow-hidden shrink-0">
              {activeChannel.type === 'game' ? (
                <img src={activeChannel.icon} alt="" className="h-full w-full object-cover opacity-80" />
              ) : (
                <Hash size={16} />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-[10px] md:text-base tracking-widest truncate">{activeChannel.name}</h3>
                {activeChannel.type === 'game' && (
                  <span className="hidden xs:inline-block px-1.5 py-0.5 rounded bg-neon-blue/10 text-[8px] text-neon-blue font-black border border-neon-blue/20 uppercase tracking-tighter">Game Room</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 truncate">
                <div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-blue-500 shrink-0"></div>
                <p className="text-[8px] md:text-[10px] text-gray-500 font-bold uppercase tracking-tighter truncate">{memberCount.toLocaleString()} عضو</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3">
            {activeChannel.type === 'game' && lobby && lobby.gameId === activeChannelId.replace("game-", "") && !lobby.isPrivate && (
              <GlowButton 
                variant="pink" 
                size="sm" 
                className="h-7 md:h-9 px-2 md:px-4 text-[8px] md:text-[10px] font-black uppercase"
                onClick={(e) => {
                  e.stopPropagation();
                  sendLobbyInvite();
                }}
              >
                 دعوت
              </GlowButton>
            )}
            <div className="hidden md:block h-6 w-px bg-white/5 mx-1"></div>
            
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowThemeMenu(!showThemeMenu);
                }}
                className={cn(
                  "p-1.5 md:p-2 rounded-lg transition-all",
                  showThemeMenu ? "bg-neon-blue text-dark-bg" : "bg-white/5 text-gray-400 hover:text-white"
                )}
                title="تغییر تم"
              >
                <Palette size={16} />
              </button>
              
              <AnimatePresence>
                {showThemeMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-[#0a0a0f]/95 border border-white/10 rounded-xl shadow-2xl z-50 p-1 backdrop-blur-xl"
                  >
                    <p className="px-3 py-2 text-[10px] font-black text-gray-600 uppercase italic">انتخاب تم پس‌زمینه</p>
                    {Object.entries(CHAT_THEMES).map(([key, theme]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setChatTheme(key as any);
                          setShowThemeMenu(false);
                        }}
                        className={cn(
                          "w-full text-right px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                          chatTheme === key ? "bg-neon-blue/10 text-neon-blue" : "text-gray-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowFriendsSidebar(!showFriendsSidebar);
              }}
              className={cn(
                "p-1.5 md:p-2 rounded-lg transition-all",
                showFriendsSidebar ? "bg-neon-blue text-dark-bg" : "bg-white/5 text-gray-400 hover:text-white"
              )}
            >
              <Users size={16} />
            </button>
            <button className="hidden md:block p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"><MoreVertical size={20} /></button>
          </div>
        </header>

        {/* Mobile Channel Overlay */}
        <AnimatePresence>
          {showChannelMenu && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowChannelMenu(false)}
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 z-[101] w-72 bg-dark-bg/95 border-r border-white/10 p-6 backdrop-blur-xl md:hidden"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-white tracking-widest uppercase text-right">کانال‌ها</h2>
                  <button onClick={() => setShowChannelMenu(false)} className="text-gray-500 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Public Channels */}
                  <div>
                    <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 text-right">عمومی</h3>
                    <div className="space-y-1">
                      {INITIAL_CHANNELS.map((channel) => (
                        <ChannelButton 
                          key={channel.id}
                          channel={channel}
                          active={activeChannelId === channel.id}
                          unreadCount={unreadCounts[channel.id]}
                          onClick={() => {
                            setActiveChannelId(channel.id);
                            setShowChannelMenu(false);
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Game Specific Channels */}
                  {myGamesChannels.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-black text-neon-blue/40 uppercase tracking-widest mb-3 text-right">بازی‌های من</h3>
                      <div className="space-y-1">
                        {myGamesChannels.map((channel) => (
                          <ChannelButton 
                            key={channel.id}
                            channel={channel}
                            active={activeChannelId === channel.id}
                            unreadCount={unreadCounts[channel.id]}
                            onClick={() => {
                              setActiveChannelId(channel.id);
                              setShowChannelMenu(false);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Messages List Area */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-2 md:px-8 py-2 md:py-4 space-y-2 md:space-y-4 scroll-smooth custom-scrollbar relative min-h-0 flex flex-col no-scrollbar overscroll-contain"
          style={{ overscrollBehavior: 'contain' }}
        >
          {/* Date Separator */}
          <div className="flex items-center gap-4 py-4 shrink-0">
             <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/5 to-transparent"></div>
             <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest shrink-0">امروز</span>
             <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/5 to-transparent"></div>
          </div>

          {currentMessages.map((msg) => (
            <MessageItem 
              key={msg.id} 
              message={msg} 
              onReaction={handleReaction}
              onSaveGif={handleSaveGif}
              onReply={(m) => setReplyingTo(m)}
              activeChannelId={activeChannelId}
              onDelete={deleteMessage}
            />
          ))}
          
          {/* Typing Indicator */}
          {Object.keys(typers[activeChannelId] || {}).length > 0 && (
            <div className="flex items-center gap-3 mr-2 opacity-70 animate-in fade-in slide-in-from-bottom-2 shrink-0 pb-4">
               <div className="flex gap-1">
                 <div className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                 <div className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                 <div className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-bounce"></div>
               </div>
               <span className="text-[10px] text-gray-400 font-black">
                  {(() => {
                    const names = Object.values(typers[activeChannelId] || {});
                    if (names.length === 1) return `${names[0]} در حال نوشتن...`;
                    if (names.length === 2) return `${names[0]} و ${names[1]} در حال نوشتن...`;
                    return `${names[0]}، ${names[1]} و ${names.length - 2} نفر دیگر در حال نوشتن...`;
                  })()}
               </span>
            </div>
          )}
          
          <div ref={messagesEndRef} className="shrink-0 h-4" />
        </div>

        {/* Floating Notifications Feedback */}
        <AnimatePresence>
          {showSaveFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white font-black text-[10px] shadow-2xl z-40 backdrop-blur-md"
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
              className="absolute bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-neon-blue text-dark-bg font-black text-[10px] shadow-[0_10px_30px_rgba(0,229,255,0.3)] z-40 hover:scale-105 transition-transform"
            >
              <ChevronDown size={14} />
              پیام‌های جدید
            </motion.button>
          )}
        </AnimatePresence>

        {/* Input Area - Adjusted for mobile */}
        {activeChannelId === 'news' && !isAdmin ? (
          <div className="p-8 pb-12 text-center opacity-50">
             <p className="text-gray-500 font-bold text-sm tracking-tighter">فقط ادمین‌ها می‌توانند در این کانال محتوا منتشر کنند</p>
          </div>
        ) : (
          <div className="p-2 md:p-8 bg-gradient-to-t from-dark-bg to-transparent relative z-30 flex flex-col items-center shrink-0 w-full overflow-hidden">
            <div className="w-full max-w-4xl relative flex flex-col px-1 md:px-0">
              {/* Reply Indicator - Discord Style */}
              <AnimatePresence>
                {replyingTo && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center justify-between px-4 py-2 bg-black/40 border border-white/5 rounded-2xl mb-2 text-xs backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Reply size={14} className="text-neon-blue shrink-0" />
                      <span className="text-gray-500 font-bold whitespace-nowrap">در پاسخ به <span className="text-neon-blue">{replyingTo.senderName}</span>:</span>
                      <span className="text-gray-300 truncate opacity-60 italic">{replyingTo.text}</span>
                    </div>
                    <button 
                      onClick={() => setReplyingTo(null)}
                      className="p-1 hover:bg-white/10 rounded-lg text-gray-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
  
              {/* GIF Picker Popover Removed */}
  
            <div className="relative group flex flex-row-reverse">
              <div className="absolute inset-0 bg-neon-blue/5 rounded-[24px] blur-2xl group-focus-within:bg-neon-blue/10 transition-all"></div>
              <div className="relative flex flex-1 items-center p-2 rounded-[24px] border border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl focus-within:border-neon-blue/30 transition-all">
                <div className="flex items-center gap-1 px-2 border-l border-white/5">
                  <button className="p-2 text-gray-500 hover:text-neon-blue hover:bg-neon-blue/5 rounded-xl transition-all">
                    <Smile size={20} />
                  </button>
                  {activeChannelId === 'news' && isAdmin && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-500 hover:text-neon-blue hover:bg-neon-blue/5 rounded-xl transition-all"
                    >
                      <ImageIcon size={20} />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  maxLength={300}
                  placeholder={`پیام در ${activeChannel.name}...`}
                  className="flex-1 bg-transparent py-4 px-6 text-white text-sm focus:outline-none placeholder:text-gray-600 placeholder:font-bold text-right"
                />
                <div className="flex items-center gap-2 pl-2 border-r border-white/5">
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
        )}
    </div>

      {/* Friends Sidebar - Mobile optimized */}
      <AnimatePresence mode="popLayout">
        {showFriendsSidebar && (
          <div key="friends-sidebar-overlay">
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
                    friends.map((friend, i) => (
                      <motion.div
                        key={friend.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openChat(friend.id, friend.displayName);
                          setShowFriendsSidebar(false);
                        }}
                        className={cn(
                          "group relative flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer",
                          friend.status === FriendStatus.ONLINE || friend.status === FriendStatus.IN_GAME ? "bg-white/5 border border-white/5 hover:border-neon-blue/20" : "bg-black/20 border-transparent grayscale opacity-50",
                          activeChatId === friend.id && "bg-white/10 border-white/20"
                        )}
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
                            friend.status === FriendStatus.ONLINE ? "bg-green-500" :
                            friend.status === FriendStatus.IN_GAME ? "bg-neon-purple shadow-[0_0_8px_rgba(160,32,240,0.8)]" :
                            "bg-gray-600"
                          )} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-black text-white truncate">{friend.displayName}</p>
                            {friend.isFavorite && <Star size={10} className="fill-neon-blue text-neon-blue shrink-0" />}
                          </div>
                          <p className="text-[10px] text-gray-500 font-bold">سطح {friend.level}</p>
                        </div>

                        {/* Actions Overlay - Sticky for active friend */}
                        <div className={cn(
                           "absolute inset-0 bg-dark-bg/95 backdrop-blur-md flex items-center justify-center gap-2 rounded-2xl z-20 transition-all duration-300 px-2",
                           (activeChatId === friend.id || "opacity-0 pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto")
                        )}>
                           <div className="flex items-center justify-center gap-3">
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 openChat(friend.id, friend.displayName);
                                 setShowFriendsSidebar(false);
                               }}
                               className="h-9 w-9 rounded-xl bg-neon-blue/20 text-neon-blue hover:bg-neon-blue hover:text-dark-bg transition-all flex items-center justify-center shadow-lg shadow-neon-blue/10 border border-neon-blue/20"
                               title="پیام"
                             >
                               <MessageSquare size={16} />
                             </button>
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 openProfile({
                                   id: friend.id,
                                   senderId: friend.id,
                                   senderName: friend.displayName,
                                   senderAvatar: friend.avatar || "👤",
                                   senderLevel: friend.level,
                                   senderBadges: [] 
                                 }, false);
                               }}
                               className="h-9 w-9 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center border border-white/5"
                               title="پروفایل"
                             >
                               <User size={16} />
                             </button>
                           </div>
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
            <div className="p-4 pb-20 md:pb-4 bg-white/5 border-t border-white/5">
              <Link to="/friends" onClick={() => setShowFriendsSidebar(false)}>
                <GlowButton variant="blue" className="w-full !rounded-2xl text-xs font-black h-12 shadow-neon-blue/10">
                  یافتن دوستان جدید
                </GlowButton>
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </div>
  );
};
