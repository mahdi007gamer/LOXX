import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { NeonCard } from "../components/ui/NeonCard";
import { GlowButton } from "../components/ui/GlowButton";
import { Input } from "../components/ui/Input";
import { LobbyInviteCard } from "../components/ui/LobbyInviteCard";
import { SmartImage } from "../components/ui/SmartImage";
import { getAvatarFallbacks } from "../lib/avatar";
import { getFileUrl } from "../lib/constants";
import { Send, Hash, Users, MoreVertical, Plus, Smile, Image as ImageIcon, Reply, Heart, ChevronDown, Award, Star, Zap, Crown, Play, Check, Menu, X, MessageSquare, User, Trophy, Palette, Trash, MessageCircle, Search, UserPlus as UserPlusIcon, Settings, Flag, AlertTriangle, Radio, VolumeX } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useGames } from "../context/GamesContext";
import { useFriends } from "../context/FriendsContext";
import { useLobby } from "../context/LobbyContext";
import { BadgeType, ChatMessage, Channel, MembershipType, FriendStatus } from "../types";

import { useProfilePopover } from "../context/ProfilePopoverContext";
import { useAuth } from "../context/AuthContext";
import { UserBadges } from "../components/ui/UserBadges";
import { chatSocket } from "../lib/socket";
import { toast } from "react-hot-toast";
import api from "../lib/api";

// --- Sub-components ---

interface BadgeIconProps {
  type: BadgeType | any;
  key?: any;
}

function BadgeIcon({ type }: BadgeIconProps) {
  // Legacy BadgeIcon - we prefer UserBadges component for dynamic icons from server
  switch(type) {
    case BadgeType.STREAMER: return <div title="Streamer" className="text-neon-purple animate-pulse"><Radio size={12} /></div>;
    case BadgeType.PRO: return <div title="Pro Player" className="text-neon-pink"><Award size={12} fill="currentColor" /></div>;
    case BadgeType.LOBBY_MASTER: return <div title="Lobby Master" className="text-yellow-500"><Star size={12} fill="currentColor" /></div>;
    case BadgeType.VIP: return <div title="VIP" className="text-yellow-500 animate-pulse"><Crown size={12} fill="currentColor" /></div>;
    case BadgeType.CHAMPION: return <div title="Champion" className="text-yellow-400"><Trophy size={12} fill="currentColor" /></div>;
    case BadgeType.PLUS: return <div title="Plus" className="text-neon-blue"><Zap size={12} fill="currentColor" /></div>;
    default: return null;
  }
}

interface MessageItemProps {
  message: ChatMessage;
  onReaction: (msgId: string, emoji: string) => void;
  onSaveGif: (url: string) => void;
  onReply: (message: ChatMessage) => void;
  activeChannelId: string;
  onDelete: (msgId: string) => void;
  onReport?: (msg: ChatMessage) => void;
  onPin?: () => void;
  isGroupOwner?: boolean;
  onWarnUser?: (targetUserId: string, senderName: string) => void;
  onMuteUser?: (targetUserId: string, senderName: string) => void;
  [key: string]: any; 
}

function MessageItem({ message, onReaction, onSaveGif, onReply, activeChannelId, onDelete, onReport, onPin, isGroupOwner, onWarnUser, onMuteUser }: MessageItemProps) {
  const { openProfile } = useProfilePopover();
  const { user } = useAuth();
  const isAdmin = (user as any)?.role === 'ADMIN';
  const isHelper = (user as any)?.role === 'HELPER';
  const [showActions, setShowActions] = useState(false);

  // Level based colors
  const isStreamer = message.senderBadges?.includes(BadgeType.STREAMER) || (message as any).userRole === 'STREAMER' || (message as any).senderRole === 'STREAMER';
  const isVIP = message.senderBadges?.includes(BadgeType.VIP);
  const isPLUS = message.senderBadges?.includes(BadgeType.PLUS);
  const isChamp = message.senderBadges?.includes(BadgeType.CHAMPION);
  let metadata: any = null;
  try {
    metadata = typeof (message as any).vipMetadata === 'string' ? JSON.parse((message as any).vipMetadata) : (message as any).vipMetadata;
  } catch(e) {}

  const nameColorClass = isStreamer ? "text-neon-purple drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" :
                        isVIP ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" :
                        isChamp ? "text-yellow-500" :
                        isPLUS ? "text-neon-blue" :
                        message.senderLevel > 40 ? "text-neon-blue shadow-[0_0_8px_rgba(0,229,255,0.3)]" : 
                        message.senderLevel > 20 ? "text-neon-pink" : "text-white/80";

  const getBubbleStyle = () => {
    if (!metadata || !metadata.chatStyle) return {};
    return {
      backgroundColor: metadata.chatStyle.bubbleColor || undefined,
      color: metadata.chatStyle.textColor || undefined,
      borderColor: metadata.chatStyle.bubbleColor ? `${metadata.chatStyle.bubbleColor}40` : undefined
    };
  };

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
            senderAvatar: message.senderAvatar || message.avatarUrl,
            bannerUrl: (message as any).bannerUrl || message.avatarUrl,
            vipMetadata: (message as any).vipMetadata,
            role: (message as any).userRole,
            senderLevel: message.senderLevel,
            senderBadges: message.senderBadges,
            id: message.senderId,
            membership: (message as any).membership ? (message as any).membership : isVIP ? MembershipType.VIP : isPLUS ? MembershipType.PLUS : MembershipType.NONE
          }, message.self);
        }}
      >
        <div className={cn(
          "h-9 w-9 md:h-11 md:w-11 rounded-xl flex items-center justify-center text-lg md:text-xl relative z-[10] transition-transform hover:scale-105 shadow-xl bg-cover bg-center overflow-visible",
          message.self ? "bg-neon-pink text-white" : "bg-neon-blue text-white",
          isVIP && "border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]",
          isStreamer && !isVIP && "border-2 border-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.4)]",
          isPLUS && !isStreamer && !isVIP && "border-2 border-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.3)]"
        )}>
          <SmartImage 
            src={message.senderAvatar || message.avatarUrl || ""}
            fallbacks={getAvatarFallbacks(message.senderName)}
            isVipEnabled={isVIP}
            className="w-full h-full object-cover rounded-xl"
            alt={message.senderName}
          />
          
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
              className={cn("text-[11px] font-black tracking-tight cursor-pointer hover:underline flex items-center gap-1 transition-all", nameColorClass, (metadata?.shinyName) && "animate-pulse")}
              style={{
                ...(metadata && metadata.colors && (isVIP || isPLUS) ? 
                  (metadata.colors.textGradient 
                    ? { backgroundImage: `linear-gradient(to right, ${metadata.colors.text}, ${metadata.colors.textGradient})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }
                    : { color: metadata.colors.text }) 
                  : {}),
                ...(metadata?.fontStyle === "lightning" ? { textShadow: "0 0 5px #fff, 0 0 10px #0ff", animation: "pulse 2s infinite" } : {}),
                ...(metadata?.fontStyle === "fire" ? { textShadow: "0 -2px 4px #ff3, 0 -4px 10px #f80", animation: "pulse 1.5s infinite" } : {}),
                ...(metadata?.fontStyle === "glitch" ? { textShadow: "1px 0 0 red, -1px 0 0 cyan", animation: "pulse 0.5s infinite" } : {}),
              }}
              onClick={(e) => {
                e.stopPropagation();
              openProfile({
                senderName: message.senderName,
                senderAvatar: message.senderAvatar,
                bannerUrl: (message as any).bannerUrl,
                vipMetadata: (message as any).vipMetadata,
                role: (message as any).userRole,
                senderLevel: message.senderLevel,
                senderBadges: message.senderBadges,
                id: message.senderId,
                membership: isVIP ? MembershipType.VIP : isPLUS ? MembershipType.PLUS : MembershipType.NONE
              }, message.self);
              }}
            >
              {message.senderName}
              {isStreamer && <Radio size={12} className="text-neon-purple animate-pulse" />}
            </span>
          
          <div className={cn(
            "flex gap-1 items-center",
            message.self ? "flex-row" : "flex-row-reverse"
          )}>
             {/* Dynamic Badges from Server */}
             {(message as any).badges && (
               <UserBadges 
                 badges={(message as any).badges} 
                 className={cn(message.self ? "flex-row" : "flex-row-reverse")}
               />
             )}
             {/* Legacy Badge Types */}
             {message.senderBadges
                ?.filter(b => !((message as any).badges?.length > 0 && b === BadgeType.VIP))
                .map((b, i) => <BadgeIcon key={i} type={b as any} />)}
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
            {isVIP && (
              <div className="absolute inset-0 bg-yellow-400/5 blur-3xl rounded-full scale-150 animate-pulse pointer-events-none hidden md:block" />
            )}
            
            {/* Streamer Glow Backing */}
            {isStreamer && !isVIP && (
              <div className="absolute inset-0 bg-neon-purple/10 blur-3xl rounded-full scale-110 animate-pulse pointer-events-none hidden md:block" />
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
              {!message.self && onReport && (
                 <button
                   className="h-6 w-6 md:h-7 md:w-7 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-white/5 relative z-10 shrink-0"
                   onClick={(e) => { e.stopPropagation(); onReport(message); setShowActions(false); }}
                   title="گزارش محتوا"
                 >
                   <Flag size={14} />
                 </button>
              )}
              {onPin && (
                 <button 
                   className="h-6 w-6 md:h-7 md:w-7 flex items-center justify-center text-gray-400 hover:text-yellow-500 transition-colors rounded-lg hover:bg-white/5 relative z-10 shrink-0" 
                   onClick={(e) => { e.stopPropagation(); onPin(); setShowActions(false); }}
                   title="پین پیام"
                 >
                   <Star size={14} />
                 </button>
              )}
              {(isAdmin || isHelper || message.self || isGroupOwner) && (
                <button 
                  className="h-6 w-6 md:h-7 md:w-7 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-white/5 relative z-10 shrink-0" 
                  onClick={(e) => { e.stopPropagation(); onDelete(message.id); setShowActions(false); }}
                  title="حذف پیام"
                >
                  <Trash size={14} />
                </button>
              )}
              {(isAdmin || isHelper) && !message.self && (
                <>
                  <button 
                    className="h-6 w-6 md:h-7 md:w-7 flex items-center justify-center text-gray-400 hover:text-yellow-500 transition-colors rounded-lg hover:bg-white/5 relative z-10 shrink-0" 
                    onClick={(e) => { e.stopPropagation(); onWarnUser?.(message.senderId, message.senderName); setShowActions(false); }}
                    title="ثبت اخطار برای کاربر"
                  >
                    <AlertTriangle size={14} className="text-yellow-500" />
                  </button>
                  <button 
                    className="h-6 w-6 md:h-7 md:w-7 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-white/5 relative z-10 shrink-0" 
                    onClick={(e) => { e.stopPropagation(); onMuteUser?.(message.senderId, message.senderName); setShowActions(false); }}
                    title="ساکت کردن (Mute)"
                  >
                    <VolumeX size={14} className="text-red-500" />
                  </button>
                </>
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
              style={getBubbleStyle()}
              className={cn(
                "relative rounded-2xl overflow-hidden shadow-2xl transition-all border w-fit max-w-full",
                "rtl text-right break-words",
                activeChannelId === 'news'
                  ? "bg-[#0b0c14] text-white border-white/5 shadow-none rounded-xl px-0"
                  : message.self 
                    ? "bg-[#140e1a] text-white border-neon-pink/20 rounded-tr-none" 
                    : "bg-white/5 text-gray-100 border-white/10 rounded-tl-none",
                isVIP && "border-yellow-400/40 bg-gradient-to-br from-yellow-400/[0.12] to-transparent shadow-[0_0_40px_rgba(250,204,21,0.12)]",
                isStreamer && !isVIP && "border-neon-purple/40 bg-gradient-to-br from-neon-purple/[0.12] to-transparent shadow-[0_0_40px_rgba(168,85,247,0.12)]",
                isPLUS && !isStreamer && !isVIP && "border-neon-blue/40 bg-gradient-to-br from-neon-blue/[0.12] to-transparent shadow-[0_0_30px_rgba(0,229,255,0.12)]",
                metadata?.specialFrame && metadata?.frame === "lightning" && "!border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.5)] animate-pulse",
                metadata?.specialFrame && metadata?.frame === "fire" && "!border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)] animate-bounce",
                metadata?.specialFrame && metadata?.frame === "glitch" && "!border-pink-500 shadow-[inset_0_0_10px_rgba(236,72,153,0.5),0_0_15px_rgba(236,72,153,0.8)]",
                metadata?.specialFrame && metadata?.frame === "neon_pulse" && "!border-cyan-400 shadow-[0_0_30px_#00e5ff] animate-[pulse_1s_infinite]",
                metadata?.specialFrame && metadata?.frame === "gold_aura" && "!border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.7)]"
              )}
            >
               {/* VIP/PLUS Shimmer Effect */}
               {(isVIP || isPLUS || isStreamer) && (
                <motion.div 
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className={cn(
                    "absolute inset-0 skew-x-12 pointer-events-none z-0 mix-blend-overlay",
                    isVIP ? "bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" : 
                    isStreamer ? "bg-gradient-to-r from-transparent via-neon-purple/40 to-transparent" : 
                    "bg-gradient-to-r from-transparent via-neon-blue/40 to-transparent"
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
  
              <div className="px-4 pt-3 pb-1.5">
                {/* Image Handling - News channel shows image first */}
                {activeChannelId === 'news' && message.image && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-white/10 shadow-xl max-w-full">
                    <img src={getFileUrl(message.image)} alt="News image" className="w-full h-auto object-contain cursor-pointer" onClick={() => window.open(getFileUrl(message.image), '_blank')} />
                  </div>
                )}

                {/* Text Handling */}
                {message.text && (
                  <p className={cn("leading-relaxed text-[13px] font-medium text-gray-200 break-words break-all whitespace-pre-wrap", 
                    (message.image && activeChannelId !== 'news') || message.lobbyInvite ? "mb-2" : "mb-0"
                  )} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
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
                    <img src={getFileUrl(message.image)} alt="Chat image" className="w-full h-auto object-contain cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => window.open(getFileUrl(message.image), '_blank')} />
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
  key?: any;
}

function ChannelButton({ channel, active, onClick, unreadCount }: ChannelButtonProps) {
  return (
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
          <img src={getFileUrl(channel.icon)} alt="" className="h-5 w-5 rounded-md object-cover grayscale group-hover:grayscale-0 transition-all opacity-60 group-hover:opacity-100" />
          <div className={cn("absolute -bottom-0.5 -left-0.5 h-2 w-2 rounded-full border-2 border-black", active ? "bg-neon-blue" : "bg-gray-700")}></div>
        </div>
      ) : channel.type === "elite" ? (
         (channel as any).avatarUrl ? (
           <img src={getFileUrl((channel as any).avatarUrl)} alt="" className="h-5 w-5 rounded-full object-cover" />
         ) : (
           <Crown size={16} className={active ? "text-yellow-400" : "text-gray-500"} />
         )
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
}

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
      { id: "general", name: "چت عمومی", type: "public", users: 0 },
      { id: "news", name: "اخبار گیمینگ", type: "public", users: 0 },
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
  const { user, isSidebarCollapsed: authIsSidebarCollapsed } = useAuth();
  const isSidebarCollapsed = authIsSidebarCollapsed;
  const isVipUser = ((user as any)?.membership === "VIP" || (user as any)?.profile?.membershipType === "VIP" || (user as any)?.role === "ADMIN");
  const isVipOrPlus = ((user as any)?.membership === "VIP" || (user as any)?.membership === "PLUS" || (user as any)?.profile?.membershipType === "VIP" || (user as any)?.profile?.membershipType === "PLUS" || (user as any)?.role === "ADMIN");
  const { lobby } = useLobby();
  const [searchParams] = useSearchParams();
  const [activeChannelId, setActiveChannelId] = useState("general");
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [channelUsers, setChannelUsers] = useState<Record<string, number>>({});
  const [memberCount, setMemberCount] = useState(0);
  const [gameMembers, setGameMembers] = useState<any[]>([]);
  const [typers, setTypers] = useState<Record<string, Record<string, string>>>({});
  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifTab, setGifTab] = useState("emojis");
  const [isUploadingGif, setIsUploadingGif] = useState(false);
  const [savedGifs, setSavedGifs] = useState<string[]>([]);
  const [showSaveFeedback, setShowSaveFeedback] = useState(false);
  const gifUploadRef = useRef<HTMLInputElement>(null);
  const [showFriendsSidebar, setShowFriendsSidebar] = useState(false);
  const [showChannelMenu, setShowChannelMenu] = useState(false);
  const [chatTheme, setChatTheme] = useState<keyof typeof CHAT_THEMES>((localStorage.getItem("loxx-chat-theme") as any) || "aura");
  
  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
  
  const [isSocketConnected, setIsSocketConnected] = useState(chatSocket.connected);

  useEffect(() => {
    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);
    
    setIsSocketConnected(chatSocket.connected);

    chatSocket.on("connect", onConnect);
    chatSocket.on("disconnect", onDisconnect);

    return () => {
      chatSocket.off("connect", onConnect);
      chatSocket.off("disconnect", onDisconnect);
    };
  }, []);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showVipGroupModal, setShowVipGroupModal] = useState(false);
  const [showEliteSettingsModal, setShowEliteSettingsModal] = useState(false);
  const [eliteSettingsData, setEliteSettingsData] = useState({ title: "", avatarUrl: "" });
  const [reportingMessage, setReportingMessage] = useState<ChatMessage | null>(null);
  const [reportReason, setReportReason] = useState("");

  // Builtin GIF gallery states
  const [builtinGifs, setBuiltinGifs] = useState<any[]>([]);
  const [builtinSearch, setBuiltinSearch] = useState("");

  useEffect(() => {
    if (showGifPicker && gifTab === "builtin") {
      api.get(`/upload/gifs?q=${builtinSearch}`)
        .then(res => {
          setBuiltinGifs(res.data || []);
        })
        .catch(err => {
          console.error("[CHAT] Failed to load builtin gallery gifs:", err);
        });
    }
  }, [showGifPicker, gifTab, builtinSearch]);

  const handleGroupAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("فقط فایل‌های JPG، PNG، GIF و WEBP مجاز هستند");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم فایل نباید بیشتر از ۵ مگابایت باشد");
      return;
    }

    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      toast.error("فقط فرمت‌های jpg و png مجاز هستند");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post("/upload?target=chat", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setEliteSettingsData(p => ({ ...p, avatarUrl: data.url }));
      toast.success("تصویر با موفقیت آپلود شد");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "خطا در آپلود تصویر");
    }
  };

  const handleRegenerateInviteLink = async () => {
    try {
      const res = await api.post(`/elite/${activeChannelId}/regenerate-link`);
      // Update local state by forcing a refresh or just showing link
      toast.success("لینک جدید تولید شد: " + window.location.origin + "/invite/" + res.data.data.inviteCode);
    } catch(err: any) {
      toast.error(err.response?.data?.error?.message || "خطا در ساخت لینک اختصاصی");
    }
  };
  const [showEliteInviteModal, setShowEliteInviteModal] = useState(false);
  const [inviteSearchQuery, setInviteSearchQuery] = useState("");
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>([]);
  const [vipGroupName, setVipGroupName] = useState("");
  const [eliteGroups, setEliteGroups] = useState<any[]>([]);
  const [proGroups, setProGroups] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("loxx-chat-theme", chatTheme);
  }, [chatTheme]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { friends, chats, activeChatId, openChat, sendMessage: sendFriendMessage } = useFriends();
  const [isFriendsLoading, setIsFriendsLoading] = useState(false);

  useEffect(() => {
    const targetUserId = searchParams.get("user");
    if (targetUserId) {
      // Find friend by id to open chat
      const targetFriend = friends.find(f => f.id === targetUserId);
      if (targetFriend) {
        openChat(targetUserId);
        setActiveChannelId("DMs"); // Ensure DM view is active if applicable
      } else {
        // Optimistic open in case friend isn't loaded yet?
        openChat(targetUserId); 
        setActiveChannelId("DMs");
      }
    }
  }, [searchParams, friends, openChat]);

  useEffect(() => {
    if (showFriendsSidebar) {
      setIsFriendsLoading(true);
      const timer = setTimeout(() => setIsFriendsLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showFriendsSidebar]);

  // Load Elite Groups
  const loadEliteGroups = async () => {
    try {
      const res = await api.get("/elite");
      if (res.data.data) {
        const elite = [];
        const pro = [];
        for (const c of res.data.data) {
          const mapped = {
            id: c.id,
            name: c.title,
            type: c.type === "PRO" ? "pro" : "elite",
            users: c.members.length,
            icon: c.type === "PRO" ? "🏆" : "👑",
            avatarUrl: c.avatarUrl,
            ownerId: c.ownerId,
            rawMembers: c.members,
            metadata: c.metadata
          };
          if (c.type === "PRO") pro.push(mapped);
          else elite.push(mapped);
        }
        setEliteGroups(elite);
        setProGroups(pro);
      }
    } catch(err) {
      console.error("Failed to load groups", err);
    }
  };

  const handleUpdateEliteGroup = async () => {
    if (!eliteSettingsData.title.trim()) {
       toast.error("نام گروه نمی‌تواند خالی باشد");
       return;
    }
    try {
      await api.put(`/elite/${activeChannelId}`, eliteSettingsData);
      toast.success("تنظیمات گروه با موفقیت به‌روز شد");
      loadEliteGroups();
      setShowEliteSettingsModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "خطا در به‌روزرسانی گروه");
    }
  };

  const handleDeleteEliteGroup = async () => {
    if (!confirm("آیا از حذف کامل این گروه اطمینان دارید؟")) return;
    try {
      await api.delete(`/elite/${activeChannelId}`);
      toast.success("گروه با موفقیت حذف شد");
      setShowEliteSettingsModal(false);
      setActiveChannelId("global");
      loadEliteGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "خطا در حذف گروه");
    }
  };

  const handleRemoveEliteMember = async (memberId: string) => {
    if (!confirm("آیا از اخراج این کاربر اطمینان دارید؟")) return;
    try {
      await api.delete("/elite/members", { data: { groupId: activeChannelId, memberId } });
      toast.success("کاربر از گروه اخراج شد");
      loadEliteGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "خطا در اخراج کاربر");
    }
  };

  const handleTimeoutEliteMember = async (targetUserId: string, durationMinutes: number) => {
    try {
      if (!confirm(`آیا مطمئن هستید که می‌خواهید کاربر را برای ${durationMinutes} دقیقه معلق کنید؟`)) return;
      await api.post(`/elite/${activeChannelId}/timeout`, { targetUserId, durationMinutes });
      toast.success(`کاربر برای ${durationMinutes} دقیقه معلق شد`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "خطا در معلق کردن کاربر");
    }
  };

  const handleBanEliteMember = async (targetUserId: string) => {
    if (!confirm("آیا مطمئن هستید؟ کاربر برای همیشه از گروه بن خواهد شد")) return;
    try {
      await api.post(`/elite/${activeChannelId}/ban`, { targetUserId });
      toast.success("کاربر با موفقیت از گروه بن شد");
      loadEliteGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "خطا در بن کردن کاربر");
    }
  };

  const handlePinMessage = async (messageId: string) => {
    try {
       await api.post(`/elite/${activeChannelId}/pin`, { messageId });
       toast.success("پیام با موفقیت پین شد!");
       loadEliteGroups();
    } catch (err: any) {
       toast.error(err.response?.data?.error?.message || "خطا در پین کردن پیام");
    }
  };

  const handleInviteToEliteGroup = async () => {
    if (selectedInvitees.length === 0) {
      toast.error("دوستانی که می‌خواهید دعوت کنید را انتخاب کنید");
      return;
    }
    try {
      await api.post("/elite/members/invite", { groupId: activeChannelId, userIds: selectedInvitees });
      toast.success("دعوتنامه با موفقیت ارسال شد");
      setInviteSearchQuery("");
      setSelectedInvitees([]);
      setShowEliteInviteModal(false);
    } catch (err: any) {
       toast.error(err.response?.data?.error?.message || "خطا در ارسال دعوتنامه");
    }
  };

  const handleLeaveEliteGroup = async () => {
    try {
      await api.post("/elite/members/leave", { groupId: activeChannelId });
      toast.success("با موفقیت از گروه خارج شدید");
      loadEliteGroups();
      setActiveChannelId("general");
    } catch(err: any) {
      toast.error(err.response?.data?.error?.message || "خطا در خروج از گروه");
    }
  };

  useEffect(() => {
    loadEliteGroups();
  }, []);

  useEffect(() => {
    // Join channel and fetch history when switched
    console.log("[CHAT] Switching to channel:", activeChannelId);
    
    // Determine the type explicitly based on the activeChannel object
    const getTargetType = () => {
      if (!activeChannel) return "channel";
      if (activeChannel.type === 'dm') return "user";
      if (activeChannel.type === 'game') return "channel";
      return "channel"; 
    };

    const joinChannel = async () => {
      const type = getTargetType();
      
      // Attempt to load history via REST API first for better reliability
      try {
        const res = await api.get(`/chat/${activeChannelId}/messages`, {
          params: { type, limit: 50 }
        });
        if (res.data.status === "success" && res.data.data) {
          setMessages(prev => ({ 
            ...prev, 
            [activeChannelId]: res.data.data.map((m: any) => formatIncomingMessage(m, user?.id)) 
          }));
        }
      } catch (err) {
        console.warn("[CHAT] Fallback history fetch failed, relying on socket join:", err);
      }

      chatSocket.emit("chat.join", { type, id: activeChannelId }, (res: any) => {
        console.log("[CHAT] Join response for", activeChannelId, ":", res);
        if (res.status === "ok" && res.data) {
          // If messages weren't loaded by REST or we want to overwrite with freshest socket data
          if (res.data.messages && res.data.messages.length > 0) {
            setMessages(prev => ({ ...prev, [activeChannelId]: res.data.messages.map((m: any) => formatIncomingMessage(m, user?.id)) }));
          }
          if (res.data.memberCount !== undefined) {
            setMemberCount(res.data.memberCount);
            setChannelUsers(prev => ({ ...prev, [activeChannelId]: res.data.memberCount }));
          }
          setUnreadCounts(prev => ({ ...prev, [activeChannelId]: 0 }));
        } else if (res.status === "error") {
          console.error("[CHAT] Error joining channel:", activeChannelId, res.error);
          toast.error(`خطا در اتصال به کانال: ${res.error?.message || "نامشخص"}`);
        }
      });
    };

    joinChannel();
    chatSocket.on("connect", joinChannel);

    return () => {
      chatSocket.off("connect", joinChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannelId, user?.id]);

  useEffect(() => {
    const handleNewMessage = (msg: any) => {
       const isSelf = msg.from.userId === user?.id;
       const channelId = msg.targetType === "channel" 
         ? (msg.targetId || msg.channelId) 
         : (isSelf ? msg.targetId : msg.from.userId);
         
       if (!channelId) return;

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
        const targetChannelId = Object.keys(prev).find(chId => prev[chId]?.some(m => m.id === data.messageId));
        if (!targetChannelId) return prev;
        return {
          ...prev,
          [targetChannelId]: prev[targetChannelId].map(m => 
            m.id === data.messageId ? { ...m, reactions: data.reactions } : m
          )
        };
      });
    };
    chatSocket.on("chat.reaction", handleReactionUpdate);

    const handleDelete = (data: { messageId: string }) => {
      setMessages(prev => {
        const targetChannelId = Object.keys(prev).find(chId => prev[chId]?.some(m => m.id === data.messageId));
        if (!targetChannelId) return prev;
        return {
          ...prev,
          [targetChannelId]: prev[targetChannelId].map(m => 
            m.id === data.messageId ? { ...m, isDeleted: true, text: "این پیام حذف شده است." } : m
          )
        };
      });
    };
    chatSocket.on("chat.delete", handleDelete);

    const handleRemove = (data: { messageId: string }) => {
      setMessages(prev => {
        const targetChannelId = Object.keys(prev).find(chId => prev[chId]?.some(m => m.id === data.messageId));
        if (!targetChannelId) return prev;
        return {
          ...prev,
          [targetChannelId]: prev[targetChannelId].filter(m => m.id !== data.messageId)
        };
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

  const myGamesChannels = (games || [])
    .filter(g => myGames?.includes(g.id))
    .map(g => ({
      id: `game-${g.id}`,
      name: `چت ${g.title}`,
      type: "game" as const,
      users: (g as any).memberCount || parseInt(g.playerCount?.replace(/[^0-9]/g, '') || '0') || 0,
      icon: g.image
    }));

  const allChannels = [...INITIAL_CHANNELS, ...myGamesChannels, ...eliteGroups, ...proGroups];
  const friendChat = chats.find(c => c.friendId === activeChannelId);
  const friend = friends.find(f => f.id === activeChannelId);

  const activeChannel = allChannels.find(c => c.id === activeChannelId) || 
    (friendChat || friend ? { 
      id: activeChannelId, 
      name: friend?.displayName || friendChat?.tempDisplayName || "گفتگو", 
      type: 'dm',
      icon: friend?.avatar || (friend as any)?.avatarUrl || "👤"
    } : allChannels[0] || INITIAL_CHANNELS[0]);

  // Handle typing state correctly by extracting the getter inside the effect
  useEffect(() => {
    if (activeChannelId) {
      const getTargetType = () => {
        if (!activeChannel) return "channel";
        if (activeChannel.type === 'dm') return "user";
        return "channel"; 
      };

      chatSocket.emit("chat.typing", { 
        target: { type: getTargetType(), id: activeChannelId }, 
        isTyping: input.length > 0 
      });
    }
  }, [input, activeChannelId, activeChannel]);

  const formatIncomingMessage = (msg: any, currentUserId?: string): ChatMessage => {
     let badges: BadgeType[] = [];
     const from = msg.from || {};
     
     // Handle badges from the new unified format
     if (from.badges && Array.isArray(from.badges)) {
        badges = from.badges.map((b: any) => (b.type || b.name || "") as BadgeType).filter(t => !!t);
     }
     
     // Fallback for simple membership types
     if ((from.membership === "VIP" || from.membershipType === "VIP") && !badges.includes(BadgeType.VIP)) badges.push(BadgeType.VIP);
     if ((from.membership === "PLUS" || from.membershipType === "PLUS") && !badges.includes(BadgeType.PLUS)) badges.push(BadgeType.PLUS);
     
     const isNewsChannel = msg.targetId === 'news' || msg.channelId === 'news';
     
     let text = msg.content || "";
     let image: string | undefined;
     let gif: string | undefined;
     let lobbyInvite: any | undefined;

     if (typeof text === 'string') {
       if (text.includes("[IMAGE]:")) {
         const parts = text.split("[IMAGE]:");
         text = parts[0].trim();
         image = parts[1]?.trim();
       }

       if (text.includes("[GIF]:")) {
         const parts = text.split("[GIF]:");
         text = parts[0].trim();
         gif = parts[1]?.trim();
       }

       if (text.includes("[LOBBY_INVITE]:")) {
         const parts = text.split("[LOBBY_INVITE]:");
         text = parts[0].trim();
         try {
           const inviteStr = parts[1] ? parts[1].split("\n")[0].trim() : "";
           if (inviteStr) lobbyInvite = JSON.parse(inviteStr);
         } catch (e) {
           console.error("Failed to parse lobby invite", e);
         }
       }
     }
     
     return {
       id: msg.id,
       senderId: isNewsChannel ? "loxx-system" : (from.userId || "unknown"),
       senderName: isNewsChannel ? "لوکس" : (from.username || "کاربر ناشناس"),
       senderAvatar: isNewsChannel ? "/logo.png" : (from.avatar || from.avatarUrl || ""),
       bannerUrl: isNewsChannel ? undefined : from.bannerUrl,
       vipMetadata: isNewsChannel ? undefined : from.vipMetadata,
       senderLevel: from.level || 1,
       userRole: from.role,
       senderBadges: isNewsChannel ? [] : badges,
       text,
       image,
       gif,
       lobbyInvite: lobbyInvite || msg.lobbyInvite,
       isOnline: isNewsChannel ? true : !!from.isOnline,
       timestamp: new Date(msg.createdAt || Date.now()).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
       isRead: true,
       self: from.userId === currentUserId,
       reactions: msg.reactions || [],
       replyTo: msg.replyTo ? { 
           id: msg.replyTo.id, 
           user: isNewsChannel ? "لوکس" : (msg.replyTo.user || "ناشناس"), 
           text: msg.replyTo.text || "پیام ریپلای شده..." 
        } : (msg.replyToId ? { id: msg.replyToId.toString(), user: "ناشناس", text: "پیام ریپلای شده..." } : undefined)
     };
  };

  const currentMessages = messages[activeChannelId] || [];

  // Update member count based on active channel
  useEffect(() => {
    if (activeChannel) {
      if (activeChannel.type === 'game') {
        const gameId = activeChannel.id.replace("game-", "");
        api.get(`/games/${gameId}`).then(res => {
          if (res.data.status === "success") {
            setMemberCount(res.data.data.memberCount);
            setChannelUsers(prev => ({ ...prev, [activeChannel.id]: res.data.data.memberCount }));
            setGameMembers(res.data.data.members || []);
          }
        }).catch(() => {
          setMemberCount(channelUsers[activeChannel.id] ?? activeChannel.users);
          setGameMembers([]);
        });
      } else if (activeChannel.type === 'elite' || activeChannel.type === 'pro') {
        setMemberCount((activeChannel as any).rawMembers?.length || activeChannel.users);
        setChannelUsers(prev => ({ ...prev, [activeChannel.id]: (activeChannel as any).rawMembers?.length || activeChannel.users }));
        setGameMembers((activeChannel as any).rawMembers || []);
      } else {
        setMemberCount(channelUsers[activeChannel.id] ?? activeChannel.users);
        setGameMembers([]);
      }
    }
  }, [activeChannel]);

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
       senderAvatar: user?.avatarUrl || "",
       bannerUrl: user?.bannerUrl,
       vipMetadata: user?.vipMetadata,
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

    const getTargetType = () => {
      if (!activeChannel) return "channel";
      if (activeChannel.type === 'dm') return "user";
      if (activeChannel.type === 'game') return "channel";
      return "channel"; 
    };

    chatSocket.emit("chat.send", {
      target: { type: getTargetType(), id: activeChannelId },
      content: messageText,
      tempId,
      replyToId: replyingTo?.id
    }, (res: any) => {
       if (res.status === "error") {
          toast.error(res.error?.message || "Error sending message");
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

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`loxx_saved_gifs_${user.id}`);
      if (stored) {
        try {
          setSavedGifs(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [user]);

  const handleSaveGif = (url: string) => {
    if (!isVipOrPlus) {
      toast.error("ذخیره کردن پیام گیف مخصوص کاربران دارای اشتراک VIP یا Plus است.");
      return;
    }

    if (savedGifs.includes(url)) {
      toast.success("این گیف قبلاً ذخیره شده است.");
      return;
    }
    const updated = [url, ...savedGifs];
    setSavedGifs(updated);
    if (user) {
      localStorage.setItem(`loxx_saved_gifs_${user.id}`, JSON.stringify(updated));
    }
    toast.success("گیف با موفقیت در علاقه‌مندی‌ها ذخیره شد!");
  };

  const handleSendGif = (gifUrl: string) => {
    const tempId = `temp-${Date.now()}`;
    const newMsgObj: ChatMessage = {
       id: tempId,
       senderId: user?.id || "me",
       senderName: user?.username || "شما",
       senderAvatar: user?.avatarUrl || "",
       bannerUrl: user?.bannerUrl,
       vipMetadata: user?.vipMetadata,
       senderLevel: 1,
       text: "",
       gif: gifUrl,
       timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
       isRead: true,
       self: true,
       replyTo: replyingTo ? { id: replyingTo.id, user: replyingTo.senderName, text: replyingTo.text } : undefined
    };

    setMessages(prev => ({
       ...prev,
       [activeChannelId]: [...(prev[activeChannelId] || []), newMsgObj]
    }));
    setReplyingTo(null);
    setShowGifPicker(false);

    const getTargetType = () => {
      if (!activeChannel) return "channel";
      if (activeChannel.type === 'dm') return "user";
      if (activeChannel.type === 'game') return "channel";
      return "channel"; 
    };

    chatSocket.emit("chat.send", {
      target: { type: getTargetType(), id: activeChannelId },
      content: `[GIF]:${gifUrl}`,
      tempId,
      replyToId: replyingTo?.id
    }, (res: any) => {
       if (res.status === "error") {
          toast.error(res.error?.message || "Error sending message");
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

  const handleGifUploadAction = async (file: File) => {
    if (file.type !== "image/gif") {
      toast.error("لطفاً فقط فایل‌های با فرمت GIF ارسال کنید.");
      return;
    }
    setIsUploadingGif(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await api.post("/upload/gif", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      
      if (res.data && res.data.url) {
        handleSendGif(res.data.url);
        
        const url = res.data.url;
        if (!savedGifs.includes(url)) {
          const updated = [url, ...savedGifs];
          setSavedGifs(updated);
          if (user) {
            localStorage.setItem(`loxx_saved_gifs_${user.id}`, JSON.stringify(updated));
          }
        }
        
        toast.success(res.data.status === "duplicate" ? "گیف قبلا آپلود شده بود و فورا متصل شد!" : "گیف جدید با موفقیت آپلود شد!");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error?.message || "خطا در آپلود فایل گیف.");
    } finally {
      setIsUploadingGif(false);
    }
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

  const handleWarnUser = (targetUserId: string, senderName: string) => {
    if (confirm(`آیا مطمئن هستید که می‌خواهید به کاربر "${senderName}" اخطار بدهید؟`)) {
      chatSocket.emit("chat.warn_user", { targetUserId }, (res: any) => {
        if (res.status === "ok") {
          toast.success(`اخطار با موفقیت به کاربر ${senderName} اعطا شد. تعداد اخطارهای امروز: ${res.data.warningsToday}`);
        } else {
          toast.error(res.error?.message || "خطا در ثبت اخطار");
        }
      });
    }
  };

  const handleMuteUser = (targetUserId: string, senderName: string) => {
    const minStr = prompt("مدت زمان سکوت (Mute) را بین ۲ تا ۱۰ دقیقه وارد کنید:");
    if (minStr === null) return; // user cancelled

    const duration = parseInt(minStr);
    if (isNaN(duration) || duration < 2 || duration > 10) {
      toast.error("مدت زمان باید یک عدد بین ۲ تا ۱۰ دقیقه باشد.");
      return;
    }

    chatSocket.emit("chat.mute_user", { targetUserId, durationMinutes: duration }, (res: any) => {
      if (res.status === "ok") {
        toast.success(`کاربر ${senderName} به مدت ${duration} دقیقه با موفقیت ساکت (Mute) شد.`);
      } else {
        toast.error(res.error?.message || "خطا در اعمال سکوت");
      }
    });
  };

  return (
    <div 
      className={cn(
        "flex overflow-hidden bg-dark-bg rtl text-right relative overscroll-none",
        isElectron ? "h-[calc(100dvh-164px)] md:h-[calc(100vh-100px)]" : "h-[calc(100dvh-128px)] md:h-[calc(100vh-64px)]"
      )}
      style={{ overscrollBehavior: 'none' }} 
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        if (activeChannelId === 'news' && (user as any)?.role === 'ADMIN') {
          handleFileUpload(file);
        } else if (file.type === "image/gif") {
          if (isVipUser) {
            handleGifUploadAction(file);
            setShowGifPicker(false);
          } else {
            toast.error("برای آپلود گیف‌های اختصاصی به اشتراک VIP نیاز دارید!");
            setShowGifPicker(true);
            setGifTab("upload");
          }
        } else {
          toast.error("در گروه‌ها و چت‌های سراسری تنها آپلود فایل‌های گیف (مخصوص VIP) مجاز است.");
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
        {showEliteSettingsModal && activeChannel.type === 'elite' && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0c10] border border-white/10 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white italic tracking-tighter">تنظیمات گروه نخبگان</h3>
                <button onClick={() => setShowEliteSettingsModal(false)} className="text-gray-500 hover:text-white"><X size={24}/></button>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-2 block">نام گروه</label>
                  <Input 
                    value={eliteSettingsData.title}
                    onChange={(e) => setEliteSettingsData(p => ({ ...p, title: e.target.value }))}
                    placeholder="نام جدید گروه"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-2 block">تصویر پروفایل گروه</label>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {eliteSettingsData.avatarUrl ? <img src={eliteSettingsData.avatarUrl} alt="" className="h-full w-full object-cover" /> : <Users size={20} className="text-gray-500" />}
                    </div>
                    <input type="file" accept="image/png, image/jpeg, image/gif, image/webp" onChange={handleGroupAvatarUpload} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-neon-blue/10 file:text-neon-blue hover:file:bg-neon-blue/20 cursor-pointer" />
                  </div>
                </div>
                
                {/* Invite Link Section for VIP */}
                {isVipUser && (
                  <div className="pt-4 border-t border-white/5 space-y-3">
                    <label className="text-xs font-bold text-gray-400 block">لینک دعوت اختصاصی</label>
                    <div className="flex gap-2">
                       <Input 
                         value={(activeChannel as any).inviteCode ? `${window.location.origin}/invite/${(activeChannel as any).inviteCode}` : "در حال ساخت..."}
                         readOnly
                         dir="ltr"
                         className="flex-1 text-xs"
                       />
                       <button onClick={handleRegenerateInviteLink} className="h-10 px-4 rounded-xl bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-colors shrink-0 font-bold text-xs">
                         بازتولید
                       </button>
                    </div>
                  </div>
                )}
                
                {/* Members List */}
                <div className="pt-4 border-t border-white/5">
                  <label className="text-xs font-bold text-gray-400 mb-3 block">مدیریت اعضا ({((activeChannel as any).rawMembers || []).length} نفر)</label>
                  <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                    {[...((activeChannel as any).rawMembers || [])].sort((a, b) => {
                      if (a.role === 'OWNER') return -1;
                      if (b.role === 'OWNER') return 1;
                      return 0;
                    }).map((m: any) => (
                      <div key={m.userId} className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                         <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 border border-white/10 flex items-center justify-center bg-[#0d0d12]">
                             {m.user?.profile?.avatarUrl ? (
                               <img src={m.user.profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                             ) : (
                               <span className="text-gray-500 text-xs">👤</span>
                             )}
                           </div>
                           <div className="flex flex-col">
                             <span className="text-sm font-bold text-white">{m.user?.profile?.displayName || m.user?.username}</span>
                             <span className="text-[10px] text-gray-400" dir="ltr">@{m.user?.username}</span>
                           </div>
                         </div>
                         {m.userId !== user?.id ? (
                           <div className="flex gap-2 shrink-0">
                               <button onClick={() => {
                                 const mins = prompt("مدت زمان تعلیق به دقیقه (حداکثر 100)", "10");
                                 if(mins) handleTimeoutEliteMember(m.userId, Number(mins));
                               }} title="معلق کردن کاربر" className="text-[10px] bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 px-2 py-1.5 rounded-lg border border-yellow-500/20 font-black uppercase tracking-widest transition-colors shrink-0">
                                 معلق
                               </button>
                               <button onClick={() => handleRemoveEliteMember(m.userId)} title="اخراج کاربر" className="text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500/20 px-2 py-1.5 rounded-lg border border-red-500/20 font-black uppercase tracking-widest transition-colors shrink-0">
                                 اخراج
                               </button>
                               <button onClick={() => handleBanEliteMember(m.userId)} title="بن کامل و جلوگیری از ورود مجدد" className="text-[10px] bg-red-900/30 text-red-500 hover:bg-red-900/50 px-2 py-1.5 rounded-lg border border-red-900/50 font-black uppercase tracking-widest transition-colors shrink-0">
                                 بن
                               </button>
                           </div>
                         ) : (
                           <span className="text-[10px] font-black uppercase tracking-widest text-[#00e5ff] bg-[#00e5ff]/10 px-3 py-1.5 rounded-lg border border-[#00e5ff]/20 shrink-0">
                             مدیر
                           </span>
                         )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
              <div className="flex gap-3 mb-4">
                 <GlowButton variant="yellow" className="flex-1 font-black" onClick={handleUpdateEliteGroup}>ذخیره تغییرات</GlowButton>
                 <button onClick={() => setShowEliteSettingsModal(false)} className="px-6 py-3 rounded-2xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 transition-colors">انصراف</button>
              </div>
              <div className="pt-4 border-t border-red-500/10">
                 <button onClick={handleDeleteEliteGroup} className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 transition-colors">حذف کامل گروه</button>
              </div>
            </motion.div>
          </div>
        )}
        
        {showEliteInviteModal && activeChannel.type === 'elite' && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0c10] border border-white/10 rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl p-6 flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-xl font-black text-white italic tracking-tighter">دعوت دوستان به گروه</h3>
                <button onClick={() => setShowEliteInviteModal(false)} className="text-gray-500 hover:text-white"><X size={24}/></button>
              </div>
              <div className="space-y-4 mb-6 shrink-0">
                <div>
                  <div className="relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text"
                      className="w-full bg-[#15151a] border border-white/5 rounded-2xl px-12 py-3.5 text-sm text-white focus:outline-none focus:border-neon-pink/50 transition-colors"
                      value={inviteSearchQuery}
                      onChange={(e) => setInviteSearchQuery(e.target.value)}
                      placeholder="جستجوی دوست..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-2 custom-scrollbar">
                {friends.filter(f => 
                  f.displayName.toLowerCase().includes(inviteSearchQuery.toLowerCase()) || 
                  f.username.toLowerCase().includes(inviteSearchQuery.toLowerCase())
                ).map(friend => {
                  const isSelected = selectedInvitees.includes(friend.id);
                  // Check if already in group
                  const isMember = ((activeChannel as any).rawMembers || []).some((m: any) => m.userId === friend.id);
                  
                  return (
                    <div 
                      key={friend.id} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer",
                        isMember ? "opacity-50 pointer-events-none border-white/5 bg-white/5" :
                        isSelected ? "bg-neon-pink/10 border-neon-pink/30" : "bg-white/5 border-white/5 hover:bg-white/10"
                      )}
                      onClick={() => {
                        if (isMember) return;
                        setSelectedInvitees(prev => 
                          isSelected ? prev.filter(id => id !== friend.id) : [...prev, friend.id]
                        );
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#0b0c10] overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                          {friend.avatar || (friend as any).avatarUrl ? (
                            <img src={friend.avatar || (friend as any).avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-gray-500 text-xs">👤</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">{friend.displayName}</span>
                          <span className="text-[10px] text-gray-400" dir="ltr">@{friend.username}</span>
                        </div>
                      </div>
                      <div className={cn(
                        "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0",
                        isSelected ? "bg-neon-pink border-neon-pink text-[#0b0c10]" : "border-gray-500 text-transparent"
                      )}>
                        <Check size={14} />
                      </div>
                    </div>
                  );
                })}
                {friends.length === 0 && (
                   <div className="text-center py-6 text-gray-500 text-sm font-bold">دوستی یافت نشد</div>
                )}
              </div>
              
              <div className="flex gap-3 shrink-0">
                 <GlowButton variant="pink" className="flex-1 font-black" onClick={handleInviteToEliteGroup} disabled={selectedInvitees.length === 0}>ارسال دعوتنامه ({selectedInvitees.length})</GlowButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                {newsPostPreview && <img src={newsPostPreview} alt="Preview" className="w-full h-full object-contain" />}
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

      <AnimatePresence>
        {showVipGroupModal && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0d0d12] border border-yellow-400/20 rounded-[40px] w-full max-w-[500px] overflow-hidden shadow-[0_0_50px_rgba(250,204,21,0.1)] p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", (user as any)?.role === "STREAMER" ? "bg-purple-500/10 text-purple-500" : "bg-yellow-400/10 text-yellow-400")}>
                    {(user as any)?.role === "STREAMER" ? <Radio size={24} /> : <Crown size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white italic tracking-tighter">{(user as any)?.role === "STREAMER" ? "ایجاد گروه اختصاصی استریمرها" : "ایجاد گروه نخبگان"}</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{(user as any)?.role === "STREAMER" ? "Streamer Exclusive Group" : "VIP Group System"}</p>
                  </div>
                </div>
                <button onClick={() => setShowVipGroupModal(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-gray-500 hover:text-white transition-colors">
                  <X size={20}/>
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 italic px-2">نام گروه</label>
                  <Input 
                    placeholder="نام گروه رویایی خود را بنویسید..." 
                    value={vipGroupName}
                    onChange={(e) => setVipGroupName(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex gap-4">
                   <GlowButton 
                    variant="yellow" 
                    className="flex-1 h-14 font-black italic uppercase text-xs"
                    onClick={async () => {
                      if (!vipGroupName.trim()) { toast.error("نام گروه الزامی است"); return; }
                      try {
                        await api.post("/elite", { title: vipGroupName });
                        toast.success("گروه VIP با موفقیت ایجاد شد");
                        loadEliteGroups();
                        setShowVipGroupModal(false);
                      } catch (err: any) {
                        toast.error(err.response?.data?.error?.message || "خطا در ایجاد گروه");
                      }
                    }}
                   >
                    تاسیس گروه نخبگان
                   </GlowButton>
                   <button 
                    onClick={() => setShowVipGroupModal(false)} 
                    className="px-8 h-14 rounded-2xl bg-white/5 text-gray-400 font-black italic text-xs hover:bg-white/10 transition-colors uppercase"
                   >
                    انصراف
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Channels Sidebar */}
      <div className={cn("hidden w-80 border-r border-white/5 bg-black/20 backdrop-blur-3xl lg:flex flex-col relative z-20 transition-all duration-300", !isSidebarCollapsed ? "md:mr-64" : "md:mr-20")}>
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-white tracking-widest uppercase">کانال‌ها</h2>
            {(user?.membership === "VIP" || user?.membership === "PLUS" || (user as any)?.role === "STREAMER") && (
              <button 
                title="ایجاد گروه حرفه‌ای"
                onClick={() => setShowVipGroupModal(true)}
                className={cn(
                  "group p-2 rounded-xl transition-all border relative",
                  (user?.membership === "VIP" || (user as any)?.role === "STREAMER")
                    ? "bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400 hover:text-dark-bg border-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.1)] hover:shadow-[0_0_20px_rgba(250,204,21,0.3)]"
                    : "bg-neon-blue/10 text-neon-blue hover:bg-neon-blue hover:text-dark-bg border-neon-blue/20 shadow-[0_0_15px_rgba(0,229,255,0.1)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]"
                )}
              >
                <Plus size={18} />
                <div className="absolute -top-1 -right-1">
                  {(user?.membership === "VIP" || (user as any)?.role === "STREAMER")
                    ? <Crown size={10} className="fill-yellow-400" />
                    : <Zap size={10} className="fill-neon-blue" />
                  }
                </div>
              </button>
            )}
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
                  channel={{ ...channel, users: channelUsers[channel.id] ?? channel.users }}
                  active={activeChannelId === channel.id}
                  unreadCount={unreadCounts[channel.id]}
                  onClick={() => setActiveChannelId(channel.id)}
                />
              ))}
            </div>
          </div>

          {/* Elite Groups */}
          {eliteGroups.length > 0 && (
            <div className="px-4">
              <h3 className="px-4 text-[10px] font-black text-yellow-500/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="h-px flex-1 bg-yellow-500/10"></span>
                گروه‌های نخبگان
                <span className="h-px flex-1 bg-yellow-500/10"></span>
              </h3>
              <div className="space-y-1">
                {eliteGroups.map((channel) => (
                  <ChannelButton 
                    key={channel.id}
                    channel={{ ...channel, users: channelUsers[channel.id] ?? channel.users }}
                    active={activeChannelId === channel.id}
                    unreadCount={unreadCounts[channel.id]}
                    onClick={() => setActiveChannelId(channel.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pro Groups */}
          {proGroups.length > 0 && (
            <div className="px-4">
              <h3 className="px-4 text-[10px] font-black text-neon-blue/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="h-px flex-1 bg-neon-blue/10"></span>
                گروه‌های حرفه‌ای
                <span className="h-px flex-1 bg-neon-blue/10"></span>
              </h3>
              <div className="space-y-1">
                {proGroups.map((channel) => (
                  <ChannelButton 
                    key={channel.id}
                    channel={{ ...channel, users: channelUsers[channel.id] ?? channel.users }}
                    active={activeChannelId === channel.id}
                    unreadCount={unreadCounts[channel.id]}
                    onClick={() => setActiveChannelId(channel.id)}
                  />
                ))}
              </div>
            </div>
          )}

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
                    channel={{ ...channel, users: channelUsers[channel.id] ?? channel.users }}
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
                const membership = (friend as any)?.membership || MembershipType.NONE;

                return (
                  <button
                    key={chat.friendId}
                    onClick={() => openChat(chat.friendId, displayName, chat.tempAvatarUrl)}
                    className={cn(
                      "w-full group flex items-center justify-between p-2.5 rounded-2xl transition-all text-right border border-transparent",
                      activeChatId === chat.friendId 
                        ? "bg-neon-blue/10 border-neon-blue/20 shadow-[0_0_20px_rgba(0,229,255,0.05)]" 
                        : membership === "VIP" ? "hover:bg-yellow-400/5" : membership === "PLUS" ? "hover:bg-neon-blue/5" : "hover:bg-white/5"
                    )}
                    dir="rtl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={cn(
                          "h-9 w-9 rounded-full flex items-center justify-center text-xs overflow-hidden border transition-colors",
                          membership === "VIP" ? "border-yellow-400/30 group-hover:border-yellow-400/50 shadow-[0_0_10px_rgba(250,204,21,0.2)] bg-yellow-400/5" :
                          membership === "PLUS" ? "border-neon-blue/30 group-hover:border-neon-blue/50 shadow-[0_0_10px_rgba(0,229,255,0.2)] bg-neon-blue/5" :
                          "border-white/5 group-hover:border-white/20 bg-white/10"
                        )}>
                           {(avatar || (friend as any)?.avatarUrl) && ((avatar || (friend as any)?.avatarUrl).length > 5 || (avatar || (friend as any)?.avatarUrl).startsWith("/") || (avatar || (friend as any)?.avatarUrl).includes(".")) ? (
                             <img src={avatar || (friend as any)?.avatarUrl} alt="" className="h-full w-full object-cover" />
                           ) : (
                             <span className="text-sm">{avatar || (friend as any)?.avatarUrl || (displayName?.[0] || "👤")}</span>
                           )}
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
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "text-xs font-bold transition-colors truncate max-w-[120px]",
                            membership === 'VIP' ? "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" :
                            membership === 'PLUS' ? "text-neon-blue drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]" :
                            activeChatId === chat.friendId ? "text-neon-blue" : "text-gray-300 group-hover:text-white"
                          )}>
                            {displayName}
                          </span>
                          {membership === 'VIP' && <Crown size={10} className="text-yellow-400" />}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
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

          </div>
        </div>

        {/* User Quick Info Footer */}
        <div className="p-4 bg-white/5 border-t border-white/5">
          <div 
            className="flex items-center gap-3 p-2 rounded-xl bg-black/40 border border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => {
              if (user) {
                openProfile({
                  senderName: user.displayName || user.username,
                  senderAvatar: user.avatarUrl,
                  senderLevel: (user as any).level || 1,
                  id: user.id,
                  membership: user.membership || MembershipType.NONE,
                  vipMetadata: user.vipMetadata,
                  bannerUrl: (user as any).bannerUrl || user.avatarUrl
                }, true);
              }
            }}
          >
            <div className="h-10 w-10 rounded-lg bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center relative overflow-hidden">
              {user?.avatarUrl && (user.avatarUrl.length > 5 || user.avatarUrl.startsWith("/") || user.avatarUrl.includes(".")) ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">{user?.avatarUrl || "👤"}</span>
              )}
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-black"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.displayName || user?.username}</p>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-neon-blue font-bold">LVL {Math.floor((user as any)?.level || 1)}</span>
                <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-neon-blue transition-all" style={{ width: `${(((user as any)?.xp || 0) % 1000) / 1000 * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn("relative flex flex-1 flex-col min-w-0 overflow-hidden transition-all duration-300 transition-colors", CHAT_THEMES[chatTheme].bgClass, !isSidebarCollapsed ? "md:mr-64 lg:mr-0" : "md:mr-20 lg:mr-0")}>
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
              ) : activeChannel.type === 'dm' ? (
                activeChannel.icon && (activeChannel.icon.length > 5 || activeChannel.icon.startsWith("/") || activeChannel.icon.includes(".")) ? (
                  <img src={activeChannel.icon} alt="" className="h-full w-full object-cover" />
                ) : (
                   <span className="text-lg">{activeChannel.icon || "👤"}</span>
                )
              ) : activeChannel.type === 'elite' ? (
                 (activeChannel as any).avatarUrl ? (
                   <img src={(activeChannel as any).avatarUrl} alt="" className="h-full w-full object-cover" />
                 ) : (
                   <Crown size={20} className="text-yellow-400" />
                 )
              ) : activeChannel.type === 'pro' ? (
                 (activeChannel as any).avatarUrl ? (
                   <img src={(activeChannel as any).avatarUrl} alt="" className="h-full w-full object-cover" />
                 ) : (
                   <Trophy size={20} className="text-neon-blue" />
                 )
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
                {activeChannel.type === 'elite' && (
                  <span className="hidden xs:inline-block px-1.5 py-0.5 rounded bg-yellow-400/10 text-[8px] text-yellow-400 font-black border border-yellow-400/20 uppercase tracking-tighter">ELITE VIP</span>
                )}
                {activeChannel.type === 'pro' && (
                  <span className="hidden xs:inline-block px-1.5 py-0.5 rounded bg-neon-blue/10 text-[8px] text-neon-blue font-black border border-neon-blue/20 uppercase tracking-tighter">PRO</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 truncate">
                <div className={`h-1 w-1 md:h-1.5 md:w-1.5 rounded-full ${isSocketConnected ? 'bg-blue-500' : 'bg-red-500'} shrink-0`} title={isSocketConnected ? "متصل" : "قطع ارتباط"}></div>
                <p className="text-[8px] md:text-[10px] text-gray-500 font-bold uppercase tracking-tighter truncate">{memberCount.toLocaleString()} عضو</p>
                {!isSocketConnected && (
                  <span className="text-[10px] text-red-500 font-bold animate-pulse mr-2">در حال اتصال...</span>
                )}
                {gameMembers.length > 0 && (
                  <div className="hidden sm:flex items-center -space-x-2 mr-2">
                    {gameMembers.slice(0, 4).map((member, i) => {
                      const mId = member.id || member.userId || `m-${i}`;
                      const mName = member.username || member.user?.username || "?";
                      const mAvatar = member.avatar || member.user?.profile?.avatarUrl;
                      const mLevel = member.level || member.user?.level || 1;
                      return (
                      <div 
                        key={mId} 
                        className="h-6 w-6 rounded-full border-2 border-[#0a0a0f] overflow-hidden bg-white/5 cursor-pointer hover:translate-y-[-2px] transition-transform"
                        title={mName}
                        onClick={() => openProfile({
                          id: mId,
                          senderId: mId,
                          senderName: mName,
                          senderAvatar: mAvatar || "👤",
                          senderLevel: mLevel,
                          senderBadges: []
                        }, false)}
                      >
                        {mAvatar ? <img src={mAvatar} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-[10px] text-gray-400 font-bold">{mName[0]}</div>}
                      </div>
                      );
                    })}
                    {gameMembers.length > 4 && (
                      <div className="h-6 w-6 rounded-full border-2 border-[#0a0a0f] bg-white/5 flex items-center justify-center text-[8px] text-gray-400 font-bold">
                        +{gameMembers.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3">
            {(activeChannel.type === 'elite' || activeChannel.type === 'pro') && (
              <div className="flex items-center gap-1 md:gap-2">
                 {((activeChannel as any).ownerId === user?.id) ? (
                   <>
                     <GlowButton onClick={() => setShowEliteInviteModal(true)} variant="pink" size="sm" className="hidden sm:flex h-8 px-3 text-[10px] font-black uppercase">دعوت دوستان</GlowButton>
                     <button title="دعوت دوستان" onClick={() => setShowEliteInviteModal(true)} className="sm:hidden p-1.5 rounded-lg bg-neon-pink/10 text-neon-pink hover:bg-neon-pink/20 transition-colors">
                        <UserPlusIcon size={16} />
                     </button>
                     <button title="تنظیمات گروه" onClick={() => { setEliteSettingsData({ title: activeChannel.name, avatarUrl: (activeChannel as any).avatarUrl || "" }); setShowEliteSettingsModal(true); }} className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors">
                        <Settings size={16} />
                     </button>
                   </>
                 ) : (
                   <button onClick={handleLeaveEliteGroup} className="h-8 px-2 md:px-3 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-black hover:bg-red-500/20 transition-colors uppercase border border-red-500/20">خروج</button>
                 )}
              </div>
            )}
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
                          channel={{ ...channel, users: channelUsers[channel.id] ?? channel.users }}
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

                  {/* Elite Groups */}
                  {eliteGroups.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-black text-yellow-500/50 uppercase tracking-widest mb-3 text-right">گروه‌های نخبگان</h3>
                      <div className="space-y-1">
                        {eliteGroups.map((channel) => (
                          <ChannelButton 
                            key={channel.id}
                            channel={{ ...channel, users: channelUsers[channel.id] ?? channel.users }}
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

                  {/* Pro Groups */}
                  {proGroups.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-black text-neon-blue/50 uppercase tracking-widest mb-3 text-right">گروه‌های حرفه‌ای</h3>
                      <div className="space-y-1">
                        {proGroups.map((channel) => (
                          <ChannelButton 
                            key={channel.id}
                            channel={{ ...channel, users: channelUsers[channel.id] ?? channel.users }}
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

                  {/* Game Specific Channels */}
                  {myGamesChannels.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-black text-neon-blue/40 uppercase tracking-widest mb-3 text-right">بازی‌های من</h3>
                      <div className="space-y-1">
                        {myGamesChannels.map((channel) => (
                          <ChannelButton 
                            key={channel.id}
                            channel={{ ...channel, users: channelUsers[channel.id] ?? channel.users }}
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
          className="flex-1 overflow-y-auto overflow-x-hidden px-2 md:px-6 py-2 md:py-4 space-y-2 md:space-y-4 scroll-smooth custom-scrollbar relative min-h-0 flex flex-col no-scrollbar overscroll-contain"
          style={{ overscrollBehavior: 'contain' }}
          dir="rtl"
        >
          {/* Pinned Message */}
          {(() => {
             const activeChannelDetails = [...eliteGroups, ...proGroups].find(c => c.id === activeChannelId);
             const metadataObj = activeChannelDetails?.metadata ? (typeof activeChannelDetails.metadata === 'string' ? JSON.parse(activeChannelDetails.metadata) : activeChannelDetails.metadata) : {};
             const pinnedMessageId = metadataObj.pinnedMessageId;
             if (!pinnedMessageId) return null;
             const pinnedMessage = currentMessages.find(m => m.id === pinnedMessageId);
             if (!pinnedMessage) return null;
             return (
               <div className="sticky top-0 z-10 mx-2 mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex flex-col shadow-lg backdrop-blur-md cursor-pointer shrink-0" onClick={() => {
                 document.getElementById(`message-${pinnedMessage.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
               }}>
                 <div className="flex items-center gap-2 mb-1">
                   <Star size={12} className="text-yellow-500" />
                   <span className="text-[10px] font-black text-yellow-500 uppercase">پیام پین شده</span>
                 </div>
                 <p className="text-xs text-white/80 line-clamp-1">{pinnedMessage.content}</p>
               </div>
             )
          })()}

          {/* Grouped Messages by Date */}
          {Object.entries(
            currentMessages.reduce((groups, msg) => {
               const d = new Date(msg.createdAt || Date.now());
               const today = new Date();
               const isToday = d.toDateString() === today.toDateString();
               const isYesterday = d.toDateString() === new Date(today.getTime() - 86400000).toDateString();
               
               const formatOpt: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
               const faDate = d.toLocaleDateString("fa-IR", formatOpt);

               const label = isToday ? "امروز" : isYesterday ? `دیروز (${faDate})` : faDate;

               if (!groups[label]) groups[label] = [];
               groups[label].push(msg);
               return groups;
            }, {} as Record<string, typeof currentMessages>)
          ).map(([dateLabel, msgs]) => (
            <React.Fragment key={dateLabel}>
               <div className="flex items-center gap-4 py-4 shrink-0">
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/5 to-transparent"></div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest shrink-0">{dateLabel}</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/5 to-transparent"></div>
               </div>
               
               {(msgs as any[]).map((msg) => (
                 <MessageItem 
                   key={msg.id} 
                   message={msg} 
                   onReaction={handleReaction} 
                   onSaveGif={handleSaveGif} 
                   onReply={(m) => setReplyingTo(m)} 
                   activeChannelId={activeChannelId} 
                   onDelete={deleteMessage} 
                   onReport={(m) => setReportingMessage(m)} 
                   onWarnUser={handleWarnUser}
                   onMuteUser={handleMuteUser} 
                   onPin={(activeChannel.type === 'elite' && (activeChannel as any).ownerId === user?.id) ? () => handlePinMessage(msg.id) : undefined} 
                   isGroupOwner={activeChannel.type === 'elite' && (activeChannel as any).ownerId === user?.id} 
                 />
               ))}
            </React.Fragment>
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
          <div className="p-3 md:p-8 bg-gradient-to-t from-dark-bg to-transparent relative z-30 flex flex-col items-center shrink-0 w-full overflow-visible">
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
  
              <AnimatePresence>
                {showGifPicker && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="absolute bottom-20 left-0 right-0 md:left-auto md:right-0 z-40 bg-[#0d0d14]/95 border border-white/10 rounded-[28px] shadow-[0_10px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl p-4 w-full md:w-[480px] h-[380px] flex flex-col font-sans"
                    dir="rtl"
                  >
                    {/* Tabs row */}
                    <div className="flex gap-2 border-b border-white/5 pb-2 mb-3 text-xs md:text-sm overflow-x-auto shrink-0 scrollbar-none">
                      {["emojis", "saved", "builtin", "upload"].map((tab) => {
                        const labels: Record<string, string> = {
                          emojis: "😀 شکلک‌ها",
                          saved: "⭐ ذخیره شده",
                          builtin: "🔥 گالری گیف‌ها",
                          upload: "🚀 آپلود GIF"
                        };
                        const isActive = gifTab === tab;
                        return (
                          <button
                            key={tab}
                            onClick={() => setGifTab(tab)}
                            className={cn(
                              "px-3 py-1.5 rounded-full transition-all shrink-0 font-bold text-xs md:text-sm",
                              isActive ? "bg-neon-pink text-white font-black" : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                          >
                            {labels[tab]}
                          </button>
                        );
                      })}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto pr-1">
                      {gifTab === "emojis" && (
                        <div className="grid grid-cols-6 sm:grid-cols-7 gap-2.5 p-1">
                          {["😄", "😂", "😭", "😍", "😎", "👍", "🔥", "🎮", "🏆", "👑", "✨", "💔", "💀", "💩", "😮", "😡", "🚀", "💡", "🤫", "🤝", "💯", "👏", "🎉", "⚡", "😈", "🤡", "👾", "🛡️", "🎯", "⚔️", "🍿", "💖", "🌟", "👀", "🥱", "🤖", "🍕", "🍔", "☕", "🍺", "🎈", "🎁"].map((emoji, index) => (
                            <button
                              key={index}
                              onClick={() => setInput(prev => prev + emoji)}
                              className="text-2xl h-11 w-11 rounded-xl bg-white/[0.02] border border-white/5 hover:border-neon-blue/30 hover:bg-neon-blue/5 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {gifTab === "saved" && (
                        <div className="h-full">
                          {isVipOrPlus ? (
                            savedGifs.length === 0 ? (
                              <div className="h-48 flex flex-col items-center justify-center text-center opacity-60">
                                <Star size={24} className="text-gray-500 mb-2" />
                                <p className="text-xs text-gray-400">گیف ذخیره شده‌ای ندارید.</p>
                                <p className="text-[10px] text-gray-500 mt-1">توی چت، روی ستاره‌ی بالای گیف کلیک کنید تا ذخیره بشه!</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-3 p-1">
                                {savedGifs.map((gif, index) => (
                                  <div key={index} className="relative rounded-xl overflow-hidden border border-white/5 bg-white/[0.01] hover:border-neon-blue/40 group/saveditem transition-all h-28 flex items-center justify-center">
                                    <img 
                                      src={gif} 
                                      alt="Saved GIF" 
                                      className="max-h-full max-w-full object-contain cursor-pointer" 
                                      onClick={() => handleSendGif(gif)} 
                                    />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const updated = savedGifs.filter(g => g !== gif);
                                        setSavedGifs(updated);
                                        if (user) {
                                          localStorage.setItem(`loxx_saved_gifs_${user.id}`, JSON.stringify(updated));
                                        }
                                        toast.success("گیف از علاقه‌مندی‌ها حذف شد.");
                                      }}
                                      className="absolute top-1 right-1 p-1 bg-black/85 hover:bg-red-500/20 rounded-md text-red-500 opacity-0 group-hover/saveditem:opacity-100 transition-opacity"
                                      title="حذف از علاقه‌مندی‌ها"
                                    >
                                      <Trash size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )
                          ) : (
                            <div className="h-48 flex flex-col items-center justify-center text-center px-4">
                              <Crown size={32} className="text-[#00e5ff] mb-2 animate-pulse" />
                              <p className="text-xs text-gray-300 font-bold">بخش مخصوص کاربران Plus و VIP</p>
                              <p className="text-[10px] text-gray-500 leading-relaxed mt-2" dir="rtl">
                                برای ارسال گیف و یا استفاده از بانک هوشمند گیف‌های لوکس اشتراک Plus و یا VIP تهیه کنید.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {gifTab === "builtin" && (
                        <div className="space-y-3 font-sans h-full min-h-[200px]" dir="rtl">
                          {isVipOrPlus ? (
                            <>
                              {/* Search box inside GIF tab */}
                              <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                <input 
                                  type="text" 
                                  value={builtinSearch}
                                  onChange={(e) => setBuiltinSearch(e.target.value)}
                                  placeholder="جستجو در گالری گیف‌ها با عنوان یا هشتگ..."
                                  className="w-full bg-white/5 border border-white/5 rounded-xl pr-9 pl-4 py-2 text-xs text-white focus:outline-none focus:border-neon-pink/40 font-bold"
                                />
                                {builtinSearch && (
                                  <button 
                                    onClick={() => setBuiltinSearch("")}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </div>

                              {builtinGifs.length === 0 ? (
                                <div className="h-40 flex flex-col items-center justify-center text-center opacity-60">
                                  <ImageIcon size={24} className="text-gray-500 mb-2" />
                                  <p className="text-xs text-gray-400">گیفی یافت نشد.</p>
                                  <p className="text-[10px] text-gray-500 mt-1">با مدیریت لوکس هماهنگ کنید تا گیف‌های جدید آپلود کند.</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-3 gap-2">
                                  {builtinGifs.map((gif) => (
                                    <div key={gif.id} className="rounded-xl overflow-hidden border border-white/5 bg-white/[0.01] hover:border-neon-pink/40 hover:bg-neon-pink/[0.02] flex flex-col items-center p-1 transition-all">
                                      <div className="h-20 w-full flex items-center justify-center bg-black/40 rounded-lg overflow-hidden relative group/pickericon">
                                        <img 
                                          src={gif.url} 
                                          alt={gif.title || gif.originalName} 
                                          className="max-h-full max-w-full object-contain cursor-pointer" 
                                          onClick={() => handleSendGif(gif.url)} 
                                        />
                                      </div>
                                      <span className="text-[9px] text-gray-400 mt-1 text-center font-bold truncate w-full px-0.5" title={gif.title}>
                                        {gif.title || "بدون عنوان"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="h-48 flex flex-col items-center justify-center text-center px-4">
                              <Crown size={32} className="text-[#00e5ff] mb-2 animate-pulse" />
                              <p className="text-xs text-gray-300 font-bold">بخش مخصوص کاربران Plus و VIP</p>
                              <p className="text-[10px] text-gray-500 leading-relaxed mt-2" dir="rtl">
                                برای ارسال گیف و یا استفاده از بانک هوشمند گیف‌های لوکس اشتراک Plus و یا VIP تهیه کنید.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {gifTab === "upload" && (
                        <div className="h-full">
                          {isVipUser ? (
                            <div className="p-1 h-full">
                              <div 
                                className="border-2 border-dashed border-white/10 hover:border-neon-pink/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-neon-pink/[0.01] h-48 relative"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={async (e) => {
                                  e.preventDefault();
                                  const file = e.dataTransfer.files?.[0];
                                  if (file) await handleGifUploadAction(file);
                                }}
                                onClick={() => gifUploadRef.current?.click()}
                              >
                                <input 
                                  type="file" 
                                  ref={gifUploadRef} 
                                  accept="image/gif" 
                                  className="hidden" 
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) await handleGifUploadAction(file);
                                  }} 
                                />
                                {isUploadingGif ? (
                                  <div className="flex flex-col items-center gap-2 justify-center">
                                    <div className="w-8 h-8 border-2 border-t-neon-pink border-white/10 rounded-full animate-spin" />
                                    <p className="text-xs text-gray-400">در حال فشرده‌سازی و آپلود گیف...</p>
                                    <p className="text-[10px] text-gray-500">جلوگیری از آپلود تکراری فعال است</p>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center">
                                    <Plus size={32} className="text-neon-pink mb-2 animate-bounce" />
                                    <p className="text-xs text-gray-300 font-bold">انتخاب یا رها کردن فایل GIF (گیف)</p>
                                    <p className="text-[10px] text-gray-500 mt-2">
                                      حداکثر حجم ۱۰ مگابایت. گیف شما بهینه‌سازی و ذخیره می‌شود.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center px-4">
                              <Crown size={32} className="text-yellow-400 mb-2 animate-bounce" />
                              <p className="text-xs text-yellow-400 font-black">قابلیت طلایی مخصوص کاربران VIP</p>
                              <p className="text-[11px] text-gray-300 leading-relaxed mt-2 text-right" dir="rtl">
                                هم‌اکنون شما مجاز به آپلود گیف‌های اختصاصی جدید نیستید. برای دریافت <strong className="text-yellow-400">VIP رایگان</strong> نام کاربری خود را به دوستانتان بدهید تا زمان ثبت‌نام وارد کنند و هردو پاداش بگیرید!
                              </p>
                            </div>
                          )}
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
                      "p-2 rounded-xl transition-all outline-none",
                      showGifPicker ? "text-neon-pink bg-neon-pink/10" : "text-gray-500 hover:text-neon-blue hover:bg-neon-blue/5"
                    )}
                    title="شکلک‌ها و گیف"
                  >
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
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={(e) => {
                    // Mobile keyboard fix
                    setTimeout(() => {
                      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                  }}
                  onBlur={() => {
                    // Optimized mobile blur handle
                    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                    }
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
                    [...friends].sort((a, b) => {
                      const getScore = (f: any) => f.membership === 'VIP' ? 2 : f.membership === 'PLUS' ? 1 : 0;
                      return getScore(b) - getScore(a);
                    }).map((friend, i) => {
                      const mType = (friend as any).membership;
                      const isVip = mType === 'VIP';
                      const isPlus = mType === 'PLUS';
                      
                      return (
                      <motion.div
                        key={friend.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openChat(friend.id, friend.displayName, friend.avatarUrl || friend.avatar);
                          setShowFriendsSidebar(false);
                        }}
                        className={cn(
                          "group relative flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer",
                          friend.status === FriendStatus.OFFLINE ? "opacity-50 grayscale" : "",
                          isVip ? "bg-gradient-to-r from-yellow-500/10 to-[#1a1505] border border-yellow-500/30 shadow-[0_0_15px_rgba(250,204,21,0.15)] animate-[pulse_4s_ease-in-out_infinite]" : 
                          isPlus ? "bg-gradient-to-r from-neon-blue/10 to-[#05111a] border border-neon-blue/30 shadow-[0_0_15px_rgba(0,229,255,0.15)] animate-[pulse_4s_ease-in-out_infinite]" :
                          "bg-white/5 border border-white/5 hover:border-neon-blue/20",
                          activeChatId === friend.id && "bg-white/10 border-white/20"
                        )}
                      >
                        <div className="relative">
                          <div 
                            className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden group-hover:scale-105 transition-transform", isVip ? "bg-yellow-400/20 border border-yellow-400/50" : isPlus ? "bg-neon-blue/20 border border-neon-blue/50" : "bg-white/10")}
                          >
                             {(friend.avatar || (friend as any).avatarUrl) && ((friend.avatar || (friend as any).avatarUrl).length > 5 || (friend.avatar || (friend as any).avatarUrl).startsWith("/") || (friend.avatar || (friend as any).avatarUrl).includes(".")) ? (
                               <img src={friend.avatar || (friend as any).avatarUrl} alt="" className="h-full w-full object-cover" />
                             ) : (
                               <span className="text-[10px] text-gray-300">{friend.avatar || (friend as any).avatarUrl || "👤"}</span>
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
                            <p className={cn("text-xs font-black truncate", isVip ? "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" : isPlus ? "text-neon-blue drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]" : "text-white")}>{friend.displayName}</p>
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
                                 openChat(friend.id, friend.displayName, friend.avatarUrl || friend.avatar);
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
                                   senderAvatar: friend.avatar || (friend as any).avatarUrl,
                                   senderLevel: friend.level,
                                   membership: (friend as any).membership,
                                   vipMetadata: (friend as any).vipMetadata,
                                   bannerUrl: (friend as any).bannerUrl
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
                    );
                  })
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

    {/* Report Modal */}
    <AnimatePresence>
      {reportingMessage && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
           <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0a0f] border border-red-500/20 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
           >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-red-500 rounded-b-xl shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white italic tracking-tighter">گزارش تخلف</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Report Content</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 p-4 rounded-xl mb-6">
                 <p className="text-xs text-gray-400 mb-2">پیام مورد گزارش:</p>
                 <p className="text-sm text-gray-200 border-r-2 border-red-500/50 pr-3 line-clamp-3">{reportingMessage.content}</p>
                 <p className="text-[10px] font-bold text-gray-500 mt-2 text-left">- {reportingMessage.senderName}</p>
              </div>

              <div className="space-y-4">
                 <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">دلیل گزارش</label>
                    <textarea 
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-red-500/50 transition-colors resize-none"
                      placeholder="دلیل گزارش خود را به صورت کامل توضیح دهید..."
                    />
                 </div>
              </div>

              <div className="flex items-center gap-3 mt-8">
                 <button 
                   onClick={() => { setReportingMessage(null); setReportReason(""); }}
                   className="flex-1 h-12 rounded-xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 hover:text-white transition-colors"
                 >
                   انصراف
                 </button>
                 <button 
                   onClick={async () => {
                     if (!reportReason.trim()) { toast.error("لطفاً دلیل گزارش را بنویسید"); return; }
                     try {
                       await api.post("/reports", {
                         reportedUserId: reportingMessage.senderId,
                         targetId: reportingMessage.id.toString(),
                         targetType: "MESSAGE",
                         reason: reportReason
                       });
                       toast.success("گزارش شما با موفقیت ثبت شد");
                       setReportingMessage(null);
                       setReportReason("");
                     } catch (e: any) {
                       toast.error(e.response?.data?.error?.message || "خطا در ثبت گزارش");
                       setReportingMessage(null);
                     }
                   }}
                   className="flex-1 h-12 rounded-xl bg-red-500/20 border border-red-500/30 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                 >
                   ارسال گزارش
                 </button>
              </div>
           </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
};
