import React, { useState, useEffect } from "react";
import { GlowButton } from "./GlowButton";
import { motion } from "motion/react";
import { useFriends } from "../../context/FriendsContext";
import { BadgeType, MembershipType } from "../../types";
import { cn } from "../../lib/utils";
import { Award, Star, Zap, Crown, User, Shield, Sparkles, X, Trophy, MessageCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import api from "../../lib/api";
import { SmartImage } from "./SmartImage";
import { VIPMetadata } from "../../types";

export interface QuickProfileUser {
  senderName: string;
  displayName?: string;
  senderAvatar?: string;
  avatarUrl?: string; // fallback
  senderLevel: number;
  senderBadges?: any[]; // Dynamic badges
  membership?: MembershipType;
  id?: string;
  bannerUrl?: string;
  vipMetadata?: any;
  games?: any[];
  stats?: {
    friendsCount: number;
    lobbiesJoined: number;
    lobbiesCreated: number;
    daysSinceJoin: number;
  };
}

interface QuickProfilePopoverProps {
  onClose: () => void;
  user: QuickProfileUser;
  isSelf: boolean;
}

export const QuickProfilePopover: React.FC<QuickProfilePopoverProps> = ({ onClose, user: initialUser, isSelf }) => {
  const { addFriend, openChat } = useFriends();
  const [sentRequest, setSentRequest] = useState(false);
  const [userData, setUserData] = useState<QuickProfileUser>(initialUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFullData = async () => {
      const identifier = initialUser.id || (initialUser.senderName ? initialUser.senderName.trim() : null);
      if (!identifier) return;
      
      setLoading(true);
      try {
        // Encode the identifier to handle spaces
        const response = await api.get(`/user/${encodeURIComponent(identifier)}`);
        const data = response.data.data;
        setUserData({
          ...initialUser,
          id: data.id,
          senderName: data.username,
          displayName: data.displayName || data.username,
          senderAvatar: data.avatarUrl,
          avatarUrl: data.avatarUrl,
          bannerUrl: data.bannerUrl,
          membership: data.membership,
          senderLevel: data.level || initialUser.senderLevel,
          stats: data.stats,
          vipMetadata: data.vipMetadata,
          senderBadges: data.badges || [],
          games: data.games || []
        });
      } catch (error) {
        console.error("Failed to fetch profile stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFullData();
  }, [initialUser.senderName, initialUser.id]);

  const user = userData;

  const handleAddFriend = () => {
    addFriend(user.senderName);
    setSentRequest(true);
  };

  const handleMessage = () => {
    if (user.id) {
      openChat(user.id, user.senderName, user.senderAvatar || user.avatarUrl);
      onClose();
    }
  };

  const isVIP = user.membership === MembershipType.VIP || user.membership === "VIP";
  const isPLUS = user.membership === MembershipType.PLUS || user.membership === "PLUS";

  const getMetadata = (): VIPMetadata | null => {
    if (!user.vipMetadata) return null;
    try {
      return typeof user.vipMetadata === 'string' ? JSON.parse(user.vipMetadata) : user.vipMetadata;
    } catch (e) {
      return null;
    }
  };

  const metadata = getMetadata();
  const bannerUrl = user.bannerUrl || "";

  const getBackgroundStyle = () => {
    let style: any = {};
    if (metadata && metadata.colors && metadata.colors.gradient?.enabled) {
      const { color1, color2, type, angle } = metadata.colors.gradient;
      if (type === "linear") style.background = `linear-gradient(${angle}deg, ${color1}, ${color2})`;
      else if (type === "radial") style.background = `radial-gradient(circle at center, ${color1}, ${color2})`;
      else style.background = `conic-gradient(from ${angle}deg, ${color1}, ${color2})`;
    } else if (metadata && metadata.colors && metadata.colors.bg) {
      style.backgroundColor = metadata.colors.bg;
    } else if (isVIP) {
      style.backgroundImage = "linear-gradient(to bottom right, #eab308, #a16207)";
    } else if (isPLUS) {
      style.backgroundColor = "#eab308";
    } else {
      style.backgroundColor = "#0a0a0f";
    }
    return style;
  };

  const getFontStyle = () => {
    if (metadata?.fontStyle === "lightning") {
      return { textShadow: "0 0 5px #fff, 0 0 10px #fff, 0 0 20px #0ff, 0 0 40px #0ff", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" };
    }
    if (metadata?.fontStyle === "fire") {
      return { textShadow: "0 -2px 4px #fff, 0 -2px 10px #ff3, 0 -10px 20px #fd3, 0 -18px 40px #f80", animation: "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite" };
    }
    if (metadata?.fontStyle === "glitch") {
      return { textShadow: "2px 0 0 rgba(255,0,0,0.8), -2px 0 0 rgba(0,255,255,0.8)", animation: "pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite" };
    }
    return { textShadow: isVIP ? "none" : "0 4px 12px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.5)" };
  };

  const renderFrameEffect = (type: string) => {
    if (!metadata?.specialFrame) return null;
    
    switch (type) {
      case "lightning":
        return (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ opacity: [0, 0.4, 0.2, 0.5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 bg-blue-400/20 blur-2xl"
            />
            <div className="absolute inset-0 border-[3px] border-blue-400/30 rounded-[2.5rem]" />
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [1, 1.02, 1],
                  filter: ["blur(0px)", "blur(2px)", "blur(0px)"]
                }}
                transition={{ repeat: Infinity, duration: 0.15, delay: i * 0.4 }}
                className="absolute inset-0 border-[2px] border-white/40 shadow-[0_0_25px_rgba(96,165,250,0.9)] rounded-[2.5rem]"
              />
            ))}
          </div>
        );
      case "fire":
        return (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-[2.5rem]">
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-orange-600/60 via-red-500/20 to-transparent blur-xl" />
            <div className="absolute inset-x-0 bottom-0 border-b-[4px] border-orange-500/50 blur-[2px]" />
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <motion.div
                key={i}
                animate={{ 
                  y: [20, -120],
                  x: [i * 15, i * 15 + (Math.sin(i) * 30)],
                  opacity: [0, 1, 0],
                  scale: [1.2, 0.2],
                  rotate: [0, 180]
                }}
                transition={{ repeat: Infinity, duration: 0.8 + Math.random(), delay: i * 0.15 }}
                className="absolute bottom-0 w-6 h-6 bg-orange-500/40 rounded-full blur-md"
              />
            ))}
          </div>
        );
      case "glitch":
        return (
          <motion.div 
            animate={{ 
              x: ["-2px", "2px", "-1px", "1px", "0px"],
              y: ["1px", "-1px", "0px"],
              filter: ["hue-rotate(0deg)", "hue-rotate(180deg)", "hue-rotate(0deg)"]
            }}
            transition={{ repeat: Infinity, duration: 0.2, repeatDelay: 3 }}
            className="absolute inset-0 z-0 border-[3px] border-pink-500 rounded-[2.5rem] shadow-[inset_0_0_20px_rgba(236,72,153,0.5),0_0_15px_rgba(236,72,153,0.5)]"
          />
        );
      case "neon_pulse":
        return (
          <motion.div 
            animate={{ 
              boxShadow: [
                "0 0 10px #00e5ff, inset 0 0 10px #00e5ff",
                "0 0 30px #00e5ff, inset 0 0 15px #00e5ff",
                "0 0 10px #00e5ff, inset 0 0 10px #00e5ff"
              ],
              borderColor: ["#00e5ff", "#ffffff", "#00e5ff"]
            }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 z-0 border-[3px] border-cyan-400 rounded-[2.5rem]"
          />
        );
      case "gold_aura":
        return (
          <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute -inset-8 z-0 bg-[radial-gradient(circle,rgba(250,204,21,0.2)_0%,transparent_70%)] rounded-full pointer-events-none"
          />
        );
      case "diamond":
        return (
          <div className="absolute inset-0 z-0 border-2 border-cyan-400/30 rounded-none transform rotate-45 scale-150 pointer-events-none" />
        );
      default:
        return null;
    }
  };

  const pinnedBadges = user.senderBadges?.filter(b => b.isPinned) || [];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className={cn(
        "w-[380px] rounded-[48px] border overflow-hidden cursor-default rtl text-right transition-all backdrop-blur-3xl px-0 relative z-[20002]",
        metadata?.fullGlow ? "shadow-[0_0_50px_rgba(250,204,21,0.4)] border-yellow-400" : (isVIP ? "border-yellow-400/40 shadow-[0_40px_100px_rgba(0,0,0,1)]" : "border-white/10 shadow-[0_40px_100px_rgba(0,0,0,1)]")
      )}
      style={{ 
        ...getBackgroundStyle(), 
        borderColor: metadata?.colors?.accent ? metadata.colors.accent + "40" : (metadata?.fullGlow ? undefined : undefined) 
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Custom BG Image */}
      {metadata?.bgImage && (
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{ 
            backgroundImage: `url(${metadata.bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: metadata.opacity ?? 0.2
          }}
        />
      )}

      {/* Effects */}
      {metadata?.frame && renderFrameEffect(metadata.frame)}

      {/* Dynamic Banner */}
      <div className={cn(
        "h-40 relative overflow-hidden z-10",
        !bannerUrl && (isVIP ? "bg-gradient-to-br from-[#facc15] via-[#eab308] to-[#ca8a04]" :
        isPLUS ? "bg-gradient-to-br from-neon-blue via-blue-600 to-indigo-800" :
        "bg-gradient-to-l from-gray-800 to-gray-900")
      )}>
         {bannerUrl && (
           <SmartImage 
             src={bannerUrl} 
             isVipEnabled={isVIP || isPLUS} 
             alt="Banner" 
             className="w-full h-full object-cover" 
           />
         )}
         <div className="absolute inset-0 bg-black/40"></div>
         {isVIP && (
           <motion.div 
             animate={{ opacity: [0.1, 0.4, 0.1], x: [-20, 20, -20] }}
             transition={{ duration: 7, repeat: Infinity }}
             className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_50%)]" 
           />
         )}
         
         <button 
          onClick={onClose}
          className="absolute top-6 left-6 h-10 w-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-neon-pink hover:text-white transition-all z-20 backdrop-blur-xl border border-white/10 shadow-lg group"
         >
           <X size={20} className="group-hover:rotate-90 transition-transform" />
         </button>
      </div>

      <div className="px-10 pb-10 pt-0 relative z-20">
         {/* Enhanced Readability Overlay - subtle darkening for text clarity */}
         <div className="absolute inset-0 z-[-1] bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
         
        <div className="flex items-start justify-between">
          <div className="relative -mt-20 mb-6 inline-block">
             {((isVIP || isPLUS) && metadata?.auraEffect) && (
               <motion.div 
                 animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.95, 1.05, 0.95] }}
                 transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute -inset-2 rounded-[46px] blur-xl z-0 pointer-events-none"
                 style={{ backgroundColor: metadata?.colors?.auraColor || "#eab308" }}
               />
             )}
             <div className={cn(
               "h-32 w-32 rounded-[40px] bg-[#0a0a0f] p-[2px] shadow-2xl relative z-20",
               metadata?.specialFrame && metadata.frame === "lightning" ? "p-0 border-blue-400 shadow-[0_0_15px_blue]" : (
                 isVIP ? "p-[3px] bg-gradient-to-tr from-yellow-400 via-yellow-100 to-yellow-600" :
                 isPLUS ? "p-[3px] bg-neon-blue" : "border border-white/10"
               )
             )}>
                   <div className="h-full w-full rounded-[34px] bg-[#0d0d12] flex items-center justify-center text-6xl overflow-hidden relative">
                   {(user.senderAvatar || user.avatarUrl) ? (
                     <SmartImage 
                        src={user.senderAvatar || user.avatarUrl} 
                        isVipEnabled={isVIP || isPLUS} 
                        alt={user.displayName || user.senderName} 
                        className="w-full h-full object-cover relative z-10" 
                     />
                   ) : (
                     <div className="h-full w-full flex items-center justify-center bg-white/5 text-gray-700">
                       <User size={64} />
                     </div>
                   )}
                   
                   {/* VIP Animated Aura around Avatar */}
                   {((isVIP || isPLUS) && metadata?.auraEffect) && (
                     <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 transparent"
                     />
                   )}
               </div>
               
               {/* Optional Avatar Frame Pulse */}
               {metadata?.specialFrame && metadata.frame === "lightning" && (
                 <div className="absolute inset-0 border-2 border-blue-400 animate-pulse rounded-[40px] shadow-[0_0_15px_rgba(96,165,250,0.8)]" />
               )}
            </div>

             <div className="absolute top-1 right-1 h-7 w-7 bg-green-500 rounded-full border-[5px] border-[#0a0a0f] z-30 shadow-lg"></div>
             
             {isVIP && (
               <div className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full bg-yellow-400 text-dark-bg border-4 border-[#0a0a0f] flex items-center justify-center shadow-2xl z-20">
                  <Crown size={22} fill="currentColor" />
               </div>
             )}
             {isPLUS && (
               <div className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full bg-neon-blue text-dark-bg border-4 border-[#0a0a0f] flex items-center justify-center shadow-2xl z-20">
                  <Zap size={22} fill="currentColor" />
               </div>
             )}
          </div>

          {!isSelf && (
            <button 
              onClick={handleMessage}
              className="mt-6 h-14 w-14 rounded-3xl bg-white/10 text-white flex items-center justify-center hover:bg-neon-blue hover:text-dark-bg transition-all border border-white/10 group active:scale-95 shadow-xl backdrop-blur-xl"
              title="ارسال پیام"
            >
              <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
            </button>
          )}
        </div>

        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3">
              <h4 className={cn(
                "text-3xl font-black italic tracking-tighter uppercase",
                isVIP ? "text-[#0a0a0f]" : "text-white",
                metadata?.shinyName && "animate-pulse"
              )} style={{
                ...(metadata && metadata.colors && (isVIP || isPLUS) ? 
                  (metadata.colors.textGradient 
                    ? { backgroundImage: `linear-gradient(to right, ${metadata.colors.text}, ${metadata.colors.textGradient})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }
                    : { color: metadata.colors.text }) 
                  : {}),
                ...getFontStyle()
              }}>
                {user.displayName || user.senderName}
              </h4>
              <div className="flex items-center gap-0.5">
                {user.senderBadges?.filter(b => b.isSpecial).map(badge => (
                  <img key={badge.id} src={badge.iconUrl} alt={badge.name} title={badge.name} className="h-6 w-6 object-contain" />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
               {isVIP ? (
                 <span className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: metadata?.colors?.accent || "#facc15" }}>
                   <div className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
                   عضو ویژه لوکس (VIP)
                 </span>
               ) : isPLUS ? (
                 <span className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: metadata?.colors?.accent || "#00e5ff" }}>
                   <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                   عضو طلایی پلاس (PLUS)
                 </span>
               ) : (
                 <p className="text-[11px] text-gray-500 font-black uppercase tracking-[0.2em]">گیمر تایید شده لول {user.senderLevel}</p>
               )}
            </div>
          </div>

          {/* Accurate Statistics Grid */}
          <div className="grid grid-cols-4 gap-4 py-6 border-y border-white/5">
             <div className="text-center group">
                <p className="text-[9px] font-black uppercase mb-1.5 group-hover:text-neon-blue transition-colors italic" style={{ color: metadata?.colors?.statsLabel || (isVIP ? "#451a03" : "#4b5563") }}>عضویت</p>
                <div className="flex flex-col items-center">
                  {loading ? (
                    <div className="h-4 w-8 bg-white/5 animate-pulse rounded" />
                  ) : (
                    <p className="text-sm font-black italic" style={{ color: isVIP && !metadata?.colors?.text ? "#0a0a0f" : (metadata?.colors?.statsText || metadata?.colors?.text || "white"), textShadow: isVIP ? "none" : "0 2px 4px rgba(0,0,0,0.5)" }}>{user.stats?.daysSinceJoin || 0} روز</p>
                  )}
                </div>
             </div>
             <div className="text-center group">
                <p className="text-[9px] font-black uppercase mb-1.5 group-hover:text-neon-pink transition-colors italic" style={{ color: metadata?.colors?.statsLabel || (isVIP ? "#451a03" : "#4b5563") }}>دوستان</p>
                <div className="flex flex-col items-center">
                  {loading ? (
                    <div className="h-4 w-8 bg-white/5 animate-pulse rounded" />
                  ) : (
                    <p className="text-sm font-black italic" style={{ color: isVIP && !metadata?.colors?.text ? "#0a0a0f" : (metadata?.colors?.statsText || metadata?.colors?.text || "white"), textShadow: isVIP ? "none" : "0 2px 4px rgba(0,0,0,0.5)" }}>{user.stats?.friendsCount || 0}</p>
                  )}
                </div>
             </div>
             <div className="text-center group">
                <p className="text-[9px] font-black uppercase mb-1.5 group-hover:text-neon-purple transition-colors italic" style={{ color: metadata?.colors?.statsLabel || (isVIP ? "#451a03" : "#4b5563") }}>لابی‌ها</p>
                <div className="flex flex-col items-center">
                  {loading ? (
                    <div className="h-4 w-8 bg-white/5 animate-pulse rounded" />
                  ) : (
                    <p className="text-sm font-black italic" style={{ color: isVIP && !metadata?.colors?.text ? "#0a0a0f" : (metadata?.colors?.statsText || metadata?.colors?.text || "white"), textShadow: isVIP ? "none" : "0 2px 4px rgba(0,0,0,0.5)" }}>{user.stats?.lobbiesJoined || 0}</p>
                  )}
                </div>
             </div>
             <div className="text-center group">
                <p className="text-[9px] font-black uppercase mb-1.5 group-hover:text-yellow-500 transition-colors italic" style={{ color: metadata?.colors?.statsLabel || (isVIP ? "#451a03" : "#4b5563") }}>میزبانی</p>
                <div className="flex flex-col items-center">
                  {loading ? (
                    <div className="h-4 w-8 bg-white/5 animate-pulse rounded" />
                  ) : (
                    <p className="text-sm font-black italic" style={{ color: isVIP && !metadata?.colors?.text ? "#0a0a0f" : (metadata?.colors?.statsText || metadata?.colors?.text || "white"), textShadow: isVIP ? "none" : "0 2px 4px rgba(0,0,0,0.5)" }}>{user.stats?.lobbiesCreated || 0}</p>
                  )}
                </div>
             </div>
          </div>

          {/* Badges Section */}
          <div className="space-y-4">
            <h5 className="text-[10px] font-black uppercase tracking-widest italic" style={{ color: metadata?.colors?.statsLabel || (isVIP ? "#451a03" : "#4b5563") }}>نشان‌های انتخابی و دستاوردها</h5>
            <div className="flex flex-wrap gap-2.5 max-h-[120px] overflow-y-auto no-scrollbar">
              {user.senderBadges?.filter(b => b.isPinned).map((ub, i) => (
                <div 
                  key={ub.id || i} 
                  title={ub.name} 
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border",
                    "bg-neon-blue/10 border-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                  )}
                >
                  <img src={ub.iconUrl} alt={ub.name} className="h-4 w-4 object-contain" />
                  <span className="text-[10px] font-black uppercase italic" style={{ color: isVIP && !metadata?.colors?.badgeText ? "#0a0a0f" : (metadata?.colors?.badgeText || "white"), textShadow: isVIP ? "none" : "0 1px 2px rgba(0,0,0,0.5)" }}>{ub.name}</span>
                </div>
              ))}
              {user.senderBadges?.filter(b => !b.isPinned && b.category !== "GAME").slice(0, 4).map((ub, i) => (
                <div 
                  key={ub.id || i} 
                  title={ub.name} 
                  className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border", isVIP ? "bg-black/10 border-black/10" : "bg-white/5 border-white/10 opacity-70 hover:opacity-100")}
                >
                  <img src={ub.iconUrl} alt={ub.name} className="h-4 w-4 object-contain" />
                  <span className="text-[10px] font-black uppercase italic" style={{ color: isVIP && !metadata?.colors?.badgeText ? "#0a0a0f" : (metadata?.colors?.badgeText || "#6b7280") }}>{ub.name}</span>
                </div>
              ))}
              {!user.senderBadges?.length && !loading && (
                <p className="text-[10px] text-gray-500 italic">بدون نشان‌های کسب شده</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4">
            {!isSelf ? (
              <GlowButton 
                variant={sentRequest ? "purple" : isVIP ? "purple" : "blue"} 
                className={cn(
                  "w-full h-16 !rounded-3xl font-black text-base uppercase italic tracking-[0.2em] shadow-2xl relative overflow-hidden group",
                  isVIP && "bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 text-dark-bg border-none shadow-[0_10px_40px_rgba(250,204,21,0.3)] hover:scale-[1.02]"
                )}
                onClick={handleAddFriend}
                disabled={sentRequest}
              >
                {sentRequest ? (
                  <span className="flex items-center gap-2"><CheckCircle2 size={20} /> درخواست ارسال شد</span>
                ) : (
                  <span className="flex items-center gap-2 group-hover:scale-110 transition-transform tracking-widest italic font-black uppercase">افزودن به لیست دوستان</span>
                )}
              </GlowButton>
            ) : (
                <GlowButton 
                  variant={isVIP ? "gold" : "blue"} 
                  className="w-full h-16 !rounded-3xl font-black text-base uppercase italic tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all"
                  onClick={() => window.location.href = "/settings"}
                >
                  ویرایش اطلاعات پروفایل
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
    <div title={config.label} className={cn("px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2", config.color)}>
      <Icon size={14} fill="currentColor" />
      <span className="text-[10px] font-black uppercase tracking-tighter italic">{config.label}</span>
    </div>
  );
};
