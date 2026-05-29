import React, { useState, useEffect } from "react";
import { GlowButton } from "./GlowButton";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useFriends } from "../../context/FriendsContext";
import { BadgeType, MembershipType } from "../../types";
import { cn } from "../../lib/utils";
import {
  Award,
  Star,
  Zap,
  Crown,
  User,
  Shield,
  Sparkles,
  X,
  Trophy,
  MessageCircle,
  CheckCircle2,
  ShieldCheck,
  Flag,
} from "lucide-react";
import * as Icons from "lucide-react";
import api from "../../lib/api";
import { toast } from "react-hot-toast";
import { SmartImage } from "./SmartImage";
import { VIPMetadata } from "../../types";
import { useNavigate } from "react-router-dom";

export interface QuickProfileUser {
  senderName: string;
  displayName?: string;
  senderAvatar?: string;
  avatarUrl?: string; // fallback
  senderLevel: number;
  senderBadges?: any[]; // Dynamic badges
  membership?: MembershipType;
  role?: string;
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

export const QuickProfilePopover: React.FC<QuickProfilePopoverProps> = ({
  onClose,
  user: initialUser,
  isSelf,
}) => {
  const navigate = useNavigate();
  const { addFriend, openChat } = useFriends();
  const [sentRequest, setSentRequest] = useState(false);
  const [userData, setUserData] = useState<QuickProfileUser>(initialUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFullData = async () => {
      const identifier =
        initialUser.id ||
        (initialUser.senderName ? initialUser.senderName.trim() : null);
      if (!identifier) return;

      setLoading(true);
      try {
        // Encode the identifier to handle spaces
        const response = await api.get(
          `/user/${encodeURIComponent(identifier)}`,
        );
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
          role: data.role,
          senderLevel: data.level || initialUser.senderLevel,
          stats: data.stats,
          vipMetadata: data.vipMetadata,
          senderBadges: data.badges || [],
          games: data.games || [],
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
    if (isAdminUnified) {
      onClose();
      window.location.href = "https://loxx.ir/settings";
      return;
    }
    if (user.id) {
      openChat(user.id, user.senderName, user.senderAvatar || user.avatarUrl);
      onClose();
    }
  };

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const tiltX = useTransform(mouseY, [-150, 150], [10, -10]);
  const tiltY = useTransform(mouseX, [-150, 150], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const isAdminUnified =
    user.role === "ADMIN" ||
    user.senderName?.toLowerCase() === "admin" ||
    user.senderName?.toLowerCase()?.includes("admin") ||
    initialUser.role === "ADMIN";

  const isStreamer =
    (user as any).role === "STREAMER" ||
    user.senderBadges?.some(
      (b: any) => b.type === "STREAMER" || b.name === "STREAMER",
    );
  const isRealVIP =
    user.membership === MembershipType.VIP || user.membership === "VIP";
  const isVIP = isRealVIP || isStreamer;

  const primaryColorHex = isStreamer ? "#c084fc" : "#facc15";
  const isPLUS =
    user.membership === MembershipType.PLUS || user.membership === "PLUS";

  const getMetadata = (): VIPMetadata | null => {
    if (!isVIP && !isPLUS) return null;
    if (!user.vipMetadata) return null;
    try {
      return typeof user.vipMetadata === "string"
        ? JSON.parse(user.vipMetadata)
        : user.vipMetadata;
    } catch (e) {
      return null;
    }
  };

  const metadata = getMetadata();
  const bannerUrl = user.bannerUrl || "";

  const getBackgroundStyle = () => {
    let style: any = {};
    if (isAdminUnified) {
      style.background = "linear-gradient(to bottom, #110303, #1c0808, #0a0a0f)";
      style.border = "1px solid rgba(239, 68, 68, 0.45)";
      style.boxShadow = "0 30px 100px rgba(239, 68, 68, 0.2)";
      return style;
    }
    if (metadata && metadata.colors && metadata.colors.gradient?.enabled) {
      const { color1, color2, type, angle } = metadata.colors.gradient;
      if (type === "linear")
        style.background = `linear-gradient(${angle}deg, ${color1}, ${color2})`;
      else if (type === "radial")
        style.background = `radial-gradient(circle at center, ${color1}, ${color2})`;
      else
        style.background = `conic-gradient(from ${angle}deg, ${color1}, ${color2})`;
    } else if (metadata && metadata.colors && metadata.colors.bg) {
      style.backgroundColor = metadata.colors.bg;
    } else if (isStreamer) {
      style.backgroundImage =
        "linear-gradient(to bottom right, #c084fc, #7e22ce)";
    } else if (isVIP) {
      style.backgroundImage =
        "linear-gradient(to bottom right, #eab308, #a16207)";
    } else if (isPLUS) {
      style.backgroundColor = "#eab308";
    } else {
      style.backgroundColor = "#0a0a0f";
    }
    return style;
  };

  const getFontStyle = () => {
    if (metadata?.fontStyle === "lightning") {
      return {
        textShadow: "0 0 5px #fff, 0 0 10px #fff, 0 0 20px #0ff, 0 0 40px #0ff",
        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      };
    }
    if (metadata?.fontStyle === "fire") {
      return {
        textShadow:
          "0 -2px 4px #fff, 0 -2px 10px #ff3, 0 -10px 20px #fd3, 0 -18px 40px #f80",
        animation: "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      };
    }
    if (metadata?.fontStyle === "glitch") {
      return {
        textShadow: "2px 0 0 rgba(255,0,0,0.8), -2px 0 0 rgba(0,255,255,0.8)",
        animation: "pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      };
    }
    return {
      textShadow: isVIP
        ? "none"
        : "0 4px 12px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.5)",
    };
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
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [1, 1.02, 1],
                  filter: ["blur(0px)", "blur(2px)", "blur(0px)"],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.15,
                  delay: i * 0.4,
                }}
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
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [20, -120],
                  x: [i * 15, i * 15 + Math.sin(i) * 30],
                  opacity: [0, 1, 0],
                  scale: [1.2, 0.2],
                  rotate: [0, 180],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.8 + Math.random(),
                  delay: i * 0.15,
                }}
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
              filter: [
                "hue-rotate(0deg)",
                "hue-rotate(180deg)",
                "hue-rotate(0deg)",
              ],
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
                "0 0 10px #00e5ff, inset 0 0 10px #00e5ff",
              ],
              borderColor: ["#00e5ff", "#ffffff", "#00e5ff"],
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
            className={`absolute -inset-8 z-0 bg-[radial-gradient(circle,rgba(${isStreamer ? "168,85,247" : "250,204,21"},0.2)_0%,transparent_70%)] rounded-full pointer-events-none`}
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

  const pinnedBadges = user.senderBadges?.filter((b) => b.isPinned) || [];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        className={cn(
          "w-[380px] rounded-[48px] border overflow-hidden cursor-default rtl text-right transition-all backdrop-blur-3xl px-0 relative z-[20002]",
          metadata?.fullGlow
            ? isStreamer
              ? "border-purple-400"
              : "border-yellow-400"
            : isVIP
              ? isStreamer
                ? "border-purple-400/40 shadow-[0_40px_100px_rgba(0,0,0,1)]"
                : "border-yellow-400/40 shadow-[0_40px_100px_rgba(0,0,0,1)]"
              : "border-white/10 shadow-[0_40px_100px_rgba(0,0,0,1)]",
        )}
        style={{
          ...getBackgroundStyle(),
          borderColor: metadata?.colors?.accent
            ? metadata.colors.accent + "40"
            : metadata?.fullGlow
              ? undefined
              : undefined,
          boxShadow: metadata?.fullGlow
            ? `0 0 50px ${metadata?.colors?.glowColor || primaryColorHex}66`
            : undefined,
          rotateX: metadata?.tiltEffect ? tiltX : 0,
          rotateY: metadata?.tiltEffect ? tiltY : 0,
          transformPerspective: metadata?.tiltEffect ? 1000 : "none",
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseMove={metadata?.tiltEffect ? handleMouseMove : undefined}
        onMouseLeave={metadata?.tiltEffect ? handleMouseLeave : undefined}
      >
        {/* Custom BG Image */}
        {metadata?.bgImage && (
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: `url(${metadata.bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: metadata.opacity ?? 0.2,
            }}
          />
        )}

        {/* Floating Particles */}
        {metadata?.floatingParticles && (
          <div className="absolute inset-0 pointer-events-none z-[5] overflow-hidden">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-1 h-1 rounded-full bg-white/40 blur-[1px]"
                initial={{
                  x: Math.random() * 380,
                  y: Math.random() * 500,
                  scale: Math.random() * 1.5 + 0.5,
                }}
                animate={{
                  y: [null, -100, Math.random() * 500],
                  x: [null, Math.random() * 50 - 25, Math.random() * 50 - 25],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: Math.random() * 5 + 5,
                  repeat: Infinity,
                  ease: "linear",
                  delay: Math.random() * 3,
                }}
                style={{
                  backgroundColor:
                    metadata?.colors?.glowColor || primaryColorHex,
                }}
              />
            ))}
          </div>
        )}

        {/* Effects */}
        {metadata?.frame && renderFrameEffect(metadata.frame)}

        {/* Dynamic Banner */}
        <div
          className={cn(
            "h-40 relative overflow-hidden z-10",
            isAdminUnified
              ? "bg-gradient-to-br from-red-950 via-red-800 to-[#120303]"
              : (!bannerUrl &&
                  (isStreamer
                    ? "bg-gradient-to-br from-purple-400 via-purple-600 to-purple-900"
                    : isVIP
                      ? "bg-gradient-to-br from-[#facc15] via-[#eab308] to-[#ca8a04]"
                      : isPLUS
                        ? "bg-gradient-to-br from-neon-blue via-blue-600 to-indigo-800"
                        : "bg-gradient-to-l from-gray-800 to-gray-900")),
          )}
        >
          {bannerUrl && (
            <SmartImage
              src={bannerUrl}
              isVipEnabled={isVIP || isPLUS}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/40"></div>
          {(isVIP || isAdminUnified) && (
            <motion.div
              animate={{ opacity: [0.1, 0.4, 0.1], x: [-20, 20, -20] }}
              transition={{ duration: 7, repeat: Infinity }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(239,68,68,0.2),transparent_50%)]"
            />
          )}

          <div className="absolute top-6 left-6 flex items-center gap-2 z-20">
            {!isSelf && !isAdminUnified && (
              <button
                onClick={() => setShowReportModal(true)}
                className="h-10 w-10 rounded-full bg-black/60 text-gray-300 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all backdrop-blur-xl border border-white/10 shadow-lg"
                title="گزارش پروفایل"
              >
                <Icons.Flag size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-neon-pink hover:text-white transition-all backdrop-blur-xl border border-white/10 shadow-lg group"
            >
              <X
                size={20}
                className="group-hover:rotate-90 transition-transform"
              />
            </button>
          </div>
        </div>

        <div className="px-10 pb-10 pt-0 relative z-20">
          {/* Enhanced Readability Overlay - subtle darkening for text clarity */}
          <div className="absolute inset-0 z-[-1] bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />

          <div className="flex items-start justify-between">
            <div className="relative -mt-20 mb-6 inline-block">
              {isAdminUnified && (
                <motion.div
                  animate={{
                    opacity: [0.5, 0.9, 0.5],
                    scale: [0.98, 1.05, 0.98],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -inset-2 rounded-[46px] blur-xl bg-red-600/50 z-0 pointer-events-none"
                />
              )}
              {!isAdminUnified && (isVIP || isPLUS) && metadata?.auraEffect && (
                <motion.div
                  animate={{
                    opacity: [0.4, 0.9, 0.4],
                    scale: [0.95, 1.05, 0.95],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -inset-2 rounded-[46px] blur-xl z-0 pointer-events-none"
                  style={{
                    backgroundColor:
                      metadata?.colors?.auraColor || primaryColorHex,
                  }}
                />
              )}
              <div
                className={cn(
                  "h-32 w-32 rounded-[40px] bg-[#0a0a0f] p-[2px] shadow-2xl relative z-20",
                  isAdminUnified
                    ? "p-[3px] bg-gradient-to-tr from-red-600 via-red-300 to-red-800 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                    : (metadata?.specialFrame && metadata.frame === "lightning"
                        ? "p-0 border-blue-400 shadow-[0_0_15px_blue]"
                        : isStreamer
                          ? "p-[3px] bg-gradient-to-tr from-purple-400 via-purple-100 to-purple-600"
                          : isVIP
                            ? "p-[3px] bg-gradient-to-tr from-yellow-400 via-yellow-100 to-yellow-600"
                            : isPLUS
                              ? "p-[3px] bg-neon-blue"
                              : "border border-white/10"),
                )}
              >
                <div className="h-full w-full rounded-[34px] bg-[#0d0d12] flex items-center justify-center text-6xl overflow-hidden relative">
                  {user.senderAvatar || user.avatarUrl ? (
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
                  {!isAdminUnified && (isVIP || isPLUS) && metadata?.auraEffect && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-0 transparent"
                    />
                  )}
                </div>

                {/* Optional Avatar Frame Pulse */}
                {!isAdminUnified && metadata?.specialFrame && metadata.frame === "lightning" && (
                  <div className="absolute inset-0 border-2 border-blue-400 animate-pulse rounded-[40px] shadow-[0_0_15px_rgba(96,165,250,0.8)]" />
                )}
              </div>

              <div className="absolute top-1 right-1 h-7 w-7 bg-green-500 rounded-full border-[5px] border-[#0a0a0f] z-30 shadow-lg"></div>

              {isAdminUnified ? (
                <div className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full bg-red-600 text-white border-4 border-[#0a0a0f] flex items-center justify-center shadow-2xl z-20">
                  <Shield size={22} fill="currentColor" />
                </div>
              ) : isStreamer ? (
                <div className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full bg-purple-500 text-white border-4 border-[#0a0a0f] flex items-center justify-center shadow-2xl z-20">
                  <Icons.Radio size={22} />
                </div>
              ) : (
                isVIP && (
                  <div className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full bg-yellow-400 text-dark-bg border-4 border-[#0a0a0f] flex items-center justify-center shadow-2xl z-20">
                    <Crown size={22} fill="currentColor" />
                  </div>
                )
              )}
              {!isAdminUnified && isPLUS && (
                <div className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full bg-neon-blue text-dark-bg border-4 border-[#0a0a0f] flex items-center justify-center shadow-2xl z-20">
                  <Zap size={22} fill="currentColor" />
                </div>
              )}
            </div>

            {!isSelf && (
              <button
                onClick={handleMessage}
                className={cn(
                  "mt-6 h-14 w-14 rounded-3xl bg-white/10 text-white flex items-center justify-center transition-all border border-white/10 group active:scale-95 shadow-xl backdrop-blur-xl",
                  isAdminUnified ? "hover:bg-red-500 hover:text-white" : "hover:bg-neon-blue hover:text-dark-bg"
                )}
                title="ارسال پیام"
              >
                <MessageCircle
                  size={28}
                  className="group-hover:rotate-12 transition-transform"
                />
              </button>
            )}
          </div>

          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3">
                <h4
                  className={cn(
                    "text-3xl font-black italic tracking-tighter uppercase",
                    isAdminUnified ? "text-red-500" : (isVIP ? "text-[#0a0a0f]" : "text-white"),
                    metadata?.shinyName && "animate-pulse",
                  )}
                  style={{
                    ...(isAdminUnified
                      ? { textShadow: "0 0 10px rgba(239, 68, 68, 0.6)" }
                      : (metadata && metadata.colors && (isVIP || isPLUS)
                        ? metadata.colors.textGradient
                          ? {
                              backgroundImage: `linear-gradient(to right, ${metadata.colors.text}, ${metadata.colors.textGradient})`,
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                            }
                          : { color: metadata.colors.text }
                        : {})),
                    ...getFontStyle(),
                  }}
                >
                  {user.displayName || user.senderName}
                </h4>
                <div className="flex items-center gap-0.5">
                  {!isAdminUnified && user.senderBadges
                    ?.filter((b) => b?.isSpecial)
                    .map((badge) => (
                      <img
                        key={badge.id}
                        src={badge.iconUrl}
                        alt={badge.name}
                        title={badge.name}
                        className="h-6 w-6 object-contain"
                      />
                    ))}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {isAdminUnified ? (
                  <span
                    className="text-xs font-black uppercase tracking-[0.1em] flex items-center gap-2 text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    مدیریت رسمی پلتفرم لوکس
                  </span>
                ) : isStreamer ? (
                  <span
                    className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2"
                    style={{ color: metadata?.colors?.accent || "#c084fc" }}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
                    عضو تیم استریم
                  </span>
                ) : isVIP ? (
                  <span
                    className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2"
                    style={{ color: metadata?.colors?.accent || "#facc15" }}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
                    عضو ویژه لوکس (VIP)
                  </span>
                ) : isPLUS ? (
                  <span
                    className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2"
                    style={{ color: metadata?.colors?.accent || "#00e5ff" }}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    عضو طلایی پلاس (PLUS)
                  </span>
                ) : (
                  <p className="text-[11px] text-gray-500 font-black uppercase tracking-[0.2em]">
                    گیمر تایید شده لول {user.senderLevel}
                  </p>
                )}
              </div>
            </div>

            {/* Accurate Statistics Grid */}
            {isAdminUnified ? (
              <div className="py-6 border-y border-white/5 space-y-4 text-right">
                <div className="flex items-start gap-4 bg-red-950/20 border border-red-500/15 p-4 rounded-2xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 h-16 w-16 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-red-400">حساب رسمی مدیریت لوکس</p>
                    <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                      این اکانت به عنوان مدیریت ارشد پلتفرم لوکس فعالیت می‌کند. جهت طرح هرگونه سوال، پیشنهاد، همکاری یا پشتیبانی اختصاصی، دکمه زیر را بفشارید.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                    <p className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wider mb-1">حمایت فنی و نظارت</p>
                    <p className="text-xs font-black text-emerald-400">تمام وقت متصل</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                    <p className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wider mb-1">سمت کاربری</p>
                    <p className="text-xs font-black text-red-500">مدیر کل کلان سیستم</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-4 py-6 border-y border-white/5">
                  <div className="text-center group">
                    <p
                      className="text-[9px] font-black uppercase mb-1.5 group-hover:text-neon-blue transition-colors italic"
                      style={{
                        color:
                          metadata?.colors?.statsLabel ||
                          (isVIP ? "#451a03" : "#4b5563"),
                      }}
                    >
                      عضویت
                    </p>
                    <div className="flex flex-col items-center">
                      {loading ? (
                        <div className="h-4 w-8 bg-white/5 animate-pulse rounded" />
                      ) : (
                        <p
                          className="text-sm font-black italic"
                          style={{
                            color:
                              isVIP && !metadata?.colors?.text
                                ? "#0a0a0f"
                                : metadata?.colors?.statsText ||
                                  metadata?.colors?.text ||
                                  "white",
                            textShadow: isVIP
                              ? "none"
                              : "0 2px 4px rgba(0,0,0,0.5)",
                          }}
                        >
                          {user.stats?.daysSinceJoin || 0} روز
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-center group">
                    <p
                      className="text-[9px] font-black uppercase mb-1.5 group-hover:text-neon-pink transition-colors italic"
                      style={{
                        color:
                          metadata?.colors?.statsLabel ||
                          (isVIP ? "#451a03" : "#4b5563"),
                      }}
                    >
                      دوستان
                    </p>
                    <div className="flex flex-col items-center">
                      {loading ? (
                        <div className="h-4 w-8 bg-white/5 animate-pulse rounded" />
                      ) : (
                        <p
                          className="text-sm font-black italic"
                          style={{
                            color:
                              isVIP && !metadata?.colors?.text
                                ? "#0a0a0f"
                                : metadata?.colors?.statsText ||
                                  metadata?.colors?.text ||
                                  "white",
                            textShadow: isVIP
                              ? "none"
                              : "0 2px 4px rgba(0,0,0,0.5)",
                          }}
                        >
                          {user.stats?.friendsCount || 0}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-center group">
                    <p
                      className="text-[9px] font-black uppercase mb-1.5 group-hover:text-neon-purple transition-colors italic"
                      style={{
                        color:
                          metadata?.colors?.statsLabel ||
                          (isVIP ? "#451a03" : "#4b5563"),
                      }}
                    >
                      لابی‌ها
                    </p>
                    <div className="flex flex-col items-center">
                      {loading ? (
                        <div className="h-4 w-8 bg-white/5 animate-pulse rounded" />
                      ) : (
                        <p
                          className="text-sm font-black italic"
                          style={{
                            color:
                              isVIP && !metadata?.colors?.text
                                ? "#0a0a0f"
                                : metadata?.colors?.statsText ||
                                  metadata?.colors?.text ||
                                  "white",
                            textShadow: isVIP
                              ? "none"
                              : "0 2px 4px rgba(0,0,0,0.5)",
                          }}
                        >
                          {user.stats?.lobbiesJoined || 0}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-center group">
                    <p
                      className="text-[9px] font-black uppercase mb-1.5 group-hover:text-yellow-500 transition-colors italic"
                      style={{
                        color:
                          metadata?.colors?.statsLabel ||
                          (isVIP ? "#451a03" : "#4b5563"),
                      }}
                    >
                      میزبانی
                    </p>
                    <div className="flex flex-col items-center">
                      {loading ? (
                        <div className="h-4 w-8 bg-white/5 animate-pulse rounded" />
                      ) : (
                        <p
                          className="text-sm font-black italic"
                          style={{
                            color:
                              isVIP && !metadata?.colors?.text
                                ? "#0a0a0f"
                                : metadata?.colors?.statsText ||
                                  metadata?.colors?.text ||
                                  "white",
                            textShadow: isVIP
                              ? "none"
                              : "0 2px 4px rgba(0,0,0,0.5)",
                          }}
                        >
                          {user.stats?.lobbiesCreated || 0}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Badges Section */}
                <div className="space-y-4">
                  <h5
                    className="text-[10px] font-black uppercase tracking-widest italic"
                    style={{
                      color:
                        metadata?.colors?.statsLabel ||
                        (isVIP ? "#451a03" : "#4b5563"),
                    }}
                  >
                    نشان‌های انتخابی و دستاوردها
                  </h5>
                  <div className="flex flex-wrap gap-2.5 max-h-[120px] overflow-y-auto no-scrollbar">
                    {user.senderBadges
                      ?.filter((b) => b.isPinned)
                      .map((ub, i) => (
                        <div
                          key={ub.id || i}
                          title={ub.name}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border",
                            "bg-neon-blue/10 border-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.2)]",
                          )}
                        >
                          <img
                            src={ub.iconUrl}
                            alt={ub.name}
                            className="h-4 w-4 object-contain"
                          />
                          <span
                            className="text-[10px] font-black uppercase italic"
                            style={{
                              color:
                                isVIP && !metadata?.colors?.badgeText
                                  ? "#0a0a0f"
                                  : metadata?.colors?.badgeText || "white",
                              textShadow: isVIP
                                ? "none"
                                : "0 1px 2px rgba(0,0,0,0.5)",
                            }}
                          >
                            {ub.name}
                          </span>
                        </div>
                      ))}
                    {user.senderBadges
                      ?.filter((b) => !b.isPinned)
                      .slice(0, 5)
                      .map((ub, i) => (
                        <div
                          key={ub.id || i}
                          title={ub.name}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border",
                            isVIP
                              ? "bg-black/10 border-black/10"
                              : "bg-white/5 border-white/10 opacity-70 hover:opacity-100",
                          )}
                        >
                          <img
                            src={ub.iconUrl}
                            alt={ub.name}
                            className="h-4 w-4 object-contain"
                          />
                          <span
                            className="text-[10px] font-black uppercase italic"
                            style={{
                              color:
                                isVIP && !metadata?.colors?.badgeText
                                  ? "#0a0a0f"
                                  : metadata?.colors?.badgeText || "#6b7280",
                            }}
                          >
                            {ub.name}
                          </span>
                        </div>
                      ))}
                    {!user.senderBadges?.length && !loading && (
                      <p className="text-[10px] text-gray-500 italic">
                        بدون نشان‌های کسب شده
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Streamer Links UI */}
            {isStreamer &&
              (metadata?.streamerLinks?.aparat ||
                metadata?.streamerLinks?.twitch ||
                metadata?.streamerLinks?.youtube ||
                metadata?.streamerLinks?.kick ||
                metadata?.streamerLinks?.donate) && (
                <div className="space-y-4 pt-5 mt-4 border-t border-white/5">
                  <h5 className="text-[11px] font-extrabold uppercase tracking-widest italic text-neon-purple flex gap-2 items-center justify-center">
                    <Icons.Radio size={14} className="animate-pulse" /> کانال‌های پخش زنده استریمر
                  </h5>
                  <div className="grid grid-cols-1 gap-3">
                    {metadata.streamerLinks.twitch && (
                      <a
                        href={metadata.streamerLinks.twitch}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-2xl bg-[#9146FF]/10 hover:bg-[#9146FF]/25 border border-[#9146FF]/30 hover:border-[#9146FF]/70 hover:shadow-[0_0_20px_rgba(145,70,255,0.4)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group"
                      >
                        <div className="h-10 w-10 rounded-xl bg-[#9146FF]/20 flex items-center justify-center text-[#9146FF]">
                          <Icons.Twitch
                            size={22}
                            className="group-hover:scale-110 group-hover:rotate-6 transition-transform"
                          />
                        </div>
                        <div className="flex-1 text-right">
                          <span
                            className="text-[10px] text-purple-300 font-bold block mb-0.5"
                            dir="ltr"
                          >
                            TWITCH.TV
                          </span>
                          <h4 className="text-sm font-black text-white italic">
                            پخش زنده در توییچ
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#9146FF]/20 px-2.5 py-1 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                          <span className="text-[9px] font-black uppercase text-purple-200">
                            LIVE
                          </span>
                        </div>
                      </a>
                    )}

                    {metadata.streamerLinks.aparat && (
                      <a
                        href={metadata.streamerLinks.aparat}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-2xl bg-[#ED1C24]/10 hover:bg-[#ED1C24]/25 border border-[#ED1C24]/30 hover:border-[#ED1C24]/70 hover:shadow-[0_0_20px_rgba(237,28,36,0.4)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group"
                      >
                        <div className="h-10 w-10 rounded-xl bg-[#ED1C24]/20 flex items-center justify-center text-[#ED1C24]">
                          <Icons.Tv
                            size={22}
                            className="group-hover:scale-110 group-hover:-rotate-6 transition-transform"
                          />
                        </div>
                        <div className="flex-1 text-right">
                          <span
                            className="text-[10px] text-pink-300 font-bold block mb-0.5"
                            dir="ltr"
                          >
                            APARAT.COM
                          </span>
                          <h4 className="text-sm font-black text-white italic">
                            پخش زنده در آپارات
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#ED1C24]/20 px-2.5 py-1 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                          <span className="text-[9px] font-black uppercase text-pink-200">
                            LIVE
                          </span>
                        </div>
                      </a>
                    )}

                    {metadata.streamerLinks.kick && (
                      <a
                        href={metadata.streamerLinks.kick}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-2xl bg-[#53FC18]/10 hover:bg-[#53FC18]/25 border border-[#53FC18]/30 hover:border-[#53FC18]/70 hover:shadow-[0_0_20px_rgba(83,252,24,0.3)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group"
                      >
                        <div className="h-10 w-10 rounded-xl bg-[#53FC18]/20 flex items-center justify-center text-[#53FC18]">
                          <Icons.MonitorPlay
                            size={22}
                            className="group-hover:scale-110 transition-transform text-[#53FC18]"
                          />
                        </div>
                        <div className="flex-1 text-right">
                          <span
                            className="text-[10px] text-green-300 font-bold block mb-0.5"
                            dir="ltr"
                          >
                            KICK.COM
                          </span>
                          <h4 className="text-sm font-black text-white italic">
                            پخش زنده در کیک
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#53FC18]/20 px-2.5 py-1 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                          <span className="text-[9px] font-black uppercase text-green-200">
                            LIVE
                          </span>
                        </div>
                      </a>
                    )}

                    {metadata.streamerLinks.youtube && (
                      <a
                        href={metadata.streamerLinks.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-2xl bg-[#FF0000]/10 hover:bg-[#FF0000]/25 border border-[#FF0000]/30 hover:border-[#FF0000]/70 hover:shadow-[0_0_20px_rgba(255,0,0,0.4)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group"
                      >
                        <div className="h-10 w-10 rounded-xl bg-[#FF0000]/20 flex items-center justify-center text-[#FF0000]">
                          <Icons.Youtube
                            size={22}
                            className="group-hover:scale-110 transition-transform"
                          />
                        </div>
                        <div className="flex-1 text-right">
                          <span
                            className="text-[10px] text-red-300 font-bold block mb-0.5"
                            dir="ltr"
                          >
                            YOUTUBE.COM
                          </span>
                          <h4 className="text-sm font-black text-white italic">
                            کانال رسمی یوتیوب
                          </h4>
                        </div>
                        <Icons.ChevronLeft
                          size={16}
                          className="text-red-400 opacity-60"
                        />
                      </a>
                    )}

                    {metadata.streamerLinks.donate && (
                      <a
                        href={metadata.streamerLinks.donate}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 hover:from-amber-500/20 hover:to-amber-500/20 border border-yellow-500/30 hover:border-yellow-500/70 hover:shadow-[0_0_30px_rgba(234,179,8,0.30)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group"
                      >
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-[#0a0a0f] shadow-lg shadow-yellow-500/20">
                          <Icons.Heart
                            size={20}
                            className="group-hover:scale-125 transition-transform"
                            fill="currentColor"
                          />
                        </div>
                        <div className="flex-1 text-right">
                          <span className="text-[10px] text-yellow-500 font-bold block mb-0.5">
                            SUPPORT STREAMER
                          </span>
                          <h4 className="text-sm font-black text-white italic">
                            درگاه حمایت مالی (Donate)
                          </h4>
                        </div>
                        <Icons.ChevronLeft
                          size={16}
                          className="text-yellow-400 animate-pulse"
                        />
                      </a>
                    )}
                  </div>
                </div>
              )}

            {/* Actions */}
            <div className="pt-4">
              {!isSelf ? (
                isAdminUnified ? (
                  <GlowButton
                    variant="purple"
                    className="w-full h-16 !rounded-3xl font-black text-base uppercase italic tracking-wide shadow-2xl relative overflow-hidden group bg-gradient-to-r from-red-700 via-red-500 to-red-700 text-white border-none shadow-[0_10px_40px_rgba(239,68,68,0.3)] hover:scale-[1.02] transition-transform"
                    onClick={handleMessage}
                  >
                    <span className="flex items-center gap-2 justify-center font-black tracking-wide">
                      <MessageCircle size={20} /> ارتباط با مدیریت
                    </span>
                  </GlowButton>
                ) : (
                  <GlowButton
                    variant={sentRequest ? "purple" : isVIP ? "purple" : "blue"}
                    className={cn(
                      "w-full h-16 !rounded-3xl font-black text-base uppercase italic tracking-[0.2em] shadow-2xl relative overflow-hidden group",
                      isVIP &&
                        "bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 text-dark-bg border-none shadow-[0_10px_40px_rgba(250,204,21,0.3)] hover:scale-[1.02]",
                      isStreamer &&
                        "bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600 text-white border-none shadow-[0_10px_40px_rgba(168,85,247,0.3)] hover:scale-[1.02]",
                    )}
                    onClick={handleAddFriend}
                    disabled={sentRequest}
                  >
                    {sentRequest ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 size={20} /> درخواست ارسال شد
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 group-hover:scale-110 transition-transform tracking-widest italic font-black uppercase">
                        افزودن به لیست دوستان
                      </span>
                    )}
                  </GlowButton>
                )
              ) : (
                <GlowButton
                  variant={isVIP ? "gold" : "blue"}
                  className="w-full h-16 !rounded-3xl font-black text-base uppercase italic tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all"
                  onClick={() => {
                    onClose();
                    navigate("/settings");
                  }}
                >
                  ویرایش اطلاعات پروفایل
                </GlowButton>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[30000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
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
                  <Icons.AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white italic tracking-tighter">
                    گزارش پروفایل تخلف
                  </h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
                    Report Profile
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">
                    دلیل گزارش
                  </label>
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
                  onClick={() => {
                    setShowReportModal(false);
                    setReportReason("");
                  }}
                  className="flex-1 h-12 rounded-xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 hover:text-white transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={async () => {
                    if (!reportReason.trim()) {
                      toast.error("لطفاً دلیل گزارش را بنویسید");
                      return;
                    }
                    try {
                      await api.post("/reports", {
                        reportedUserId: user.id,
                        targetId: user.id?.toString(),
                        targetType: "PROFILE",
                        reason: reportReason,
                      });
                      toast.success("گزارش شما با موفقیت ثبت شد");
                      setShowReportModal(false);
                      setReportReason("");
                    } catch (e: any) {
                      toast.error(
                        e.response?.data?.error?.message || "خطا در ثبت گزارش",
                      );
                      setShowReportModal(false);
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
    </>
  );
};

const BadgeIcon: React.FC<{ type: BadgeType }> = ({ type }) => {
  const configs: Record<string, { icon: any; color: string; label: string }> = {
    [BadgeType.STREAMER]: {
      icon: Zap,
      color: "text-blue-400",
      label: "Streamer",
    },
    [BadgeType.PRO]: { icon: Award, color: "text-pink-400", label: "Pro" },
    [BadgeType.LOBBY_MASTER]: {
      icon: Star,
      color: "text-yellow-400",
      label: "Master",
    },
    [BadgeType.VIP]: { icon: Crown, color: "text-yellow-500", label: "VIP" },
    [BadgeType.CHAMPION]: {
      icon: Trophy,
      color: "text-yellow-400",
      label: "Champ",
    },
    [BadgeType.PLUS]: { icon: Zap, color: "text-neon-blue", label: "Plus" },
    [BadgeType.FOUNDER]: {
      icon: Shield,
      color: "text-neon-purple",
      label: "Founder",
    },
  };

  const config = configs[type] || {
    icon: Award,
    color: "text-gray-400",
    label: type,
  };
  const Icon = config.icon;

  return (
    <div
      title={config.label}
      className={cn(
        "px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2",
        config.color,
      )}
    >
      <Icon size={14} fill="currentColor" />
      <span className="text-[10px] font-black uppercase tracking-tighter italic">
        {config.label}
      </span>
    </div>
  );
};
