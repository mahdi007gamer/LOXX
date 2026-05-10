import React, { useState, useEffect } from "react";
import { GlowButton } from "./GlowButton";
import { motion } from "motion/react";
import { useFriends } from "../../context/FriendsContext";
import { BadgeType, MembershipType } from "../../types";
import { cn } from "../../lib/utils";
import { Award, Star, Zap, Crown, User, Shield, Sparkles, X, Trophy, MessageCircle, CheckCircle2 } from "lucide-react";
import api from "../../lib/api";
import { SmartImage } from "./SmartImage";

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
      openChat(user.id, user.senderName);
      onClose();
    }
  };

  const isVIP = user.membership === MembershipType.VIP || user.membership === "VIP";
  const isPLUS = user.membership === MembershipType.PLUS || user.membership === "PLUS";

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

  const pinnedBadges = user.senderBadges?.filter(b => b.isPinned) || [];
  const specialBadges = user.senderBadges?.filter(b => b.isSpecial) || [];
  const standardBadges = user.senderBadges?.filter(b => !b.isSpecial && b.category !== "GAME") || [];
  const gameBadges = user.senderBadges?.filter(b => b.category === "GAME") || [];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="w-[380px] bg-[#0a0a0f] rounded-[48px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,1)] overflow-hidden cursor-default rtl text-right transition-all backdrop-blur-3xl px-0 relative z-[20002]"
      style={metadata && metadata.colors ? { ...getBackgroundStyle(), borderColor: metadata.colors.accent + "40" } : {}}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Dynamic Banner */}
      <div className={cn(
        "h-40 relative overflow-hidden",
        !bannerUrl && (isVIP ? "bg-gradient-to-br from-yellow-400 via-yellow-600 to-yellow-800" :
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

      <div className="px-10 pb-10 pt-0 relative">
        <div className="flex items-start justify-between">
          <div className="relative -mt-20 mb-6 inline-block">
             <div className={cn(
               "h-32 w-32 rounded-[40px] bg-[#0a0a0f] p-2 shadow-2xl relative z-10",
               isVIP ? "p-[3px] bg-gradient-to-tr from-yellow-400 via-yellow-200 to-yellow-500" :
               isPLUS ? "p-[3px] bg-neon-blue" : "border border-white/10"
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
              </div>
            </div>

             <div className="absolute top-1 right-1 h-7 w-7 bg-green-500 rounded-full border-[5px] border-[#0a0a0f] z-20 shadow-lg"></div>
             
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
              className="mt-6 h-14 w-14 rounded-3xl bg-white/5 text-gray-400 flex items-center justify-center hover:bg-neon-blue hover:text-dark-bg transition-all border border-white/10 group active:scale-95 shadow-xl"
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
                isVIP && !metadata?.colors?.textGradient ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200" : "text-white"
              )} style={metadata && metadata.colors && (isVIP || isPLUS) ? 
                (metadata.colors.textGradient 
                  ? { backgroundImage: `linear-gradient(to right, ${metadata.colors.text}, ${metadata.colors.textGradient})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }
                  : { color: metadata.colors.text }) 
                : {}}>
                {user.displayName || user.senderName}
              </h4>
              <div className="flex items-center gap-0.5">
                {specialBadges.map(badge => (
                  <img key={badge.id} src={badge.iconUrl} alt={badge.name} title={badge.name} className="h-6 w-6 object-contain" />
                ))}
                {!specialBadges.length && <CheckCircle2 size={24} className="text-neon-blue" fill="currentColor" />}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
               {isVIP ? (
                 <span className="text-[11px] text-yellow-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-ping" />
                   عضو ویژه لوکس (VIP)
                 </span>
               ) : isPLUS ? (
                 <span className="text-[11px] text-neon-blue font-black uppercase tracking-[0.2em] flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-neon-blue animate-pulse" />
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
                <p className="text-[9px] text-gray-600 font-black uppercase mb-1.5 group-hover:text-neon-blue transition-colors italic">عضویت</p>
                <div className="flex flex-col items-center">
                  {loading ? (
                    <div className="h-4 w-8 bg-white/5 animate-pulse rounded" />
                  ) : (
                    <p className="text-sm font-black text-white italic">{user.stats?.daysSinceJoin || 0} روز</p>
                  )}
                </div>
             </div>
             <div className="text-center group">
                <p className="text-[9px] text-gray-600 font-black uppercase mb-1.5 group-hover:text-neon-pink transition-colors italic">دوستان</p>
                <div className="flex flex-col items-center">
                  {loading ? (
                    <div className="h-4 w-8 bg-white/5 animate-pulse rounded" />
                  ) : (
                    <p className="text-sm font-black text-white italic">{user.stats?.friendsCount || 0}</p>
                  )}
                </div>
             </div>
             <div className="text-center group">
                <p className="text-[9px] text-gray-600 font-black uppercase mb-1.5 group-hover:text-neon-purple transition-colors italic">لابی‌ها</p>
                <div className="flex flex-col items-center">
                  {loading ? (
                    <div className="h-4 w-8 bg-white/5 animate-pulse rounded" />
                  ) : (
                    <p className="text-sm font-black text-white italic">{user.stats?.lobbiesJoined || 0}</p>
                  )}
                </div>
             </div>
             <div className="text-center group">
                <p className="text-[9px] text-gray-600 font-black uppercase mb-1.5 group-hover:text-yellow-500 transition-colors italic">میزبانی</p>
                <div className="flex flex-col items-center">
                  {loading ? (
                    <div className="h-4 w-8 bg-white/5 animate-pulse rounded" />
                  ) : (
                    <p className="text-sm font-black text-white italic">{user.stats?.lobbiesCreated || 0}</p>
                  )}
                </div>
             </div>
          </div>

          {/* Badges Section */}
          <div className="space-y-4">
            <h5 className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">نشان‌های انتخابی و دستاوردها</h5>
            <div className="flex flex-wrap gap-2.5 max-h-[120px] overflow-y-auto no-scrollbar">
              {user.senderBadges?.map((ub, i) => (
                <div 
                  key={ub.id || i} 
                  title={ub.name} 
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border",
                    ub.isPinned 
                      ? "bg-neon-blue/10 border-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.2)]" 
                      : "bg-white/5 border-white/10 opacity-70 hover:opacity-100"
                  )}
                >
                  <img src={ub.iconUrl} alt={ub.name} className="h-4 w-4 object-contain" />
                  <span className={cn(
                    "text-[10px] font-black uppercase italic",
                    ub.isPinned ? "text-white" : "text-gray-500"
                  )}>{ub.name}</span>
                </div>
              ))}
              {!user.senderBadges?.length && !loading && (
                <p className="text-[10px] text-gray-500 italic">بدون نشان‌های کسب شده</p>
              )}
            </div>
          </div>

          {/* Games Section */}
          {user.games && user.games.length > 0 && (
            <div className="space-y-4">
              <h5 className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">بازی‌های فعال</h5>
              <div className="flex flex-wrap gap-3">
                {user.games.map((g, i) => (
                  <div key={g.id} className="relative group/game">
                    <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:border-neon-blue/50 transition-all">
                      <img src={g.bannerUrl} alt={g.title} className="h-full w-full object-cover grayscale group-hover/game:grayscale-0 transition-all" />
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 rounded text-[8px] text-white whitespace-nowrap opacity-0 group-hover/game:opacity-100 transition-opacity pointer-events-none z-30">
                      {g.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                  variant="blue" 
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
