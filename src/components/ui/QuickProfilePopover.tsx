import React, { useState } from "react";
import { GlowButton } from "./GlowButton";
import { motion } from "motion/react";
import { useFriends } from "../../context/FriendsContext";
import { BadgeType, MembershipType } from "../../types";
import { cn } from "../../lib/utils";
import { Award, Star, Zap, Crown, User, Shield, Sparkles, X, Trophy, MessageCircle, CheckCircle2 } from "lucide-react";

export interface QuickProfileUser {
  senderName: string;
  senderAvatar?: string;
  senderLevel: number;
  senderBadges?: BadgeType[];
  membership?: MembershipType;
  id?: string;
  bannerUrl?: string;
  vipMetadata?: any;
}

interface QuickProfilePopoverProps {
  onClose: () => void;
  user: QuickProfileUser;
  isSelf: boolean;
}

export const QuickProfilePopover: React.FC<QuickProfilePopoverProps> = ({ onClose, user, isSelf }) => {
  const { addFriend, setActiveChatId, chatTrigger, openChat } = useFriends();
  const [sentRequest, setSentRequest] = useState(false);

  const handleAddFriend = () => {
    addFriend(user.senderName);
    setSentRequest(true);
  };

  const handleMessage = () => {
    if (user.id) {
      openChat(user.id, user.senderName);
      onClose();
    }
  };

  const isVIP = user.membership === MembershipType.VIP;
  const isPLUS = user.membership === MembershipType.PLUS;

  const metadata = typeof user.vipMetadata === 'string' ? JSON.parse(user.vipMetadata) : user.vipMetadata;
  const bannerUrl = user.bannerUrl || "";

  const getBackgroundStyle = () => {
    if (!metadata || !metadata.colors) return {};
    if (!metadata.colors.gradient?.enabled) {
      return { backgroundColor: metadata.colors.bg };
    }
    const { color1, color2, type, angle } = metadata.colors.gradient;
    if (type === "linear") return { background: `linear-gradient(${angle}deg, ${color1}, ${color2})` };
    if (type === "radial") return { background: `radial-gradient(circle at center, ${color1}, ${color2})` };
    return { background: `conic-gradient(from ${angle}deg, ${color1}, ${color2})` };
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="w-72 bg-[#0a0a0f] rounded-[32px] border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.9)] overflow-hidden cursor-default rtl text-right transition-all backdrop-blur-3xl px-0 relative z-[20002]"
      style={metadata && metadata.colors ? { ...getBackgroundStyle(), borderColor: metadata.colors.accent + "40" } : {}}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Dynamic Banner */}
      <div className={cn(
        "h-28 relative overflow-hidden",
        !bannerUrl && (isVIP ? "bg-gradient-to-br from-yellow-400 via-yellow-600 to-yellow-800" :
        isPLUS ? "bg-gradient-to-br from-neon-blue via-blue-600 to-indigo-800" :
        "bg-gradient-to-l from-gray-800 to-gray-900")
      )}>
         {bannerUrl && <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />}
         {/* Banner Overlay Patterns */}
         <div className="absolute inset-0 bg-black/20"></div>
         {isVIP && (
           <motion.div 
             animate={{ opacity: [0.1, 0.3, 0.1], x: [-10, 10, -10] }}
             transition={{ duration: 5, repeat: Infinity }}
             className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_50%)]" 
           />
         )}
         {isPLUS && (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-2 bg-[conic-gradient(from_0deg,transparent,rgba(0,229,255,0.1),transparent)]" 
            />
         )}
         
         {/* Close Button Only in Banner */}
         <button 
          onClick={onClose}
          className="absolute top-4 left-4 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors z-20 backdrop-blur-md border border-white/10"
         >
           <X size={16} />
         </button>
      </div>

      {/* Profile Content */}
      <div className="px-6 pb-6 pt-0 relative">
        <div className="flex items-start justify-between">
          {/* Avatar with Membership Rings */}
          <div className="relative -mt-12 mb-3 inline-block">
             {/* VIP Aura Effects */}
             {isVIP && metadata?.frame && (
                <div className="absolute inset-0 z-0">
                  {metadata.frame === "gold_aura" && (
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity }}
                      className="absolute -inset-8 bg-[radial-gradient(circle,rgba(250,204,21,0.2)_0%,transparent_70%)]"
                    />
                  )}
                  {metadata.frame === "lightning" && (
                     <div className="absolute -inset-4 bg-blue-500/10 blur-xl animate-pulse" />
                  )}
                  {metadata.frame === "fire" && (
                     <div className="absolute -inset-4 bg-red-500/10 blur-xl animate-pulse" />
                  )}
                  {metadata.frame === "neon_pulse" && (
                    <motion.div 
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -inset-6 border border-neon-blue/30 rounded-[40px] blur-sm"
                    />
                  )}
                  {metadata.frame === "cyber" && (
                    <div className="absolute -inset-4 border-2 border-green-500/20 rounded-[36px] animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.3)]" />
                  )}
                  {metadata.frame === "cosmic" && (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="absolute -inset-10 border-t-2 border-indigo-500/40 rounded-full"
                    />
                  )}
                </div>
             )}

             <div className={cn(
               "h-24 w-24 rounded-[32px] bg-[#0a0a0f] p-1.5 shadow-2xl relative z-10",
               isVIP ? "p-[2px] bg-gradient-to-tr from-yellow-400 to-yellow-200" :
               isPLUS ? "p-[2px] bg-neon-blue" : ""
             )}>
                  <div className="h-full w-full rounded-[28px] bg-[#0d0d12] flex items-center justify-center text-5xl overflow-hidden relative">
                  {(user.senderAvatar && (user.senderAvatar.length > 5 || user.senderAvatar.startsWith("/") || user.senderAvatar.includes(".") || user.senderAvatar.includes("data:image"))) ? (
                    <img src={user.senderAvatar} alt={user.senderName} className="w-full h-full object-cover relative z-10" />
                  ) : (
                    <span className="relative z-10">{user.senderAvatar || "👤"}</span>
                  )}
                  
                  {/* Internal Frame Overlay */}
                  {isVIP && metadata?.frame && (
                    <>
                      {metadata.frame === "diamond" && (
                        <div className="absolute inset-0 border-2 border-cyan-400/30 rounded-none transform rotate-45 scale-150 pointer-events-none z-20" />
                      )}
                      {metadata.frame === "glitch" && (
                        <motion.div 
                          animate={{ opacity: [0, 1, 0], x: [-2, 2, -2] }}
                          transition={{ duration: 0.2, repeat: Infinity }}
                          className="absolute inset-0 bg-neon-pink/10 mix-blend-screen pointer-events-none z-20"
                        />
                      )}
                      {metadata.frame === "shield" && (
                        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-[28px] pointer-events-none z-20 shadow-[inset_0_0_15px_rgba(99,102,241,0.3)]" />
                      )}
                      {metadata.frame === "anime" && (
                        <motion.div 
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 4, repeat: Infinity }}
                          className="absolute inset-0 border border-yellow-400/20 rounded-[28px] pointer-events-none z-20"
                        />
                      )}
                    </>
                  )}
              </div>
                  
                  {/* VIP Animated Aura */}
                  {isVIP && (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(250,204,21,0.2),transparent)]"
                    />
                  )}
                </div>

             {/* Online Status */}
             <div className="absolute top-1 right-1 h-5 w-5 bg-green-500 rounded-full border-4 border-[#0a0a0f] z-20 shadow-lg"></div>
             
             {/* Ring Animations */}
             {isVIP && (
               <>
                 <motion.div 
                   animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                   transition={{ duration: 2, repeat: Infinity }}
                   className="absolute -inset-2 border-2 border-yellow-400/30 rounded-[36px]"
                 />
                 <div className="absolute -bottom-2 -left-2 h-8 w-8 rounded-full bg-yellow-400 text-dark-bg border-4 border-[#0a0a0f] flex items-center justify-center shadow-xl z-20">
                    <Crown size={14} fill="currentColor" />
                 </div>
               </>
             )}
             {isPLUS && (
               <div className="absolute -bottom-2 -left-2 h-8 w-8 rounded-full bg-neon-blue text-dark-bg border-4 border-[#0a0a0f] flex items-center justify-center shadow-xl z-20">
                  <Zap size={14} fill="currentColor" />
               </div>
             )}
          </div>

          {!isSelf && (
            <button 
              onClick={handleMessage}
              className="mt-4 h-11 w-11 rounded-2xl bg-neon-blue/10 text-neon-blue flex items-center justify-center hover:bg-neon-blue hover:text-dark-bg transition-all border border-neon-blue/20 shadow-lg group shadow-neon-blue/10"
              title="ارسال پیام"
            >
              <MessageCircle size={22} className="group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <h4 className={cn(
                "text-2xl font-black italic tracking-tighter uppercase",
                isVIP ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]" : "text-white"
              )} style={metadata && metadata.colors && (isVIP || isPLUS) ? { color: metadata.colors.text } : {}}>
                {user.senderName}
              </h4>
              <CheckCircle2 size={16} className="text-neon-blue" fill="currentColor" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
               {isVIP ? (
                 <span className="text-[10px] text-yellow-500 font-black uppercase tracking-widest flex items-center gap-1">
                   <Crown size={12} /> عضو ویژه (VIP)
                 </span>
               ) : isPLUS ? (
                 <span className="text-[10px] text-neon-blue font-black uppercase tracking-widest flex items-center gap-1">
                   <Zap size={12} /> عضو پلاس (PLUS)
                 </span>
               ) : (
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">گیمر تایید شده</p>
               )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            {user.senderBadges?.map((badge, i) => (
              <BadgeIcon key={i} type={badge} />
            ))}
            {isVIP && <BadgeIcon type={BadgeType.VIP} />}
            {isPLUS && <BadgeIcon type={BadgeType.PLUS} />}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center group hover:border-white/10 transition-colors">
              <p className="text-[9px] text-gray-600 font-black uppercase mb-1">رتبه لوکس</p>
              <div className="flex items-center justify-center gap-1">
                 <Shield size={12} className="text-neon-pink" />
                 <p className="text-xs font-black text-white italic uppercase tracking-tighter">Supreme</p>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center group hover:border-white/10 transition-colors">
              <p className="text-[9px] text-gray-600 font-black uppercase mb-1">سطح جهانی</p>
              <div className="flex items-center justify-center gap-1">
                 <Sparkles size={12} className="text-neon-blue" />
                 <p className="text-xs font-black text-white italic tracking-tighter">{user.senderLevel}</p>
              </div>
            </div>
          </div>

          {/* Favorite Games */}
          <div>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-2 px-1 italic">ژانرهای مورد علاقه</p>
            <div className="flex gap-2">
              {["FPS", "MOBA", "RPG"].map((genre, i) => (
                <div key={i} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[10px] font-black text-gray-400 uppercase italic tracking-tighter group hover:text-white hover:border-white/10 transition-all">{genre}</div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2">
            {!isSelf && (
              <GlowButton 
                variant={sentRequest ? "purple" : isVIP ? "purple" : "blue"} 
                className={cn(
                  "w-full h-12 !rounded-2xl font-black text-sm uppercase italic tracking-widest",
                  isVIP && "bg-gradient-to-r from-yellow-600 to-yellow-400 text-dark-bg border-none"
                )}
                onClick={handleAddFriend}
                disabled={sentRequest}
              >
                {sentRequest ? "درخواست ارسال شد" : "افزودن دوست"}
              </GlowButton>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const BadgeIcon: React.FC<{ type: BadgeType }> = ({ type }) => {
  const configs: Record<string, { icon: any, color: string, label: string }> = {
    [BadgeType.STREAMER]: { icon: Zap, color: "text-blue-400", label: "Streamer" },
    [BadgeType.PRO]: { icon: Award, color: "text-pink-400", label: "Pro" },
    [BadgeType.LOBBY_MASTER]: { icon: Star, color: "text-yellow-400", label: "Master" },
    [BadgeType.VIP]: { icon: Crown, color: "text-yellow-500", label: "VIP" },
    [BadgeType.CHAMPION]: { icon: Trophy, color: "text-yellow-400", label: "Champ" },
    [BadgeType.PLUS]: { icon: Zap, color: "text-neon-blue", label: "Plus" },
    [BadgeType.FOUNDER]: { icon: Shield, color: "text-neon-purple", label: "Founder" },
  };

  const config = configs[type] || { icon: Award, color: "text-gray-400", label: type };
  const Icon = config.icon;

  return (
    <div title={config.label} className={cn("px-2 py-1 rounded-lg bg-white/5 border border-white/5 flex items-center gap-1", config.color)}>
      <Icon size={12} fill="currentColor" />
      <span className="text-[8px] font-black uppercase tracking-tighter">{config.label}</span>
    </div>
  );
};
