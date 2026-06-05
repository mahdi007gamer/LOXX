import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useLobby } from "../context/LobbyContext";
import { useAuth } from "../context/AuthContext";
import { Sidebar } from "../components/layout/Sidebar";
import { useWebRTC } from "../hooks/useWebRTC";
import { chatSocket, lobbySocket, voiceSocket, mainPlatformVoiceSocket, getSharedAudioContext, resumeSharedAudioContext } from "../lib/socket";
import { toast } from "react-hot-toast";
import { getFileUrl } from "../lib/constants";
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
 Crown,
 ShieldAlert,
 Gavel,
 Gamepad2,
 CheckCircle2,
 UserCheck,
 Radio,
 LayoutTemplate,
 VolumeX,
 Volume2,
 Reply,
 MonitorUp,
 Monitor,
 AlertTriangle,
 Minus,
 Music,
 SkipBack,
 SkipForward
} from "lucide-react";
import { GlowButton } from "../components/ui/GlowButton";
import { useFriends } from "../context/FriendsContext";
import { ShareQuality, SHARE_QUALITIES, useSmartScreenShare } from "../hooks/useSmartScreenShare";
import { ScreenShareModal } from "../components/ScreenShareModal";
import { DesktopSourcePickerModal } from "../components/DesktopSourcePickerModal";
import { ScreenSharePresenter } from "../components/ScreenSharePresenter";
import { UserBadges } from "../components/ui/UserBadges";
import { Modal } from "../components/ui/Modal";
import { useProfilePopover } from "../context/ProfilePopoverContext";
import { useLanguage } from "../context/LanguageContext";
import { MembershipType } from "../types";
import { SmartImage } from "../components/ui/SmartImage";
import { cn } from "../lib/utils";
import loxxApi from "../lib/api";

interface Player {
 id: string;
 name: string;
 avatar: string;
 avatarUrl?: string; // fallback
 level?: number;
 membership?: MembershipType;
 vipMetadata?: any;
 bannerUrl?: string;
 rank: string;
 isHost?: boolean;
 isReady: boolean;
 hasMic: boolean;
 isMuted: boolean;
 ping: number;
 isSpeaking: boolean;
 volume: number;
 activity: number;
 badges?: any[];
 isVerified?: boolean;
 role?: string;
}

interface Message {
 id: string;
 user: string;
 avatarUrl?: string;
 text: string;
 time: string;
 isSystem?: boolean;
 toUserId?: string; // null for lobby chat
 fromUserId?: string;
 badges?: any[];
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
 updateLobbySettings,
 kickPlayer,
 banPlayer,
 isJoining,
 joinError,

 // Voice states fetched globally
 localStream,
 voiceMode,
 setVoiceMode,
 pttKey,
 setPttKey,
 isPttPressed,
 setIsPttPressed,
 isAudioContextResumed,
 resumeAudio,
 peerVolumes,
 peerActivity,
 localVolume,
 setPeerVolume,

 // Overlay settings fetched globally
 overlayEnabled,
 setOverlayEnabled,
 overlayPosition,
 setOverlayPosition,
 overlaySize,
 setOverlaySize,
 overlayOnlyTalking,
 setOverlayOnlyTalking,
 overlayMembersVisible,
 setOverlayMembersVisible,
 overlayNormalOpacity,
 setOverlayNormalOpacity,
 overlaySpeakingOpacity,
 setOverlaySpeakingOpacity,

 // Electron bindings
 isElectron,
 launcherCloseToTray,
 launcherStartAtLogin,
 launcherHardwareAcceleration,
 launcherGlobalPttKey,
 launcherGlobalMuteKey,
 updateLauncherSettings,

 // New Desktop bindings
 audioInputDevices,
 audioOutputDevices,
 selectedAudioInput,
 setSelectedAudioInput,
 selectedAudioOutput,
 setSelectedAudioOutput,
 refreshAudioDevices,
 transparentOverlayEnabled,
 setTransparentOverlayEnabled,
 overlayX,
 overlayY,
 overlayWidth,
 overlayHeight,
 overlayOpacity,
 overlayClickThrough,
 gameDetected,
 launcherRichPresenceEnabled,
 setLauncherRichPresenceEnabled,
 isDeafened,
 setIsDeafened,
 micSensitivity,
 setMicSensitivity,
 micOpenDelay,
 setMicOpenDelay,
 micCloseDelay,
 setMicCloseDelay,
 remoteStreams,
 setScreenStreamForWebRTC,
 peerPings,
 isMediasoupSFU
 } = useLobby();
 const { 
  noiseCanceling, setNoiseCanceling, isMicTestOn, setIsMicTestOn,
  musicBotState, toggleMusicBot, controlMusicBot,
  musicVolumeSilence, setMusicVolumeSilence,
  musicVolumeTalking, setMusicVolumeTalking,
  setBotStream
 } = useLobby();

 const { user, isSidebarCollapsed, setIsSidebarCollapsed } = useAuth();
 const { direction, t, language } = useLanguage();
 const isRtl = direction === "rtl" || language === "fa";
 const { openChat, addFriend } = useFriends();
 const { openProfile } = useProfilePopover();
 
 const [copied, setCopied] = useState(false);
 const [isChatOpen, setIsChatOpen] = useState(false); // Mobile chat

 // Local Mic Test Loopback - Now handled with absolute real-time gate delays and sensitivity inside LobbyContext
  useEffect(() => {
    // No-op here since voice analysis Web Audio API manages gated mic testing cleanly
  }, [isMicTestOn, localStream]);
 const messages = useMemo(() => {
 return [
 { id: "system-1", user: "LOXX BOT", text: t("lobbyCreated"), time: "System", isSystem: true, fromUserId: "system" },
 ...(lobby?.messages?.map(m => ({
 id: m.id,
 fromUserId: m.from?.userId || m.senderId,
 user: m.from?.username || m.sender?.username || "بازیکن",
 avatarUrl: (m.from as any)?.avatarUrl || m.sender?.profile?.avatarUrl,
 badges: (m.from as any)?.badges?.map((ub: any) => ub.badge) || m.sender?.badges?.map((ub: any) => ub.badge) || [],
 text: m.content,
 time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"
 })) || [])
 ];
 }, [lobby?.messages]);

 const [libraryCategories, setLibraryCategories] = useState<{ [category: string]: any[] }>({});
 const [selectedLibCategory, setSelectedLibCategory] = useState<string>("");

 useEffect(() => {
   loxxApi.get("/musicbot/tracks")
    .then(res => {
     const data = res.data;
     if (data?.status === "success") {
      setLibraryCategories(data.data || {});
      const cats = Object.keys(data.data || {});
      if (cats.length > 0) setSelectedLibCategory(cats[0]);
     }
    })
    .catch(console.error);
  }, []);

 const [isDesktopChatOpen, setIsDesktopChatOpen] = useState(false); // Desktop chat
 const [unreadDesktopChat, setUnreadDesktopChat] = useState(0);

 const prevLastMessage = useRef<string | null>(null);
 useEffect(() => {
 if (messages.length > 0) {
 const last = messages[messages.length - 1];
 if (last.id !== prevLastMessage.current) {
 prevLastMessage.current = last.id;
 if (!isDesktopChatOpen && last.fromUserId !== user?.id && !last.isSystem) {
 setUnreadDesktopChat(p => p + 1);
 }
 }
 }
 }, [messages, isDesktopChatOpen, user?.id]);

 useEffect(() => {
 if (isDesktopChatOpen) setUnreadDesktopChat(0);
 }, [isDesktopChatOpen]);

 const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
 const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
 const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
 const [showFallbackModal, setShowFallbackModal] = useState(false);
 const [hasShownFallbackModal, setHasShownFallbackModal] = useState(false);

 useEffect(() => {
   if (typeof window !== "undefined") {
     const isSocketFallback = localStorage.getItem("loxx_socket_fallback_active") === "true";
     const isVoiceFallback = localStorage.getItem("loxx_voice_fallback_active") === "true";
     
     if ((isSocketFallback || isVoiceFallback || !isMediasoupSFU) && !hasShownFallbackModal) {
       const timer = setTimeout(() => {
         setShowFallbackModal(true);
         setHasShownFallbackModal(true);
       }, 1500);
       return () => clearTimeout(timer);
     }
   }
 }, [isMediasoupSFU, hasShownFallbackModal]);
 const [activeProfileUserId, setActiveProfileUserId] = useState<string | null>(null);
 const [layoutMode, setLayoutMode] = useState<'default' | 'compact' | 'discord'>(() => (localStorage.getItem('loxx-lobby-layout') as any) || 'default');

 // Loxx music bot advanced states
 const [showBotSetupModal, setShowBotSetupModal] = useState(false);
 const [setupStep, setSetupStep] = useState<"source" | "loxx_genre" | "loxx_category">("source");
 const [selectedGenre, setSelectedGenre] = useState<"irani" | "kharegi" | null>(null);
 const [selectedCategoryData, setSelectedCategoryData] = useState<any>(null);
 const [selectedLocalFiles, setSelectedLocalFiles] = useState<File[]>([]);
 const [localPlayMode, setLocalPlayMode] = useState<"in-order" | "random">("random");
 const [loxxLibrary, setLoxxLibrary] = useState<{ irani: any; kharegi: any } | null>(null);
 const [isMusicPlayerExpanded, setIsMusicPlayerExpanded] = useState(true);
 const [windowDims, setWindowDims] = useState({ width: 0, height: 0 });

 useEffect(() => {
  if (typeof window !== "undefined") {
   setWindowDims({ width: window.innerWidth, height: window.innerHeight });
   const handleResize = () => setWindowDims({ width: window.innerWidth, height: window.innerHeight });
   window.addEventListener("resize", handleResize);
   return () => window.removeEventListener("resize", handleResize);
  }
 }, []);

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const localMusicAudioRef = useRef<HTMLAudioElement | null>(null);
  const hostVolumeFaderRef = useRef<number | null>(null);
  const hostCurrentVolumeRef = useRef<number>(1);
  const [localMusicDuration, setLocalMusicDuration] = useState(0);
  const [localMusicCurrentTime, setLocalMusicCurrentTime] = useState(0);

 const fetchLoxxLibrary = useCallback(() => {
   loxxApi.get("/musicbot/loxx-library")
    .then(res => {
     const data = res.data;
     if (data?.status === "success" && data.data) {
      setLoxxLibrary(data.data);
     }
    })
    .catch(console.error);
  }, []);

 const playLoxxCategory = useCallback((categoryData: any) => {
  if (!categoryData || !categoryData.tracks || categoryData.tracks.length === 0) return;
  const queue = categoryData.tracks.map((t: any) => ({
   name: t.title,
   url: t.url
  }));
  toggleMusicBot(true);
  setTimeout(() => {
   controlMusicBot("update-queue", {
    queue,
    queueIndex: 0,
    trackUrl: queue[0].url,
    trackName: queue[0].name,
    category: categoryData.name,
    isPlaying: true
   });
   toast.success(isRtl ? `شروع پخش پوشه ${categoryData.name}` : `Streaming playlist folder: ${categoryData.name}`);
   setShowBotSetupModal(false);
  }, 500);
 }, [toggleMusicBot, controlMusicBot, isRtl]);



 const userPlanResolved = ((user as any)?.role === "ADMIN" || (user as any)?.membership === "VIP" || (user as any)?.profile?.membershipType === "VIP") 
 ? "VIP" 
 : (((user as any)?.membership === "PLUS" || (user as any)?.profile?.membershipType === "PLUS") ? "PLUS" : "NORMAL");

 const {
 estimatedUploadMbps,
 isTestingBandwidth,
 screenStream,
 currentQuality,
 startShare,
 stopShare,
 isBaseRequirementMet,
 isWarningActive
 } = useSmartScreenShare(
 userPlanResolved,
 lobby?.players?.length || 1,
 typeof window !== "undefined" && !!(window as any).electronAPI,
 setScreenStreamForWebRTC
 );
 
 const [isScreenShareModalOpen, setIsScreenShareModalOpen] = useState(false);
 const [isSourcePickerOpen, setIsSourcePickerOpen] = useState(false);
 const [pendingSourceId, setPendingSourceId] = useState<string | null>(null);

 const initiateScreenShareFlow = () => {
 const api = (window as any).electronAPI;
 if (api && api.getDesktopSources) {
 setIsSourcePickerOpen(true);
 } else {
 setIsScreenShareModalOpen(true);
 }
 };

 const handleSourceSelected = (sourceId: string) => {
 setPendingSourceId(sourceId);
 setIsSourcePickerOpen(false);
 setIsScreenShareModalOpen(true);
 };

 const handleQualitySelected = (quality: ShareQuality) => {
 setIsScreenShareModalOpen(false);
 startShare(quality, pendingSourceId || undefined);
 setPendingSourceId(null);
 };


 // Compute active remote screen share (if any user in the lobby is sharing video tracks)
 const activeRemoteShare = useMemo(() => {
 if (!remoteStreams) return null;
 for (const [peerId, stream] of remoteStreams.entries()) {
 if (stream.getVideoTracks().length > 0) {
 const presenter = lobby?.players?.find(p => p.userId === peerId);
 return { peerId, stream, presenterName: presenter?.username || "Guest Player" };
 }
 }
 return null;
 }, [remoteStreams, lobby?.players]);

 const toggleLayout = () => {
 const modes: ('default' | 'compact' | 'discord')[] = ['default', 'compact', 'discord'];
 const nextMode = modes[(modes.indexOf(layoutMode) + 1) % modes.length];
 setLayoutMode(nextMode);
 localStorage.setItem('loxx-lobby-layout', nextMode);
 toast(`حالت نمایش: ${nextMode === 'default' ? 'استاندارد' : nextMode === 'compact' ? 'فشرده و ساده' : 'مدل دیسکورد'}`, { icon: "🎨" });
 };

 const [wasInLobby, setWasInLobby] = useState(false);
 const hasCollapsedOnMount = useRef(false);

 // Join lobby on mount
 useEffect(() => {
 if (id) {
 joinLobby(id);
 }
 // Collapse right sidebar by default only on initial enter/mount
 if (!hasCollapsedOnMount.current) {
 setIsSidebarCollapsed(true);
 hasCollapsedOnMount.current = true;
 }
 }, [id, setIsSidebarCollapsed]);

 // Automatically activate voice system and unmute voice with zero clicks when entering any lobby
 useEffect(() => {
 if (lobby?.id && !isAudioContextResumed) {
 resumeAudio().catch(err => {
 console.warn("Auto-play / AudioContext resumption blocked, waiting for click/touch gesture:", err);
 });
 }
 }, [lobby?.id, isAudioContextResumed, resumeAudio]);

 // Global user interaction listener to silently unlock audio context if still suspended by the browser
 useEffect(() => {
 const handleSilenceUnlock = () => {
 if (!isAudioContextResumed && lobby?.id) {
 resumeAudio().catch(() => {});
 }
 };
 window.addEventListener("click", handleSilenceUnlock, { once: true });
 window.addEventListener("keydown", handleSilenceUnlock, { once: true });
 window.addEventListener("touchstart", handleSilenceUnlock, { once: true });
 return () => {
 window.removeEventListener("click", handleSilenceUnlock);
 window.removeEventListener("keydown", handleSilenceUnlock);
 window.removeEventListener("touchstart", handleSilenceUnlock);
 };
 }, [lobby?.id, isAudioContextResumed, resumeAudio]);

 // Redirect if lobby becomes null (e.g., closed by host) or if joining fails
 const [countdown, setCountdown] = useState(5);
 const [isListeningForKey, setIsListeningForKey] = useState(false);

 useEffect(() => {
 if (lobby) setWasInLobby(true);
 if ((wasInLobby && !lobby && id) || joinError) {
 navigate("/lobbies");
 }
 }, [lobby, wasInLobby, id, navigate, joinError]);

 const [botProfile, setBotProfile] = useState<any>(null);

 useEffect(() => {
  if (!musicBotState?.active) return;
  fetch('/api/musicbot/profile', {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("loxx_token")}`
    }
  }).then(r => r.json()).then(data => {
    if (data.status === "success") setBotProfile(data.data);
  }).catch(() => {});
 }, [musicBotState?.active]);

 const players = useMemo(() => {
 const list = lobby?.players?.map(p => ({
 id: p.userId,
 name: p.username || "Guest Player",
 avatar: p.role === "HOST" ? "👑" : "👤",
 avatarUrl: p.avatarUrl,
 level: p.level,
 membership: p.membership as MembershipType,
 vipMetadata: p.vipMetadata,
 bannerUrl: p.bannerUrl,
 badges: (p.user?.badges || p.badges || []).map((ub: any) => ({
 ...(ub.badge || ub),
 isPinned: ub.isPinned || false
 })) || [],
 rank: "Verified Gamer",
 isHost: p.role === "HOST",
 role: p.user?.role || p.role,
 isReady: !!p.isReady,
 hasMic: true,
 isMuted: p.userId === user?.id ? !!p.micMuted : (peerVolumes[p.userId] === 0 || !!p.micMuted),
 ping: peerPings[p.userId] || 25,
 isSpeaking: p.micMuted ? false : p.userId === user?.id 
 ? localVolume > 15 
 : (peerActivity[p.userId] || 0) > 15 || (lobby?.talkingUsers?.includes(p.userId) || false),
 volume: p.userId === user?.id 
 ? localVolume 
 : (peerVolumes[p.userId] !== undefined ? peerVolumes[p.userId] : 100),
 activity: p.userId === user?.id ? localVolume : (peerActivity[p.userId] || 0)
 })) || [];

 // INJECT LOXX MUSIC BOT IF ACTIVE
 if (musicBotState?.active && lobby?.id) {
  const botId = `music-bot-${lobby.id}`;
  const isBotSpeaking = lobby.talkingUsers?.includes(botId) || (peerActivity[botId] || 0) > 10;
  list.push({
   id: botId,
   name: "🎵 Loxx Music Bot",
   avatar: "🤖",
   avatarUrl: botProfile?.avatarUrl || "", // Displays neon badge
   level: 99,
   membership: "VIP" as any,
   vipMetadata: { borderNeonColor: "#00e5ff" },
   bannerUrl: botProfile?.bannerUrl || "",
   bio: botProfile?.bio,
   miniProfileBg: botProfile?.miniProfileBg,
   badges: [{ name: "Music Bot", image: "/badges/music_icon.png" }],
   rank: isRtl ? "رادیو دیسکی لابی" : "Lobby DJ System",
   isHost: false,
   role: "BOT",
   isReady: true,
   hasMic: true,
   isMuted: peerVolumes[botId] === 0,
   ping: 5,
   isSpeaking: isBotSpeaking,
   volume: peerVolumes[botId] !== undefined ? peerVolumes[botId] : 100,
   activity: peerActivity[botId] || 0
  } as any);
 }

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
 volume: 100,
 activity: 0
 });
 }
 return result;
 }, [lobby?.players, lobby?.maxPlayers, lobby?.id, localVolume, peerActivity, lobby?.talkingUsers, peerVolumes, user?.id, user?.username, musicBotState, isRtl]);

 const isReady = lobby?.players?.find(p => p.userId === user?.id)?.isReady || false;
 const isMicMuted = !!(lobby?.players?.find(p => p.userId === user?.id) as any)?.micMuted;
 const isHost = lobby?.hostId === user?.id;

  // Auto-open Loxx configuration modal on lobby join for host
  // Activate audio transmitter for Music Bot when active and you are the host
  const botId = `music-bot-${lobby?.id}`;
  const botVolumeLevel = peerVolumes[botId] !== undefined ? peerVolumes[botId] : 100;
  
  // --- High-Fidelity Sync & Media Server Broadcasting (Music Bot) ---
  const [audioElMounted, setAudioElMounted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // 1. Everyone plays the audio element locally for high-fidelity synchronized playback,
  // but only the host sets up the audio graph compressor to send via WebRTC.
  useEffect(() => {
    const audioEl = localMusicAudioRef.current;
    if (!audioEl) return;
    if (!audioElMounted) setAudioElMounted(true);

    // Audio Engine: Limiter / Compressor Setup (Host Only)
    if (isHost && !audioContextRef.current && (window.AudioContext || (window as any).webkitAudioContext)) {
      try {
        const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
        ac.resume().catch(() => {});
        audioContextRef.current = ac;
        const source = ac.createMediaElementSource(audioEl);
        
        const compressor = ac.createDynamicsCompressor();
        compressor.threshold.value = -12;
        compressor.knee.value = 10;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;

        const dest = ac.createMediaStreamDestination();
        
        source.connect(compressor);
        compressor.connect(dest);
        compressor.connect(ac.destination); // For local playback on host
        
        setBotStream(dest.stream);
      } catch (err) {
        console.error("AudioContext initialization failed", err);
      }
    }

    const handleTimeUpdate = () => {
      setLocalMusicCurrentTime(audioEl.currentTime);
    };
    const handleDurationChange = () => {
      const dur = audioEl.duration || 0;
      setLocalMusicDuration(dur);
      if (isHost && dur > 0) {
        controlMusicBot("seek", { duration: dur });
      }
    };

    audioEl.addEventListener("timeupdate", handleTimeUpdate);
    audioEl.addEventListener("durationchange", handleDurationChange);

    if (!musicBotState?.active || !musicBotState?.currentTrackUrl) {
      if (!audioEl.paused) audioEl.pause();
      return () => {
        audioEl.removeEventListener("timeupdate", handleTimeUpdate);
        audioEl.removeEventListener("durationchange", handleDurationChange);
      };
    }

    const rawUrl = musicBotState.currentTrackUrl;
    const fullUrl = rawUrl.startsWith("http") ? rawUrl : (rawUrl.startsWith("blob:") ? rawUrl : `${window.location.origin}${rawUrl}`);

    if (audioEl.src !== fullUrl) {
      audioEl.src = fullUrl;
      audioEl.load();
    }

    if (musicBotState.currentTime !== undefined && musicBotState.updatedAt) {
      const timeSinceUpdate = (Date.now() - musicBotState.updatedAt) / 1000;
      const targetTime = musicBotState.currentTime + (musicBotState.isPlaying ? timeSinceUpdate : 0);
      const drift = Math.abs(audioEl.currentTime - targetTime);
      if (drift > 2.0) {
        audioEl.currentTime = targetTime;
      }
    }

    if (musicBotState.isPlaying) {
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch(() => {});
      }
      if (audioEl.paused) {
        const playPromise = audioEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.warn("[LocalMusicBot] Playback prevented by Autoplay:", e));
        }
      }
    } else {
      if (!audioEl.paused) audioEl.pause();
    }

    const unlockPlay = () => {
      if (musicBotState?.isPlaying && audioEl.paused) {
        audioEl.play().catch(e => console.log("[LocalMusicBot] Autoplay restriction unlock failed:", e));
      }
    };
    document.addEventListener("click", unlockPlay, { once: true });
    document.addEventListener("touchstart", unlockPlay, { once: true });

    audioEl.onended = () => {
      if (isHost && musicBotState.queue && musicBotState.queue.length > 0) {
        const nextIndex = (musicBotState.queueIndex + 1) % musicBotState.queue.length;
        const nextTrack = musicBotState.queue[nextIndex];
        controlMusicBot("update-queue", {
          queue: musicBotState.queue,
          queueIndex: nextIndex,
          trackUrl: nextTrack.url,
          trackName: nextTrack.name,
          category: musicBotState.currentCategory,
          isPlaying: true,
          currentTime: 0
        });
      }
    };

    return () => {
      audioEl.removeEventListener("timeupdate", handleTimeUpdate);
      audioEl.removeEventListener("durationchange", handleDurationChange);
      document.removeEventListener("click", unlockPlay);
      document.removeEventListener("touchstart", unlockPlay);
      audioEl.onended = null;
    };
  }, [
    musicBotState?.active,
    musicBotState?.currentTrackUrl,
    musicBotState?.isPlaying,
    musicBotState?.queueIndex,
    musicBotState?.currentTime,
    musicBotState?.updatedAt,
    isHost
  ]);

  // 2. Peers: Simulate progress bar logic purely from WebRTC state packets
  useEffect(() => {
    if (isHost || !musicBotState?.active || musicBotState?.currentTime === undefined) return;
    
    // We update UI progress tracker 1x per second based on the server tracked timestamps
    const interval = setInterval(() => {
      const dur = musicBotState.duration || 0;
      setLocalMusicDuration(dur);
      if (musicBotState.isPlaying) {
        const timeSinceUpdate = (Date.now() - (musicBotState.updatedAt || Date.now())) / 1000;
        const calculatedTime = musicBotState.currentTime! + timeSinceUpdate;
        setLocalMusicCurrentTime(Math.min(calculatedTime, dur));
      } else {
        setLocalMusicCurrentTime(Math.min(musicBotState.currentTime!, dur));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isHost, musicBotState?.active, musicBotState?.isPlaying, musicBotState?.currentTime, musicBotState?.updatedAt, musicBotState?.duration]);

  // Synchronize duration on peer when it changes in state
  useEffect(() => {
    if (!isHost && musicBotState?.duration) {
      setLocalMusicDuration(musicBotState.duration);
    }
  }, [isHost, musicBotState?.duration]);

  // Resume host AudioContext on user gesture
  useEffect(() => {
    if (!isHost) return;
    const handleGesture = () => {
      const ac = audioContextRef.current;
      if (ac && ac.state === "suspended") {
        ac.resume().then(() => {
          console.log("[LocalMusicBot] Host AudioContext resumed successfully via gesture.");
        }).catch(err => {
          console.warn("[LocalMusicBot] Failed to resume host AudioContext:", err);
        });
      }
    };
    document.addEventListener("click", handleGesture);
    document.addEventListener("touchstart", handleGesture);
    return () => {
      document.removeEventListener("click", handleGesture);
      document.removeEventListener("touchstart", handleGesture);
    };
  }, [isHost]);

  const [isDucking, setIsDucking] = useState(false);
  
  // Separate non-blocking vocal ducking / volume adjustment effect to decouple from playback
  useEffect(() => {
    const audioEl = localMusicAudioRef.current;
    if (!audioEl) return;

    const hasHighPeerActivity = Object.entries(peerActivity).some(([uid, vol]) => {
      if (uid === botId) return false;
      const player = lobby?.players?.find((p: any) => p.userId === uid);
      if (!player) return false;
      if (player.micMuted) return false;
      return (vol as number) > 15;
    });
    const me = lobby?.players?.find((p: any) => p.userId === user?.id);
    const hasLocalActivity = !me?.micMuted && (localVolume || 0) > 15;
    
    const isSomeoneElseSpeaking = (lobby?.talkingUsers?.some((uid: string) => {
      if (uid === botId) return false;
      const player = lobby?.players?.find((p: any) => p.userId === uid);
      return player && !player.micMuted;
    }) || hasHighPeerActivity || hasLocalActivity || false);
    
    const duckingFactor = isSomeoneElseSpeaking ? (musicVolumeTalking !== undefined ? musicVolumeTalking : 30) : (musicVolumeSilence !== undefined ? musicVolumeSilence : 100);
    const calculatedVolume = Math.max(0, Math.min(1, (botVolumeLevel / 100) * (duckingFactor / 100)));

    setIsDucking(isSomeoneElseSpeaking);

    // Smooth transition over 300ms using linear-cubic interpolation
    if (hostVolumeFaderRef.current) cancelAnimationFrame(hostVolumeFaderRef.current);
    const start = hostCurrentVolumeRef.current;
    const duration = isSomeoneElseSpeaking ? 150 : 350; // Quicker ducking attack, gentler release (fade-in)
    const startTime = performance.now();

    const anim = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Cubic easing for premium feeling
      const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const current = start + (calculatedVolume - start) * ease;
      audioEl.volume = current;
      hostCurrentVolumeRef.current = current;
      if (progress < 1) {
        hostVolumeFaderRef.current = requestAnimationFrame(anim);
      }
    };
    hostVolumeFaderRef.current = requestAnimationFrame(anim);

    return () => {
      if (hostVolumeFaderRef.current) cancelAnimationFrame(hostVolumeFaderRef.current);
    };
  }, [
    botVolumeLevel,
    lobby?.talkingUsers,
    musicVolumeSilence,
    musicVolumeTalking,
    botId,
    peerActivity,
    localVolume,
    audioElMounted
  ]);

  // Separate non-blocking effect for absolute position syncing to eliminate lag cascade
  const hostPlayer = lobby?.players?.find((p: any) => p.userId === lobby?.hostId);
 const isStreamerLobby = (hostPlayer as any)?.role === "STREAMER";
 const isVipLobby = hostPlayer?.membership === "VIP" && !isStreamerLobby;
  
  // Auto-open Loxx configuration modal on lobby join for host

 
 const isStarting = lobby?.status === "STARTING";
 const isMatchStarted = lobby?.status === "IN_PROGRESS";
 
 // Calculate if all current active players are ready
 const activePlayersList = lobby?.players || [];
 const activePlayersCount = activePlayersList.length;
 const readyCountValue = activePlayersList.filter(p => p.isReady).length;
 // Use backend status if available, fallback to dynamic check
 const allReadyPulse = lobby?.status === "READY" || (activePlayersCount > 1 && readyCountValue === activePlayersCount);


 // Audio context and mic loop handled globally by LobbyProvider
 
 // Deleted redundant loop


 // Stream states and key shortcuts are handled globally by LobbyProvider

 const toggleMic = () => {
 if (lobby) {
 setLobbyMuted(!isMicMuted);
 }
 };

 const [inputMessage, setInputMessage] = useState("");

 const handleCopyCode = () => {
 navigator.clipboard.writeText(lobby?.id || "LX-LOBBY");
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };

 const handleSendMessage = (e: React.FormEvent) => {
 e.preventDefault();
 if (!inputMessage.trim() || !id) return;
 
 const words = inputMessage.split(/\s+/);
 if (words.some(word => word.length > 15)) {
 toast.error("یک کلمه نمیتواند بیشتر از 15 کاراکتر باشد (اسپم)");
 return;
 }

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
 setPeerVolume(id, vol);
 };

 const { friends } = useFriends();

 return (
 <div className={cn("flex bg-[#050508] overflow-hidden", isElectron ? "h-[calc(100vh-100px)] min-h-[calc(100vh-100px)] max-h-[calc(100vh-100px)]" : "h-[calc(100vh-64px)] min-h-[calc(100vh-64px)] max-h-[calc(100vh-64px)]")} dir={isRtl ? "rtl" : "ltr"}>
 <audio className="hidden" ref={localMusicAudioRef} crossOrigin="anonymous" />
 <Sidebar />
 <main className={cn(
 "flex-1 min-w-0 relative h-full max-h-full overflow-hidden transition-all duration-300", 
 isRtl 
 ? (!isSidebarCollapsed ? "md:mr-64" : "md:mr-20") 
 : (!isSidebarCollapsed ? "md:ml-64" : "md:ml-20")
 )}>
 <div className="h-full w-full bg-[#050508] text-white p-2 md:p-6 lg:p-8 flex flex-col gap-4 md:gap-6 relative overflow-hidden font-sans">
 {!user?.isVerified && (
 <div className="fixed top-20 left-4 right-4 z-[100] bg-neon-pink/20 backdrop-blur-md border border-neon-pink/30 rounded-2xl p-4 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <ShieldAlert size={20} className="text-neon-pink" />
 <p className="text-sm font-bold text-gray-200">
 {isRtl ? "حساب شما تایید نشده است. تا زمان تایید ایمیل، قادر به چت کردن نخواهید بود." : "Your account is not verified. You won't be able to chat until you verify your email."}
 </p>
 </div>
 <Link to="/settings" className="text-xs font-black text-neon-pink uppercase hover:underline">
 {isRtl ? "تایید حساب" : "VERIFY ACCOUNT"}
 </Link>
 </div>
 )}

 {/* LAN mode banners & assistance */}
 {lobby?.isLanMode && !isElectron && (
 <div className="relative z-10 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 animate-enter shrink-0">
 <div className={cn("flex items-center gap-3", isRtl ? "text-right" : "text-left")}>
 <ShieldAlert size={20} className="text-amber-400 shrink-0" />
 <div>
 <p className="text-sm font-black text-white">
 {isRtl ? "⚠️ جهت بازی در حالت Lan، استفاده از اپلیکیشن ویندوز لوکس الزامی است!" : "⚠️ Loxx Windows App is required to play in LAN mode!"}
 </p>
 <p className="text-xs text-gray-400 mt-0.5">
 {isRtl 
 ? "شما هم‌اکنون این لابی را روی مرورگر وب مشاهده می‌کنید. سیستم انتقال ترافیک خودکار Lan (بدون نیاز به برنامه جانبی) فقط روی اپلیکیشن کلاینت ویندوز فعال می‌شود." 
 : "You are currently viewing this lobby inside a web browser. The automatic LAN tunneling system (Zero-TUN) only works inside the official native Windows Client."}
 </p>
 </div>
 </div>
 <a href="/download" className="px-5 py-2 rounded-xl bg-amber-500 text-black text-xs font-black transition-all hover:bg-amber-400 shrink-0 font-sans">
 {isRtl ? "دانلود کلاینت ویندوز" : "Download Windows Client"}
 </a>
 </div>
 )}

 {lobby?.isLanMode && isElectron && (
 <div className="relative z-10 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between gap-3 animate-enter shrink-0">
 <div className={cn("flex items-center gap-3 font-sans", isRtl ? "text-right" : "text-left")}>
 <span className="relative flex h-2 w-2 shrink-0">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
 </span>
 <div>
 <p className="text-sm font-black text-white">
 {isRtl ? "⚡ سیستم پل ارتباطی لوکس (Zero-TUN) فعال است" : "⚡ LOXX Zero-TUN Gateway is Active"}
 </p>
 <p className="text-xs text-gray-400 mt-0.5">
 {isHost ? (
 isRtl 
 ? "به عنوان هاست لابی، بازی خود را در حالت LAN / Offline برای دیگران بسازید. لانچر لوکس به صورت خودکار پورت‌های شبکه بازی را برای کلاینت‌ها پروکسی کرده و پل می‌زند."
 : "As the lobby host, start your game in LAN / Offline mode. The Loxx Launcher will automatically bridge and proxy network ports for other players."
 ) : (
 isRtl 
 ? "به عنوان کلاینت لابی، به محض شروع، مستقیماً وارد بازی شده و به بخش Local LAN بروید. به لطف سیستم Zero-TUN لوکس، سرور هم‌تیمی‌تان خودکار نمایش داده می‌شود!"
 : "As a lobby client, simply launch your game and navigate to the Local LAN section. Thanks to LOXX Zero-TUN, your teammate's server will show up automatically!"
 )}
 </p>
 </div>
 </div>
 <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
 Zero-TUN Engine v1.1.0
 </span>
 </div>
 )}

 {/* Background Elements */}
 <div className="absolute inset-0 pointer-events-none overflow-hidden">
 <div className={cn(
 "absolute inset-0 bg-[length:60px_60px]",
 isStreamerLobby ? "bg-[linear-gradient(rgba(168,85,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.03)_1px,transparent_1px)]" :
 isVipLobby ? "bg-[linear-gradient(rgba(250,204,21,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(250,204,21,0.03)_1px,transparent_1px)]" 
 : "bg-[linear-gradient(rgba(0,229,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.03)_1px,transparent_1px)]"
 )} />
 <div className={cn(
 "absolute inset-0",
 isStreamerLobby ? "bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.1)_0%,transparent_50%)]" :
 isVipLobby ? "bg-[radial-gradient(circle_at_50%_0%,rgba(250,204,21,0.1)_0%,transparent_50%)]"
 : "bg-[radial-gradient(circle_at_50%_0%,rgba(0,229,255,0.1)_0%,transparent_50%)]"
 )} />
 <div className={cn(
 "absolute top-[20%] left-[10%] h-96 w-96 rounded-full blur-[120px]",
 isStreamerLobby ? "bg-neon-purple/5" :
 isVipLobby ? "bg-yellow-400/5" : "bg-neon-blue/5"
 )} />
 <div className={cn(
 "absolute bottom-[20%] right-[10%] h-96 w-96 rounded-full blur-[120px]",
 isStreamerLobby ? "bg-purple-600/5" :
 isVipLobby ? "bg-yellow-600/5" : "bg-neon-pink/5"
 )} />
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
 className={cn("absolute inset-0 rounded-full blur-3xl", isStreamerLobby ? "bg-neon-purple" : isVipLobby ? "bg-yellow-400" : "bg-neon-blue")} 
 />
 <h2 className={cn("text-5xl md:text-7xl font-black text-white uppercase text-center relative z-10 px-10", isStreamerLobby ? "drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]" : isVipLobby ? "drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" : "drop-shadow-[0_0_20px_rgba(0,229,255,0.8)]")}>
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
 
 <div className={cn(
 "h-10 w-10 md:h-14 md:w-14 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border",
 isStreamerLobby ? "bg-[#0a0a0f] border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]" :
 isVipLobby ? "bg-[#0d0d12] border-yellow-400/30 shadow-[0_0_15px_rgba(250,204,21,0.2)]" : "bg-white/5 border-white/10"
 )}>
 {lobby?.game?.iconUrl ? (
 <SmartImage src={lobby.game.iconUrl} className="w-full h-full object-contain" />
 ) : <Gamepad2 className={isStreamerLobby ? "text-purple-400" : isVipLobby ? "text-yellow-400" : "text-neon-blue"} size={24} />}
 </div>
 
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2 md:gap-3 mb-0.5 md:mb-1">
 {lobby?.isLanMode && (
 <div className="mb-1 md:mb-2 self-start px-2 py-0.5 rounded-full border border-emerald-500/50 bg-emerald-500/20 text-emerald-300 text-[8px] md:text-[10px] font-black uppercase flex items-center gap-1 font-sans">
 <span className="relative flex h-1.5 w-1.5 font-sans">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
 </span>
 <span>LAN Zero-TUN v1.1.0</span>
 </div>
 )}
 <h1 className="text-sm md:text-3xl font-black text-white truncate max-w-[150px] md:max-w-none">
 {lobby ? (lobby.title || "Elite Lobby") : "در حال بارگذاری..."}
 </h1>
 <div className={cn(
 "px-1.5 md:px-3 py-0.5 md:py-1 rounded-full border text-[7px] md:text-[10px] font-black uppercase shrink-0",
 isStreamerLobby ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
 isVipLobby ? "bg-yellow-400/10 border-yellow-400/20 text-yellow-400" : "bg-neon-blue/10 border-neon-blue/20 text-neon-blue"
 )}>
 ME
 </div>
 </div>
 <div className="flex items-center gap-3 md:gap-5 text-[9px] md:text-[11px] text-gray-500 font-black uppercase ">
 <span className="flex items-center gap-1 md:gap-1.5 font-bold"><Users size={12} className={cn("shrink-0 md:size-[14px]", isStreamerLobby ? "text-purple-400" : isVipLobby ? "text-yellow-400" : "text-neon-blue")} /> {players.filter(p => !p.id.startsWith("slot-")).length} / {lobby?.maxPlayers || 5}</span>
 {isStreamerLobby ? (
 <span className="flex items-center gap-1 md:gap-1.5"><Radio size={14} className="text-purple-400 shrink-0 w-3 h-3 md:w-3.5 md:h-3.5 animate-pulse" /> Streamer Room</span>
 ) : isVipLobby ? (
 <span className="flex items-center gap-1 md:gap-1.5"><Crown size={14} className="text-yellow-400 shrink-0 w-3 h-3 md:w-3.5 md:h-3.5" /> Elite Room</span>
 ) : (
 <span className="flex items-center gap-1 md:gap-1.5"><Trophy size={14} className="text-neon-pink shrink-0 w-3 h-3 md:w-3.5 md:h-3.5" /> حرفه‌ای</span>
 )}
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2 md:gap-4 shrink-0">
 {isElectron && (
 <button 
 onClick={toggleLayout}
 className="p-2 md:p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors h-10 md:h-14 flex items-center justify-center border border-white/10"
 title="تغییر چینش لابی"
 >
 <LayoutTemplate size={20} />
 </button>
 )}

 {!isAudioContextResumed && (
 <button 
 onClick={resumeAudio}
 className="p-2 md:p-3 rounded-xl bg-neon-pink/20 text-neon-pink border border-neon-pink/30 animate-pulse flex items-center gap-2 text-[10px] md:text-xs font-black uppercase"
 >
 <Mic size={14} className="md:size-18" />
 <span>فعال‌سازی صدا</span>
 </button>
 )}

 <div className="hidden sm:flex items-center gap-2 bg-black/60 rounded-2xl p-1 border border-white/10">
 <div className="px-4 py-2 text-[10px] font-black text-gray-500 border-l border-white/10 uppercase ">کد لابی</div>
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
 "px-4 md:px-10 h-10 md:h-14 text-[10px] md:text-sm shadow-xl shrink-0 uppercase font-black",
 (!allReadyPulse || isMatchStarted) && "opacity-50 grayscale cursor-not-allowed"
 )}
 >
 <Play size={14} className={isRtl ? "ml-1.5 md:ml-2" : "mr-1.5 md:mr-2"} />
 {isRtl ? "شروع" : "START"}
 </GlowButton>
 </div>
 </motion.header>

 <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 relative z-10 overflow-hidden">
 {/* Main Content Area */}
 <div className="flex-1 flex flex-col gap-4 md:gap-6 overflow-y-auto overflow-x-hidden custom-scrollbar pb-24 md:pb-8 px-1 md:px-4">
 
 {/* Remote Audio Streams handled globally */}

 {/* Top Status Panel */}
 <MatchInfoPanel 
 isStarting={isStarting} 
 isMatchStarted={isMatchStarted} 
 countdown={countdown} 
 players={players} 
 lobby={lobby}
 onCancel={handleCancelMatch}
 onReopen={handleReopenLobby}
 isVipLobby={isVipLobby}
 isStreamerLobby={isStreamerLobby}
 />

 {/* Screen Share View (Local or Remote) */}
 {(screenStream || activeRemoteShare) && (
 <ScreenSharePresenter 
 stream={screenStream || activeRemoteShare!.stream}
 presenterName={screenStream ? "شما" : activeRemoteShare!.presenterName}
 isLocal={!!screenStream}
 isWarningActive={screenStream ? isWarningActive : false}
 />
 )}

 {/* Players Flex - Drastically improved for responsiveness & wrapping */}
 <div className={cn(
 "w-full justify-start items-stretch px-1",
 layoutMode === 'discord' ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4" : 
 layoutMode === 'compact' ? "flex flex-wrap gap-2 md:gap-3" 
 : "flex flex-wrap gap-3 md:gap-6"
 )}>
 <AnimatePresence mode="popLayout">
 {players.map((player) => (
 <PlayerCard 
 key={player.id} 
 player={player}
 volume={player.volume}
 isVipLobby={isVipLobby}
 isStreamerLobby={isStreamerLobby}
 layoutMode={layoutMode}
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
 onProfile={(id) => {
 const p = players.find(player => player.id === id);
 if (p && !p.id.startsWith("slot-")) {
 openProfile({
 senderName: p.name,
 senderAvatar: p.avatarUrl || p.avatar,
 senderLevel: p.level || 1,
 id: p.id,
 membership: p.membership || MembershipType.NONE,
 vipMetadata: p.vipMetadata,
 bannerUrl: p.bannerUrl || p.avatarUrl,
 bio: p.bio,
 miniProfileBg: p.miniProfileBg
 }, p.id === user?.id);
 }
 }}
 onDirectMessage={(id) => {
 const p = players.find(player => player.id === id);
 if (p && !p.id.startsWith("slot-")) {
 openChat(id, p.name, p.avatarUrl || p.avatar);
 }
 }}
 onAddFriend={(id) => {
 const p = players.find(player => player.id === id);
 if (p && !p.id.startsWith("slot-")) {
 addFriend(p.name);
 }
 }}
 onKick={kickPlayer}
 onBan={banPlayer}
 isHostView={isHost}
 />
 ))}
 </AnimatePresence>
 </div>
 </div>

 {/* Desktop Chat Sidebar (Right) */}
 {!isElectron || isDesktopChatOpen ? (
 <div className={cn("hidden lg:flex flex-col overflow-hidden shadow-2xl", isElectron ? "absolute bottom-6 right-6 z-40 bg-black/80 backdrop-blur-3xl w-[340px] h-[450px] rounded-[24px] border border-white/10" : "w-full lg:w-[280px] xl:w-[320px] h-full order-first")}>
 <ChatPanel 
 messages={messages} 
 players={players}
 inputMessage={inputMessage} 
 setInputMessage={setInputMessage} 
 onSend={handleSendMessage}
 currentUserId={user?.id}
 isVipLobby={isVipLobby}
 onClose={isElectron ? () => setIsDesktopChatOpen(false) : undefined}
 />
 </div>
 ) : (
 isElectron && (
 <motion.div 
 initial={{ y: 50, opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 className="hidden lg:flex absolute bottom-6 right-6 z-40 flex-col border border-white/10 bg-black/60 backdrop-blur-lg rounded-[24px] overflow-hidden shadow-2xl cursor-pointer hover:bg-black/80 w-[300px] hover:border-neon-blue/30 transition-colors duration-300"
 onClick={() => setIsDesktopChatOpen(true)}
 >
 <div className="flex items-center justify-between p-4">
 <div className="flex flex-col">
 <div className="flex items-center gap-2">
 <div className="h-2 w-2 rounded-full bg-neon-blue animate-pulse" />
 <h2 className="text-xs font-black uppercase text-white">Lobby Comms</h2>
 </div>
 {unreadDesktopChat > 0 && <span className="text-[10px] text-neon-blue mt-1 font-bold">{unreadDesktopChat} پیام جدید</span>}
 </div>
 <MessageSquare size={18} className="text-gray-400" />
 </div>
 </motion.div>
 )
 )}
 </div>

 {/* Mobile Chat Trigger & Bottom Actions - Fixed and Styled */}
 <div className="lg:hidden fixed bottom-20 left-4 right-4 z-50 p-3 glass rounded-[28px] border border-white/10 flex items-center justify-between gap-3 shadow-2xl overflow-hidden pb-[calc(1rem+env(safe-area-inset-bottom))]">
 <div className="flex items-center gap-2 shrink-0">
 <button 
 onClick={() => {
 leaveLobby();
 navigate("/lobbies");
 }}
 className="h-12 w-12 rounded-[14px] bg-neon-pink/10 text-neon-pink flex items-center justify-center border border-neon-pink/20"
 title="خروج"
 >
 <LogOut size={20} />
 </button>
 <button 
 onClick={() => setIsChatOpen(true)}
 className="h-12 w-12 rounded-[14px] bg-white/5 flex items-center justify-center text-neon-blue relative border border-white/10"
 >
 <MessageSquare size={20} />
 <div className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-neon-pink" />
 </button>
 </div>

 <div className="flex items-center gap-2 overflow-x-auto scrollbar-none px-1 py-1">
 <ControlButton icon={isMicMuted ? <MicOff size={20} /> : <Mic size={20} />} active={!isMicMuted} onClick={toggleMic} className="h-12 w-12 rounded-[14px] shrink-0" />
 {typeof window !== "undefined" && !!(window as any).electronAPI && (
 <button 
 onClick={() => {
 if (screenStream) { stopShare(); }
 else if (isBaseRequirementMet) { initiateScreenShareFlow(); }
 }}
 className={cn(
 "h-12 w-12 rounded-[14px] flex items-center justify-center transition-all group shrink-0 relative",
 screenStream ? "bg-neon-blue/20 text-neon-blue border-neon-blue shadow-[0_0_15px_rgba(0,240,255,0.4)] border shadow-inner" :
 (isBaseRequirementMet ? "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white" : "bg-white/5 text-gray-700 opacity-50 cursor-not-allowed")
 )}
 title={!isBaseRequirementMet ? "سرعت اینترنت شما برای این کار کافی نیست" : screenStream ? "پایان شیر اسکرین" : "اشتراک صفحه نمایش"}
 >
 {screenStream ? <MonitorUp size={20} /> : <Monitor size={20} />}
 {!isBaseRequirementMet && <AlertTriangle size={10} className="absolute top-2 right-2 text-yellow-500" />}
 </button>
 )}
 <ControlButton icon={<UserPlus size={20} />} onClick={() => setIsInviteModalOpen(true)} className="h-12 w-12 rounded-[14px] shrink-0" />
 <ControlButton icon={<Settings size={20} />} onClick={() => setIsSettingsModalOpen(true)} className="h-12 w-12 rounded-[14px] shrink-0" />
 </div>

 <GlowButton 
 variant={isReady ? "blue" : "pink"} 
 onClick={onToggleReady}
 disabled={isMatchStarted || isStarting}
 className={cn(
 "h-12 px-4 min-w-[85px] text-[12px] uppercase font-black rounded-[14px] shrink-0",
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
 className="fixed inset-0 bg-black/80 z-[6000] lg:hidden"
 />
 <motion.div 
 initial={{ y: "100%" }}
 animate={{ y: 0 }}
 exit={{ y: "100%" }}
 transition={{ type: "spring", damping: 25, stiffness: 200 }}
 className="fixed bottom-0 left-0 right-0 h-[80dvh] bg-[#0a0a0f] rounded-t-[40px] z-[6005] lg:hidden border-t border-white/10 overflow-hidden flex flex-col"
 >
 <div className="h-1.5 w-12 bg-white/10 rounded-full mx-auto mt-4 mb-2 shrink-0" />
 <div className="flex-1 overflow-hidden flex flex-col">
 <ChatPanel 
 currentUserId={user?.id}
 messages={messages} 
 players={players}
 inputMessage={inputMessage} 
 setInputMessage={setInputMessage} 
 onSend={handleSendMessage} 
 onClose={() => setIsChatOpen(false)}
 isVipLobby={isVipLobby}
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
 {isReady ? <Check size={18} className={isRtl ? "ml-2" : "mr-2"} /> : null}
 {isReady ? (isRtl ? "آماده" : "READY") : (isRtl ? "اعلام آمادگی" : "READY UP")}
 </GlowButton>
 </div>
 
 <div className="flex items-center gap-4">
 <ControlButton icon={isMicMuted ? <MicOff size={20} /> : <Mic size={20} />} active={!isMicMuted} onClick={toggleMic} tooltip={isRtl ? "میکروفون" : "Microphone"} />
 <ControlButton icon={isDeafened ? <VolumeX size={20} /> : <Volume2 size={20} />} active={!isDeafened} onClick={() => setIsDeafened(!isDeafened)} tooltip={isRtl ? "قطع صدای اسپیکر" : "Deafen Speakers"} />
 {typeof window !== "undefined" && !!(window as any).electronAPI && (
 <button 
 onClick={() => {
 if (screenStream) { stopShare(); }
 else if (isBaseRequirementMet) { initiateScreenShareFlow(); }
 }}
 className={cn(
 "h-12 w-12 rounded-2xl flex items-center justify-center transition-all group relative shrink-0",
 screenStream ? "bg-neon-blue/20 text-neon-blue border-neon-blue shadow-[0_0_15px_rgba(0,240,255,0.4)] border shadow-inner" :
 (isBaseRequirementMet ? "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white" : "bg-white/5 text-gray-700 opacity-50 cursor-not-allowed")
 )}
 title={!isBaseRequirementMet ? (isRtl ? "سرعت اینترنت شما برای اشتراک گذاری با این تعداد بیننده کافی نیست" : "Your upload speed is not sufficient for screensharing with this many viewers") : screenStream ? (isRtl ? "پایان شیر اسکرین" : "End Screen Share") : (isRtl ? "اشتراک صفحه نمایش" : "Share Screen")}
 >
 {screenStream ? <MonitorUp size={20} /> : <Monitor size={20} />}
 {!isBaseRequirementMet && <AlertTriangle size={10} className="absolute top-2 right-2 text-yellow-500" />}
 </button>
 )}
 <ControlButton icon={<UserPlus size={20} />} onClick={() => setIsInviteModalOpen(true)} tooltip={isRtl ? "دعوت" : "Invite"} />
 <ControlButton icon={<Settings size={20} />} onClick={() => setIsSettingsModalOpen(true)} tooltip={isRtl ? "تنظیمات" : "Settings"} />
 </div>
 </div>

 <button 
 onClick={() => {
 leaveLobby();
 navigate("/lobbies");
 }}
 className="flex items-center gap-2 px-8 py-3 rounded-2xl text-xs font-black uppercase text-neon-pink hover:bg-neon-pink/10 transition-all border border-transparent hover:border-neon-pink/20"
 >
 <LogOut size={18} className={isRtl ? "ml-2" : "mr-2"} />
 {isRtl ? "خروج از لابی" : "LEAVE LOBBY"}
 </button>
 </motion.footer>

 {/* MODALS */}
 <AnimatePresence>
 {isInviteModalOpen && (
 <Modal title={isRtl ? "دعوت دوستان" : "Invite Friends"} onClose={() => setIsInviteModalOpen(false)}>
 <div className="space-y-4">
  {/* Music Bot Invite Card (At the absolute top of the friends list) */}
  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-950/40 to-black/40 rounded-2xl border border-[#00e5ff]/20 hover:border-[#00e5ff]/40 transition-all shadow-[0_0_15px_rgba(0,229,255,0.05)] group relative overflow-hidden">
   {/* Animated background element */}
   {musicBotState?.active && (
    <div className="absolute inset-y-0 right-0 w-1.5 bg-[#00e5ff] animate-pulse" />
   )}
   <div className="flex items-center gap-3 w-full max-w-[70%] text-right">
    <div className="h-10 w-10 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.2)] shrink-0 overflow-hidden relative font-sans">
     {musicBotState?.currentTrackCover ? (
      <img src={musicBotState.currentTrackCover} className={cn("w-full h-full object-cover", musicBotState?.isPlaying && "animate-[spin_4s_linear_infinite] rounded-full")} />
     ) : (
      <span className={cn("text-xl select-none", musicBotState?.isPlaying && "animate-spin")} style={{ animationDuration: "3s" }}>💿</span>
     )}
     {musicBotState?.active && (
      <span className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-emerald-450 rounded-full border border-black" />
     )}
    </div>
    <div className="min-w-0 flex-1">
     <div className="flex items-center gap-1.5">
      <p className="text-xs font-black text-white truncate">{isRtl ? "🎵 ربات موسیقی لوکس (بات بالایی)" : "🎵 Loxx Music Bot (Top bot)"}</p>
      <span className="text-[8px] font-bold bg-[#00e5ff]/10 text-[#00e5ff] px-1 rounded border border-[#00e5ff]/20 shrink-0">BOT</span>
     </div>
     <p className="text-[9px] text-gray-400 mt-0.5 truncate">
      {musicBotState?.active 
       ? (isRtl ? `در حال پخش: ${musicBotState.currentTrackName || "در انتظار آهنگ..."}` : `Playing: ${musicBotState.currentTrackName || "Waiting for track..."}`)
       : (isRtl ? "کیفیت پخش Hi-Fi مستقیم در لابی" : "Hi-Fi audio stream directly in the lobby")
      }
     </p>
    </div>
   </div>
   <button 
    onClick={() => {
     if (!isHost) {
      toast.error(isRtl ? "فقط سازنده لابی می‌تواند ربات را مدیریت کند" : "Only the lobby host can manage the music bot");
      return;
     }
     const willBeActive = !musicBotState?.active;
     toggleMusicBot(willBeActive);
     if (willBeActive) {
       setIsInviteModalOpen(false);
       setShowBotSetupModal(true);
     }
    }}
    className={cn(
     "px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-300 transform active:scale-95 shrink-0 font-sans",
     musicBotState?.active 
      ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-black hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]" 
      : "bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-[0_0_12px_rgba(0,229,255,0.25)] hover:brightness-110"
    )}
   >
    {musicBotState?.active 
     ? (isRtl ? "اخراج ربات" : "Remove Bot") 
     : (isRtl ? "دعوت ربات" : "Invite Bot")
    }
   </button>
  </div>

  {friends.length > 0 ? friends.map((friend, i) => (
 <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
 <div className="flex items-center gap-3">
 <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
 <SmartImage 
 src={friend.avatarUrl || ""}
 className="w-full h-full object-cover"
 alt={friend.username}
 />
 </div>
 <div>
 <p className="text-sm font-black text-white">{friend.username}</p>
 <p className="text-[10px] text-gray-500 uppercase">{friend.status} • {friend.activity}</p>
 </div>
 </div>
 <button 
 onClick={() => {
 lobbySocket.emit("invite_player", { lobbyId: lobby?.id, targetUserId: friend.id });
 toast.success(isRtl ? `دعوت برای ${friend.username} ارسال شد` : `Invitation sent to ${friend.username}`);
 }}
 className="px-4 py-2 rounded-xl bg-neon-blue text-dark-bg text-[10px] font-black uppercase hover:scale-105 transition-transform"
 >
 Invite
 </button>
 </div>
 )) : (
 <div className="text-center py-10 opacity-50">
 <p className="text-sm">{isRtl ? "لیست دوستان خالی است" : "Your friends list is empty"}</p>
 </div>
 )}
 </div>
 </Modal>
 )}

 <ScreenShareModal
 isOpen={isScreenShareModalOpen}
 onClose={() => { setIsScreenShareModalOpen(false); setPendingSourceId(null); }}
 userPlan={userPlanResolved}
 onStartShare={handleQualitySelected}
 estimatedUploadMbps={estimatedUploadMbps}
 numViewers={players.length || 1}
 />

 <DesktopSourcePickerModal
 isOpen={isSourcePickerOpen}
 onClose={() => { setIsSourcePickerOpen(false); setPendingSourceId(null); }}
 onSelect={handleSourceSelected}
 />

 {/* LOXX FLOATING MUSIC PLAYER */}
  {musicBotState?.active && (
   <AnimatePresence mode="wait">
    {!isMusicPlayerExpanded ? (
     <motion.div
      key="minimized-bubble" layoutId="loxx-music-player-container"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      drag
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={{ 
       top: -(windowDims.height - 96 - 64), 
       bottom: 96,
       left: isRtl ? -24 : -(windowDims.width - 24 - 64),
       right: isRtl ? (windowDims.width - 24 - 64) : 24
      }}
      whileDrag={{ scale: 1.1, cursor: "grabbing" }}
      className={cn(
       "fixed bottom-24 z-[70] cursor-grab active:cursor-grabbing h-16 w-16 rounded-full bg-black/90 border-2 border-[#00e5ff] shadow-[0_0_25px_rgba(0,229,255,0.45)] hover:shadow-[0_0_35px_rgba(0,229,255,0.7)] flex flex-col items-center justify-center select-none",
       isRtl ? "left-6" : "right-6"
      )}
      title={isRtl ? "پخش‌کننده موسیقی (برای بزرگ کردن دوبار کلیک کنید یا کلیک کنید)" : "Music Player (Click to expand)"}
      onClick={() => setIsMusicPlayerExpanded(true)}
     >
      <div className="absolute inset-0 rounded-full bg-[#00e5ff]/5 animate-pulse" />
      {musicBotState?.currentTrackCover ? (
       <img src={musicBotState.currentTrackCover} className={cn("w-full h-full object-cover rounded-full", musicBotState?.isPlaying && "animate-[spin_6s_linear_infinite]")} />
      ) : (
       <span className={cn("text-3xl select-none", musicBotState?.isPlaying && "animate-[spin_5s_linear_infinite]")}>
        💿
       </span>
      )}
      {/* Tiny playback active indicator */}
      {musicBotState?.isPlaying && (
       <div className="absolute -bottom-1 flex gap-0.5 justify-center">
        <span className="w-1.5 h-3.5 bg-[#00e5ff] rounded animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-4.5 bg-[#00e5ff] rounded animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-2.5 bg-[#00e5ff] rounded animate-bounce" style={{ animationDelay: "300ms" }} />
       </div>
      )}
     </motion.div>
    ) : (
     <motion.div
      key="expanded-player" layoutId="loxx-music-player-container"
      initial={{ y: 25, opacity: 0, scale: 0.93 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 25, opacity: 0, scale: 0.93 }}
      transition={{ type: "spring", stiffness: 300, damping: 23 }}
      drag
      dragMomentum={false}
      dragElastic={0.05}
      dragConstraints={{ 
       top: -(windowDims.height - 96 - 450), 
       bottom: 96,
       left: isRtl ? -24 : -(windowDims.width - 24 - 360),
       right: isRtl ? (windowDims.width - 24 - 360) : 24
      }}
      className={cn(
       "fixed bottom-24 z-[70] w-[360px] bg-white/5 backdrop-blur-[16px] border border-white/10 rounded-[32px] shadow-[0_30px_60px_rgba(0,0,0,0.5),0_0_30px_rgba(0,229,255,0.1),inset_0_1px_15px_rgba(255,255,255,0.1)] p-5 text-white select-none hover:border-white/20 transition-[border-color] duration-500",
       isRtl ? "left-6" : "right-6"
      )}
     >
      {/* Textured Drag Handle Bar */}
      <div className="flex justify-center -mt-1 pb-4 cursor-grab active:cursor-grabbing text-gray-500/40 hover:text-cyan-400/70 select-none transition-colors duration-300">
       <div className="flex gap-1.5 items-center">
        <span className="w-1 h-1 rounded-full bg-current" />
        <span className="w-2 h-1.5 rounded-sm bg-cyan-400/40 animate-pulse" />
        <span className="w-1 h-1 rounded-full bg-current" />
       </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-2">
       <div className="flex items-center gap-1">
        {/* Disconnect button */}
        <button 
         onClick={() => toggleMusicBot(false)}
         className="hover:bg-[#00e5ff]/20 rounded-full text-[#00e5ff] p-1.5 transition-all outline-none"
         title={isRtl ? "خروج ربات از لابی" : "Disconnect Bot"}
        >
         <X size={22} strokeWidth={2.5} />
        </button>
        {/* Minimize button */}
        <button 
         onClick={() => setIsMusicPlayerExpanded(false)}
         className="hover:bg-[#00e5ff]/20 rounded-full text-[#00e5ff] p-1.5 transition-all outline-none"
         title={isRtl ? "کوچک کردن" : "Minimize"}
        >
         <Minus size={24} strokeWidth={2.5} />
        </button>
        {/* Setup button */}
        {isHost && (
         <button 
          onClick={() => {
           setSetupStep("source");
           setShowBotSetupModal(true);
          }}
          className="hover:bg-[#00e5ff]/20 rounded-full text-[#00e5ff] p-1.5 transition-all outline-none ml-1"
          title={isRtl ? "تغییر پوشه / منبع" : "Setup Source"}
         >
          <Settings size={20} strokeWidth={2.5} />
         </button>
        )}
       </div>

       <div className="flex flex-col text-right mr-1">
        <span className="text-[17px] font-black tracking-wider text-white select-none whitespace-nowrap drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
         {isRtl ? "ربات موزیک لوکس" : "Loxx Music Bot"}
        </span>
        <span className="text-[10px] text-[#00e5ff] font-mono leading-none select-none uppercase tracking-widest mt-1.5 font-bold drop-shadow-[0_0_5px_rgba(0,229,255,0.6)]">
         LIVE AUDIO CHUNK STREAM
        </span>
       </div>
       <div className="text-[#00e5ff] ml-2 shrink-0 drop-shadow-[0_0_12px_rgba(0,229,255,0.8)] filter">
        <Music size={30} strokeWidth={2} />
       </div>
      </div>

      {/* Now Playing Info & Cover */}
      <div className="flex items-center justify-between pb-6 relative px-1">
       {/* Track metadata */}
       <div className="flex-1 min-w-0 pr-4 z-10 text-right">
        <div className="flex items-center justify-end gap-1.5 mb-2 text-yellow-400 font-black text-xs uppercase tracking-wider font-sans">
         <span className="truncate">{musicBotState?.currentCategory || (isRtl ? "گالری لوکس" : "Loxx Gallery")}</span>
         <span className="text-sm">📁</span>
        </div>
        <p className="text-sm font-black text-gray-100 truncate font-sans tracking-wide leading-relaxed" dir="ltr" style={{ textAlign: isRtl ? 'right' : 'left' }}>
         {musicBotState?.currentTrackName || (isRtl ? "آهنگی وجود ندارد" : "Playlist ended")}
        </p>
       </div>

       {/* Spinning Disk Vinyl with glow */}
       <div className="relative h-[100px] w-[100px] rounded-full flex items-center justify-center shrink-0 z-10">
        <div className="absolute inset-[-15px] rounded-full shadow-[0_0_40px_rgba(0,229,255,0.2)] blur-sm"></div>
        <div className="absolute inset-0 rounded-full border-[1.5px] border-[#00e5ff]/30 shadow-[inset_0_0_20px_rgba(0,229,255,0.2)]"></div>
        <div className={cn("relative h-[90%] w-[90%] rounded-full border-[6px] border-[#0a0a0a] shadow-[inset_0_0_15px_#000] bg-[#111] overflow-hidden flex items-center justify-center", musicBotState?.isPlaying && "animate-[spin_4s_linear_infinite]")}>
         {musicBotState?.currentTrackCover ? (
          <img src={musicBotState.currentTrackCover} className="w-full h-full object-cover opacity-80" />
         ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#111] to-[#333] flex items-center justify-center rounded-full">
           <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-700 to-black border border-gray-600 flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.3)]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] shadow-[0_0_5px_#00e5ff]"></div>
           </div>
          </div>
         )}
         {/* Vinyl groove overlays */}
         <div className="absolute inset-0 rounded-full border border-white/5 mx-1" />
         <div className="absolute inset-0 rounded-full border border-white/5 mx-3" />
         <div className="absolute inset-0 rounded-full border border-white/5 mx-5" />
        </div>
       </div>
      </div>

      {/* Equalizer Waveform Visualizer */}
      <div className="relative h-14 w-full flex items-end justify-center gap-[2.5px] mt-2 mb-4 px-3">
       {Array.from({ length: 55 }).map((_, i) => (
        <div 
         key={i} 
         className={cn("w-1 rounded-sm", musicBotState?.isPlaying ? "bg-gradient-to-t from-[#00bfff] to-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.8)] animate-pulse" : "bg-[#00e5ff]/20")} 
         style={{ 
          height: musicBotState?.isPlaying ? `${Math.max(10, Math.random() * 100)}%` : "10%",
          animationDuration: `${0.2 + Math.random() * 0.4}s`,
          animationDelay: `${Math.random() * 0.3}s`
         }} 
        />
       ))}
      </div>

      {/* Dynamic Seek Progress Slider Bar */}
      <div className="flex flex-col gap-2 mb-6 font-sans relative px-2">
       {isDucking && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-1">
         <span>کاهش ولوم هوشمند</span>
         <Volume2 size={12} />
        </div>
       )}
       <div className="flex justify-between items-center text-[11px] text-gray-400 font-mono font-bold select-none px-1">
        <span>{Math.floor(localMusicCurrentTime / 60)}:{String(Math.floor(localMusicCurrentTime % 60)).padStart(2, '0')}</span>
        <span>{localMusicDuration ? `${Math.floor(localMusicDuration / 60)}:${String(Math.floor(localMusicDuration % 60)).padStart(2, '0')}` : "0:00"}</span>
       </div>
       <div className="relative group/seeker">
        <input 
         type="range"
         min={0}
         max={localMusicDuration || 1}
         value={localMusicCurrentTime}
         disabled={!isHost}
         onChange={(e) => {
          const val = parseFloat(e.target.value);
          setLocalMusicCurrentTime(val);
          if (localMusicAudioRef.current) {
           localMusicAudioRef.current.currentTime = val;
          }
         }}
         onMouseUp={() => {
          if (isHost && localMusicAudioRef.current) {
           controlMusicBot("seek", { currentTime: localMusicAudioRef.current.currentTime });
          }
         }}
         onTouchEnd={() => {
          if (isHost && localMusicAudioRef.current) {
           controlMusicBot("seek", { currentTime: localMusicAudioRef.current.currentTime });
          }
         }}
         className={cn(
          "w-full h-1.5 bg-white/10 hover:bg-white/20 rounded-full appearance-none cursor-pointer accent-[#00e5ff] transition-all outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#00e5ff] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(0,229,255,0.9)] hover:[&::-webkit-slider-thumb]:scale-125 transition-transform",
          !isHost && "cursor-not-allowed opacity-60",
          isDucking && "opacity-60"
         )}
         title={isHost ? (isRtl ? "تغییر زمان پخش" : "Seek track") : (isRtl ? "فقط سازنده لابی می‌تواند جلو عقب کند" : "Host only can seek")}
        />
       </div>
      </div>

      {/* Player controls */}
      <div className="flex items-center justify-center gap-6 mb-8 select-none font-sans px-2" dir="ltr">
       <button 
        onClick={() => {
         if (isHost && musicBotState?.queue && musicBotState.queue.length > 0) {
          const prevIdx = (musicBotState.queueIndex - 1 + musicBotState.queue.length) % musicBotState.queue.length;
          const prevTrack = musicBotState.queue[prevIdx];
          controlMusicBot("update-queue", {
           queue: musicBotState.queue,
           queueIndex: prevIdx,
           trackUrl: prevTrack.url,
           trackName: prevTrack.name,
           category: musicBotState.currentCategory,
           isPlaying: true,
           currentTime: 0
          });
         }
        }}
        className={cn(
         "p-2 flex items-center justify-center rounded-full text-[#81cad6] hover:text-[#00e5ff] hover:bg-[#00e5ff]/10 active:scale-90 transition-all",
         (!isHost || !musicBotState?.queue || musicBotState.queue.length <= 1) && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-[#81cad6]"
        )}
        disabled={!isHost || !musicBotState?.queue || musicBotState.queue.length <= 1}
       >
        <SkipBack size={26} fill="currentColor" strokeWidth={1.5} className="drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]" />
       </button>

       <button 
        onClick={() => {
         if (!isHost) return;
         if (musicBotState?.isPlaying) {
          controlMusicBot("pause", { currentTime: localMusicAudioRef.current?.currentTime || 0 });
         } else {
          if (musicBotState?.queue && musicBotState.queue.length > 0) {
           controlMusicBot("play", { currentTime: localMusicAudioRef.current?.currentTime || 0 });
          } else {
           setShowBotSetupModal(true);
          }
         }
        }}
        className={cn(
         "w-[66px] h-[66px] flex items-center justify-center rounded-full active:scale-95 transition-all outline-none",
         isHost ? "bg-gradient-to-br from-[#0c4a60] to-[#042431]/80 border-[1.5px] border-[#00e5ff]/50 text-[#00e5ff] shadow-[0_0_35px_rgba(0,229,255,0.45),inset_0_0_20px_rgba(0,229,255,0.2)] hover:shadow-[0_0_45px_rgba(0,229,255,0.6)] hover:brightness-110" : "bg-white/5 border border-white/10 text-white/40 cursor-not-allowed"
        )}
       >
        {musicBotState?.isPlaying ? (
         <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]"><path d="M7 19h4V5H7v14zm6-14v14h4V5h-4z"></path></svg>
        ) : (
         <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="ml-1 drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]"><path d="M8 5v14l11-7z"></path></svg>
        )}
       </button>

       <button 
        onClick={() => {
         if (isHost && musicBotState?.queue && musicBotState.queue.length > 0) {
          const nextIdx = (musicBotState.queueIndex + 1) % musicBotState.queue.length;
          const nextTrack = musicBotState.queue[nextIdx];
          controlMusicBot("update-queue", {
           queue: musicBotState.queue,
           queueIndex: nextIdx,
           trackUrl: nextTrack.url,
           trackName: nextTrack.name,
           category: musicBotState.currentCategory,
           isPlaying: true,
           currentTime: 0
          });
         }
        }}
        className={cn(
         "p-2 flex items-center justify-center rounded-full text-[#81cad6] hover:text-[#00e5ff] hover:bg-[#00e5ff]/10 active:scale-90 transition-all",
         (!isHost || !musicBotState?.queue || musicBotState.queue.length <= 1) && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-[#81cad6]"
        )}
        disabled={!isHost || !musicBotState?.queue || musicBotState.queue.length <= 1}
       >
        <SkipForward size={26} fill="currentColor" strokeWidth={1.5} className="drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]" />
       </button>
      </div>

      {/* Queue Panel Trigger (Footer Button) */}
      <div className="pt-5 border-t-[1.5px] border-white/10 select-none font-sans mt-auto relative -mx-1 px-1">
       <button 
        onClick={() => setIsQueueOpen(!isQueueOpen)}
        className="w-full flex justify-between items-center bg-transparent transition-all font-black text-gray-300 hover:text-white outline-none"
        dir="ltr"
       >
        <div className="flex items-center">
         <span className="text-[#00e5ff] font-bold text-[16px] drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
          {musicBotState?.queue?.length || 0}
         </span>
        </div>
        <span className="flex items-center gap-1.5 text-sm tracking-wide font-black text-gray-200" dir={isRtl ? "rtl" : "ltr"}>
         {isRtl ? "لیست صف آهنگ‌ها" : "Track Queue List"} 📋
        </span>
       </button>

       {isQueueOpen && (
        <div className="absolute bottom-[110%] mb-2 left-0 w-full bg-[#0f0f0f]/90 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-2xl p-2 z-50 overflow-hidden">
         <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar pr-1 animate-enter font-sans">
          {musicBotState?.queue && musicBotState.queue.length > 0 ? (
           musicBotState.queue.map((track, idx) => {
            const isPlayingTrack = musicBotState.queueIndex === idx;
            return (
             <div 
              key={idx} 
              onClick={() => {
               if (isHost) {
                controlMusicBot("update-queue", {
                 queue: musicBotState.queue,
                 queueIndex: idx,
                 trackUrl: track.url,
                 trackName: track.name,
                 category: musicBotState.currentCategory,
                 isPlaying: true
                });
               }
              }}
              className={cn(
               "flex justify-between items-center bg-white/5 p-3 rounded-xl text-xs transition-all",
               isHost && "cursor-pointer hover:bg-white/10",
               isPlayingTrack && "border border-[#00e5ff]/30 bg-[#00e5ff]/10 text-[#00e5ff] font-bold flex-row-reverse text-right shadow-[0_0_10px_rgba(0,229,255,0.1)]"
              )}
             >
              <div className="flex flex-col items-end w-full truncate space-y-1">
               <span className={cn("truncate w-full text-right", isPlayingTrack ? "text-[#00e5ff]" : "text-white/80")}>{track.name}</span>
               {isPlayingTrack && <span className="text-[9px] tracking-widest uppercase font-mono animate-pulse opacity-80 z-20">PLAYING NOW</span>}
              </div>
             </div>
            );
           })
          ) : (
           <p className="text-center py-5 text-sm text-gray-500 font-bold">{isRtl ? "لیست پخش ربات خالی است" : "Playlist empty"}</p>
          )}
         </div>
        </div>
       )}
      </div>
     </motion.div>
    )}
   </AnimatePresence>
  )}{/* LOXX MUSIC BOT SEED SELECTION SETUP MODAL */}
 {showBotSetupModal && (
  <Modal title={isRtl ? "تنظیم ربات موسیقی لوکس (Music Bot)" : "Configure Loxx Music Bot"} onClose={() => setShowBotSetupModal(false)}>
   <div className="space-y-6 select-none max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
    {/* Step 1: Select Playback Source */}
    {setupStep === "source" && (
     <div className="space-y-4 font-sans">
      <p className="text-xs font-bold text-gray-400">
       {isRtl ? "مرحله اول: منبع پخش موسیقی ربات را مشخص کنید" : "Step 1: Select playback source for the music bot"}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       {/* Option A: Play from My Local Folder */}
       <div 
        onClick={() => {
         setSetupStep("source");
         document.getElementById("local-folder-picker-setup")?.click();
        }}
        className="group relative cursor-pointer border border-[#00e5ff]/20 bg-[#00e5ff]/5 hover:bg-[#00e5ff]/10 hover:border-[#00e5ff]/40 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center text-center space-y-3 shadow-lg hover:shadow-[0_0_15px_rgba(0,191,255,0.15)]"
       >
        <div className="h-14 w-14 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-2xl text-[#00e5ff] group-hover:scale-110 transition-transform">
         📂
        </div>
         <div>
         <h4 className="text-sm font-black text-white">{isRtl ? "پخش از پوشه شخصی خودم" : "Play from my personal folder"}</h4>
         <p className="text-[10px] text-gray-400 mt-1 lines-clamp-2 leading-relaxed font-bold">
          {isRtl ? "یک پوشه از سیستم کلاینت را انتخاب کنید تا موزیک‌ها به ترتیب یا رندوم استریم شوند." : "Select an audio folder from your device to stream its tracks live."}
         </p>
        </div>
        <input
         type="file"
         id="local-folder-picker-setup"
         // @ts-ignore
         webkitdirectory=""
         directory=""
         multiple
         accept="audio/*"
         className="hidden"
         onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
           const filesArray = (Array.from(e.target.files) as File[]).filter(
            f => f.type.startsWith("audio/") || f.name.endsWith(".mp3") || f.name.endsWith(".wav") || f.name.endsWith(".ogg") || f.name.endsWith(".m4a")
           );
           if (filesArray.length === 0) {
            toast.error(isRtl ? "هیچ فایل صوتی معتبری در پوشه انتخاب‌شده یافت نشد" : "No audios found in selected folder");
            return;
           }
           setSelectedLocalFiles(filesArray);
           toast.success(isRtl ? `تعداد ${filesArray.length} آهنگ آماده است.` : `${filesArray.length} tracks selected.`);
          }
         }}
        />
       </div>

       {/* Option B: Play from curated Loxx Library */}
       <div 
        onClick={() => {
         fetchLoxxLibrary();
         setSetupStep("loxx_genre");
        }}
        className="group relative cursor-pointer border border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10 hover:border-pink-500/40 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center text-center space-y-3 shadow-lg hover:shadow-[0_0_15px_rgba(244,63,94,0.15)]"
       >
        <div className="h-14 w-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-2xl text-pink-500 group-hover:scale-110 transition-transform">
         🎙️
        </div>
        <div>
         <h4 className="text-sm font-black text-white">{isRtl ? "پخش از کتابخانه لوکس" : "Play from Loxx library"}</h4>
         <p className="text-[10px] text-gray-400 mt-1 lines-clamp-2 leading-relaxed font-bold">
          {isRtl ? "از آرشیو تفکیک شده موسیقی ایرانی و خارجی لوکس روی لابی لذت ببرید." : "Enjoy the curated preloaded folders of Persian and Foreign hits."}
         </p>
        </div>
       </div>
      </div>

      {/* Folder configuration */}
      {selectedLocalFiles.length > 0 && (
       <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3 animate-enter mt-4">
        <div className="flex items-center justify-between text-xs">
         <span className="font-bold text-gray-400">{isRtl ? "موزیک‌های این پوشه:" : "Detected Tracks:"}</span>
         <span className="text-[#00e5ff] font-mono font-black">{selectedLocalFiles.length} {isRtl ? "آهنگ" : "tracks"}</span>
        </div>
        <div className="py-1 max-h-24 overflow-y-auto custom-scrollbar text-[10px] font-mono text-gray-500 space-y-1">
         {selectedLocalFiles.slice(0, 5).map((f, idx) => (
          <div key={idx} className="truncate">🎵 {f.name}</div>
         ))}
         {selectedLocalFiles.length > 5 && (
          <div className="text-center font-bold text-gray-400 mt-1">... و {selectedLocalFiles.length - 5} آهنگ دیگر</div>
         )}
        </div>

        {/* Local Play order mode */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
         <span className="text-[10px] font-bold text-gray-400 block">{isRtl ? "ترتیب پخش ربات:" : "Bot Play Order:"}</span>
         <div className="grid grid-cols-2 gap-2">
          <button 
           type="button"
           onClick={() => setLocalPlayMode("random")}
           className={cn("py-1.5 rounded-lg text-xs font-bold transition-all", localPlayMode === "random" ? "bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/35" : "bg-black/30 text-gray-400 border border-transparent")}
          >
           🎲 {isRtl ? "به صورت رندوم" : "Random Mix"}
          </button>
          <button 
           type="button"
           onClick={() => setLocalPlayMode("in-order")}
           className={cn("py-1.5 rounded-lg text-xs font-bold transition-all", localPlayMode === "in-order" ? "bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/35" : "bg-black/30 text-gray-400 border border-transparent")}
          >
           🔁 {isRtl ? "به ترتیب منطقی" : "In Order"}
          </button>
         </div>
        </div>

        <button 
         type="button"
         onClick={() => {
          let queue = selectedLocalFiles.map((file) => ({
           name: file.name.replace(/\.[^/.]+$/, ""),
           url: URL.createObjectURL(file)
          }));
          if (localPlayMode === "random") {
           queue = queue.sort(() => Math.random() - 0.5);
          }
          toggleMusicBot(true);
          setTimeout(() => {
           controlMusicBot("update-queue", {
            queue,
            queueIndex: 0,
            trackUrl: queue[0].url,
            trackName: queue[0].name,
            category: isRtl ? "پوشه شخصی" : "Personal Folder",
            isPlaying: true
           });
           toast.success(isRtl ? "ربات همراه با پوشه شما آنلاین شد!" : "Loxx bot online with your local player!");
           setShowBotSetupModal(false);
          }, 500);
         }}
         className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-black uppercase text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,191,255,0.3)] text-center block font-sans"
        >
         {isRtl ? "تایید و فعالسازی ربات" : "Deploy Live Music Bot"}
        </button>
       </div>
      )}
     </div>
    )}

    {/* Step 2: Select Genre (Irani vs Kharegi) */}
    {setupStep === "loxx_genre" && (
     <div className="space-y-4 font-sans">
      <p className="text-xs font-bold text-gray-400">
       {isRtl ? "مرحله دوم: سبک موسیقی مورد نظر خود را انتخاب کنید" : "Step 2: Choose your curated style category from Loxx"}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <div 
        onClick={() => {
         setSelectedGenre("irani");
         setSetupStep("loxx_category");
        }}
        className="group relative cursor-pointer border border-[#00e5ff]/20 bg-[#00e5ff]/5 hover:bg-[#00e5ff]/15 hover:border-[#00e5ff]/40 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center justify-center text-center space-y-2 min-h-36 shadow-lg hover:shadow-cyan-500/10"
       >
        <div className="text-4xl group-hover:scale-110 transition-transform mb-1">🇮🇷</div>
        <h4 className="text-sm font-black text-white">{isRtl ? "گلچین موسیقی ایرانی" : "Iranian Music Archive"}</h4>
        <p className="text-[10px] text-gray-400 leading-relaxed font-bold">
         {isRtl ? "پاپ وطنی و سنتی‌های اصیل کشورمان" : "Persianpop, traditional and nostalgia Iranian albums."}
        </p>
       </div>

       <div 
        onClick={() => {
         setSelectedGenre("kharegi");
         setSetupStep("loxx_category");
        }}
        className="group relative cursor-pointer border border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/15 hover:border-pink-500/40 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center justify-center text-center space-y-2 min-h-36 shadow-lg hover:shadow-pink-500/10"
       >
        <div className="text-4xl group-hover:scale-110 transition-transform mb-1">🌍</div>
        <h4 className="text-sm font-black text-white">{isRtl ? "آرشیو موزیک‌های خارجی" : "Foreign Pop & Club"}</h4>
        <p className="text-[10px] text-gray-400 leading-relaxed font-bold">
         {isRtl ? "سینث‌ویو، کلاب، رپ خارجی و بیت‌های الکترونیک لوفای" : "Synthwave, techno, hip-hop, and dynamic rock."}
        </p>
       </div>
      </div>

      <div className="flex justify-start">
       <button 
        type="button"
        onClick={() => setSetupStep("source")}
        className="text-xs font-bold text-gray-500 hover:text-white flex items-center gap-1 py-1 px-3 hover:bg-white/5 rounded-lg transition-all"
       >
        {isRtl ? "← بازگشت به منبع اصلی" : "← Back"}
       </button>
      </div>
     </div>
    )}

    {/* Step 3: Browse categories inside Irani/Kharegi */}
    {setupStep === "loxx_category" && selectedGenre && (
     <div className="space-y-4 font-sans text-right" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
       <p className="text-xs font-bold text-gray-400">
        {isRtl ? `پوشه‌های موجود در آرشیو ${selectedGenre === "irani" ? "ایرانی" : "خارجی"}` : `Subcategories under ${selectedGenre}`}
       </p>
       <button 
        type="button"
        onClick={() => setSetupStep("loxx_genre")}
        className="text-xs font-bold text-[#00e5ff] hover:underline"
       >
        {isRtl ? "تغییر سبک کلی" : "Change genre selection"}
       </button>
      </div>

      {loxxLibrary?.[selectedGenre] ? (
       <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {loxxLibrary[selectedGenre].subfolders?.map((cat: any, i: number) => {
          const tracksCount = cat.tracks?.length || 0;
          const isSelected = selectedCategoryData?.name === cat.name;
          return (
           <div 
            key={i} 
            className={cn(
             "group cursor-pointer bg-black/45 border rounded-2xl overflow-hidden transition-all duration-300 relative select-none flex flex-col shadow-md h-32 justify-end",
             isSelected 
              ? "border-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.15)] ring-1 ring-[#00e5ff]/20 bg-[#00e5ff]/5" 
              : "border-white/5 hover:border-white/20 hover:bg-black/60"
            )}
            onClick={() => setSelectedCategoryData(cat)}
           >
            <div className="absolute inset-0 bg-black/50 overflow-hidden">
             {cat.bannerUrl ? (
              <SmartImage 
               src={cat.bannerUrl} 
               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-25 group-hover:opacity-45" 
               alt={cat.name} 
              />
             ) : (
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/20 to-black/80" />
             )}
            </div>
            <div className="relative z-10 p-3 flex flex-col items-start text-left w-full justify-end font-sans">
             <span className="text-xs font-black text-white uppercase tracking-wider drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] font-sans">
              📁 {cat.name}
             </span>
             <span className="text-[8px] font-bold bg-[#00e5ff]/10 text-[#00e5ff] px-1.5 py-0.5 rounded border border-[#00e5ff]/20 mt-1 font-mono leading-none">
              {tracksCount} Tracks
             </span>
            </div>
           </div>
          );
         })}
        </div>

        {/* Tracks lists display */}
        {selectedCategoryData && (
         <div className="bg-black/60 p-4 rounded-2xl border border-[#00e5ff]/25 space-y-4 animate-enter mt-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
           <div className="flex flex-col text-left font-sans">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Selected directory</span>
            <span className="text-sm font-black text-white uppercase">{selectedCategoryData.name}</span>
           </div>
           <button 
            type="button"
            onClick={() => playLoxxCategory(selectedCategoryData)}
            className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-black uppercase text-[10px] hover:scale-105 active:scale-95 transition-all shadow-[0_0_12px_#00e5ff]"
           >
            ⚡ {isRtl ? "پخش پوشه کامل" : "Play Whole Folder"}
           </button>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
           {selectedCategoryData.tracks && selectedCategoryData.tracks.length > 0 ? (
            selectedCategoryData.tracks.map((track: any, idx: number) => (
             <div 
              key={idx} 
              className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 group hover:border-[#00e5ff]/30 hover:bg-[#00e5ff]/5 transition-colors"
             >
              <div className="flex items-center gap-2.5">
               <span className="text-gray-500 font-mono text-[9px] w-4 shrink-0 group-hover:text-[#00e5ff] transition-colors">{idx + 1}</span>
               <span className="text-xs font-bold text-white truncate max-w-[190px] font-sans">{track.title}</span>
              </div>
              <button 
               type="button"
               onClick={() => {
                const queue = selectedCategoryData.tracks.map((t: any) => ({
                 name: t.title,
                 url: t.url
                }));
                toggleMusicBot(true);
                setTimeout(() => {
                 controlMusicBot("update-queue", {
                  queue,
                  queueIndex: idx,
                  trackUrl: track.url,
                  trackName: track.title,
                  category: selectedCategoryData.name,
                  isPlaying: true
                 });
                 toast.success(isRtl ? `در حال پخش آهنگ: ${track.title}` : `Now playing: ${track.title}`);
                 setShowBotSetupModal(false);
                }, 500);
               }}
               className="p-1 px-2.5 rounded-lg bg-white/5 text-[9px] font-black uppercase text-gray-300 group-hover:bg-[#00e5ff] group-hover:text-black transition-all font-sans"
              >
               {isRtl ? "پخش" : "Play"}
              </button>
             </div>
            ))
           ) : (
            <p className="text-center py-4 text-[9px] text-gray-500 font-sans">{isRtl ? "آهنگی یافت نشد" : "No audios found"}</p>
           )}
          </div>
         </div>
        )}
       </div>
      ) : (
       <div className="text-center py-10 opacity-60 flex flex-col items-center justify-center space-y-2">
        <div className="animate-spin text-2xl font-sans">⏳</div>
        <p className="text-xs font-bold font-sans">{isRtl ? "در حال بازیابی کتابخانه موسیقی لوکس..." : "Loading Loxx audio database..."}</p>
       </div>
      )}

      <div className="flex justify-start font-sans">
       <button 
        type="button"
        onClick={() => {
         setSelectedCategoryData(null);
         setSetupStep("loxx_genre");
        }}
        className="text-xs font-bold text-gray-500 hover:text-white flex items-center gap-1 py-1 px-3 hover:bg-white/5 rounded-lg transition-all"
       >
        {isRtl ? "← بازگشت به عقب" : "← Back"}
       </button>
      </div>
     </div>
    )}
   </div>
  </Modal>
 )}

 {activeProfileUserId && (
 <Modal title={isRtl ? "پروفایل بازیکن" : "Player Profile"} onClose={() => setActiveProfileUserId(null)}>
 <div className="flex flex-col items-center gap-6 py-4">
 <div className="h-32 w-32 rounded-[40px] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden">
 {(() => {
 const p = players.find(p => p.id === activeProfileUserId);
 return (
 <SmartImage 
 src={p?.avatarUrl || ""}
 className="w-full h-full object-cover"
 alt={p?.name || "Player"}
 />
 );
 })()}
 </div>
 <div className="text-center">
 <h3 className="text-2xl font-black text-white">{players.find(p => p.id === activeProfileUserId)?.name}</h3>
 <p className="text-neon-blue text-sm font-black uppercase mt-1">Global Elite</p>
 </div>
 <div className="grid grid-cols-3 gap-4 w-full">
 <StatCard label={isRtl ? "بُردها" : "Wins"} value="1,242" />
 <StatCard label="K/D" value="1.42" />
 <StatCard label={isRtl ? "ساعت" : "Hours"} value="3.5K" />
 </div>
 <GlowButton 
 variant="blue" 
 className="w-full h-12 flex items-center justify-center gap-2"
 onClick={() => window.open('/profile', '_blank')}
 >
 <img src="/logo.png" className="h-5 w-auto" />
 {isRtl ? "مشاهده پروفایل لوکس" : "View LOXX Profile"}
 </GlowButton>
 </div>
 </Modal>
 )}

 {showFallbackModal && (
 <Modal title={isRtl ? "اطلاعیه اتصال شبکه لوکس" : "Loxx Connection Advisory"} onClose={() => setShowFallbackModal(false)} maxWidth="max-w-xl">
  <div className="flex flex-col items-center justify-center text-center space-y-6 py-4" dir="rtl">
    
    {/* Icon and Animated Ring */}
    <div className="relative">
      <div className="absolute inset-0 bg-yellow-500/25 blur-xl rounded-full scale-125 animate-pulse" />
      <div className="relative h-16 w-16 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center justify-center text-yellow-400">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    </div>

    <div className="space-y-4">
      <h4 className="text-xl font-black text-white leading-normal tracking-tight">
        اتصال مستقیم شما به سرور اصلی لوکس برقرار نشد.
      </h4>
      
      <p className="text-sm text-gray-300 font-medium leading-relaxed max-w-md">
        به‌دلیل شرایط زیرساختی و محدودیت‌های شبکه، در حال حاضر اینترنت شما امکان اتصال به مسیر پرسرعت و اختصاصی ما را ندارد.
      </p>

      <div className="py-2 px-4 rounded-2xl bg-white/5 border border-white/10 max-w-sm mx-auto flex items-center justify-center gap-2">
        <span className="text-lg">💎</span>
        <span className="text-sm font-bold text-neon-blue">اما جای نگرانی نیست</span>
      </div>

      <p className="text-sm text-gray-300 font-medium leading-relaxed max-w-md text-right md:text-center">
        ما به‌صورت هوشمند شما را از طریق مسیر جایگزین پایدار متصل کرده‌ایم تا بتوانید بدون وقفه از لابی و امکانات استفاده کنید.
      </p>

      <div className="p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/10 text-right text-xs text-yellow-400/90 leading-relaxed font-semibold">
        💡 برای تجربه کامل با حداکثر کیفیت صدا و کمترین تأخیر، پیشنهاد می‌کنیم از اینترنت دیگری استفاده کرده و مجدداً وارد برنامه شوید.
      </div>
    </div>

    <div className="w-full pt-4 border-t border-white/5 flex flex-col items-center justify-center space-y-2">
      <GlowButton onClick={() => setShowFallbackModal(false)} className="w-full py-3.5">
        متوجه شدم • ورود به لابی
      </GlowButton>
      <span className="text-[10px] text-gray-500 font-bold">لوکس همیشه بهترین مسیر را برای شما فعال میکند ✨</span>
    </div>

  </div>
 </Modal>
 )}

 {isSettingsModalOpen && (
 <Modal title={isRtl ? "تنظیمات لابی" : "Lobby Settings"} onClose={() => setIsSettingsModalOpen(false)} maxWidth="max-w-4xl">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
    {/* Column 1: Core Host settings, Routing, and Desktop Info */}
    <div className="space-y-6">
      {/* Host specific settings */}
      {isHost ? (
        <div className="space-y-4">
          <h4 className="text-sm font-black text-neon-blue uppercase border-b border-white/10 pb-2">{isRtl ? "تنظیمات اصلی لابی" : "Core Lobby Settings"}</h4>
          
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
            <div>
              <p className="text-sm font-black text-white">{isRtl ? "لابی خصوصی" : "Private Lobby"}</p>
              <p className="text-[10px] text-gray-500 font-bold">{isRtl ? "فقط با کد دعوت یا لینک" : "Only via invite link or code"}</p>
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
              <p className="text-sm font-black text-white">{isRtl ? "دسترسی میکروفون" : "Microphone Required"}</p>
              <p className="text-[10px] text-gray-500 font-bold">{isRtl ? "بازیکنان برای چت صوتی نیاز به میکروفون دارند" : "Players require microhpone for voice chat"}</p>
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

      {/* General User settings: Input/Output Audio Selector */}
      <div className="space-y-3 p-3.5 rounded-2xl bg-white/5 border border-white/5">
        <p className="text-xs font-black text-white border-b border-white/5 pb-1.5 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-neon-pink shadow-[0_0_8px_rgba(255,0,127,1)]" />
          {isRtl ? "تنظیمات ورودی و خروجی صدا (Hardware Audio Routing)" : "Audio Input & Output Hardware Routing"}
        </p>

        <div className="space-y-1">
          <label className="text-[9px] text-gray-400 font-bold block">{isRtl ? "دستگاه ورودی میکروفون (Input Microphone)" : "Input Microphone Device"}</label>
          <select
            value={selectedAudioInput}
            onChange={(e) => setSelectedAudioInput(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-neon-blue font-bold font-sans transition appearance-none cursor-pointer"
          >
            <option value="default" className="bg-zinc-950 text-gray-300">{isRtl ? "Default Device (میکروفون پیش‌فرض سیستم)" : "Default Device (System Default Mic)"}</option>
            {audioInputDevices.map((d) => (
              <option key={d.deviceId} value={d.deviceId} className="bg-zinc-950 text-white">
                {d.label || `Microphone (${d.deviceId.slice(0, 5)}...)`}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] text-gray-400 font-bold block">{isRtl ? "دستگاه خروجی هدفون / بلندگو (Output Destination)" : "Output Destination Device"}</label>
          <select
            value={selectedAudioOutput}
            onChange={(e) => setSelectedAudioOutput(e.target.value)}
            className="w-full py-2 px-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-neon-pink font-bold font-sans transition appearance-none cursor-pointer"
          >
            <option value="default" className="bg-zinc-950 text-gray-300">{isRtl ? "Default Device (بلندگوی پیش‌فرض سیستم)" : "Default Device (System Default Speaker)"}</option>
            {audioOutputDevices.map((d) => (
              <option key={d.deviceId} value={d.deviceId} className="bg-zinc-950 text-white">
                {d.label || `Output Speaker (${d.deviceId.slice(0, 5)}...)`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop & Live Discord Overlay Panel */}
      <div className="space-y-4">
        <h4 className="text-sm font-black text-neon-blue uppercase border-b border-white/10 pb-2 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-neon-blue shadow-[0_0_8px_rgba(0,229,255,1)]" />
          {isRtl ? "تنظیمات اختصاصی دسکتاپ و سیستم صوتی" : "Desktop client & Audio Engine Settings"}
        </h4>

        {isElectron ? (
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-white flex flex-col items-center gap-3 text-center">
            <Settings size={32} className="text-indigo-400" />
            <p>{isRtl ? "تنظیمات لابی مخصوص ویندوز (Push to Talk، Overlay، Performance) به بخش جدیدی منتقل شده است." : "Windows-specific settings (Push to Talk, Overlay, Performance) have moved to the Launcher section."}</p>
            <button 
              onClick={() => {
                setIsSettingsModalOpen(false);
                navigate("/electron-settings");
              }}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white font-bold transition"
            >
              {isRtl ? "باز کردن تنظیمات ویندوز" : "Open Windows Settings"}
            </button>
          </div>
        ) : (
          /* Web Browser Showcase for Desktop Client */
          <div className="p-4 rounded-2xl bg-gradient-to-br from-neon-blue/10 via-transparent to-neon-pink/10 border border-white/5 space-y-3">
            <p className="text-xs font-black text-white">{isRtl ? "🔥 پتانسیل واقعی سیستم صوتی Loxx را آزاد کنید!" : "🔥 Unlock the full potential of LOXX Audio Engine!"}</p>
            <p className="text-[10px] text-gray-400 leading-relaxed font-bold">
              {isRtl ? "آیا می‌دانستید با استفاده از کلاینت دسکتاپ (Windows / macOS / Linux)، قابلیت‌هایی در اختیارتان قرار می‌گیرد که در مرورگر وب ممکن نیستند؟" : "Did you know that by running the official Desktop Client, you gain advanced abilities not supported by regular web browsers?"}
            </p>
            <ul className="text-[9px] text-[#00e5ff] space-y-1 font-bold list-disc list-inside">
              <li>{isRtl ? "کلید Push to Talk سیستمی (حتی زمانی که داخل بازی‌های سنگین مانند CS:GO و Valorant آلت‌تب هستید)" : "System-wide Push to Talk hotkey (even while alt-tabbed in heavy fullscreen games like CS:GO or Valorant)"}</li>
              <li>{isRtl ? "منوی هوشمند تسک‌بار (System Tray) به همراه کلید قطع صدای گلوبال" : "Intelligent System Tray menu with a global active microphone mute switch"}</li>
              <li>{isRtl ? "اجرای اتوماتیک و اتصال بدون دردسر همزمان با روشن کردن رایانه شخصی شما" : "Auto-launch and instant connection upon starting your personal computer"}</li>
              <li>{isRtl ? "قابلیت Hardware Acceleration برای کاهش فشار روی CPU" : "Engine-level Hardware Acceleration to bypass browser engine overhead and lower CPU usage"}</li>
            </ul>
            <div className="pt-1 select-all">
              <button 
                onClick={() => {
                  toast.success(isRtl ? "درخواست دانلود کلاینت دسکتاپ ثبت شد. به زودی نسخه لانچر برای شما ارسال می‌شود!" : "Launcher download request registered! The setup file will be delivered shortly.");
                }}
                className="w-full py-2.5 rounded-xl bg-neon-blue hover:bg-neon-blue/80 text-black text-xs font-black transition-all shadow-[0_0_12px_rgba(0,229,255,0.4)]"
              >
                {isRtl ? "دریافت لانچر دسکتاپ (Loxx Desktop Launcher)" : "Download Desktop Launcher"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Column 2: Microphone Sensitivity & Delays + HUD Overlay Layout Config */}
    <div className="space-y-6">
      {/* Sensitivity & Delays (حساسیت و تاخیر صدا) */}
      <div className="space-y-3 p-3.5 rounded-2xl bg-white/5 border border-white/5">
        <p className="text-xs font-black text-white border-b border-white/5 pb-1.5 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)]" />
          {isRtl ? "تنظیمات حساسیت و تاخیر میکروفون" : "Microphone Sensitivity & Gate Delays"}
        </p>

        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
          <button
            onClick={() => setIsMicTestOn(!isMicTestOn)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] uppercase font-black transition-all flex items-center gap-1.5 border",
              isMicTestOn 
                ? "bg-red-500/20 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse" 
                : "bg-black/40 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
            )}
          >
            {isMicTestOn ? (isRtl ? "در حال تست (غیرفعال در لابی)" : "TESTING MIC (Muted)") : (isRtl ? "تست میکروفون" : "Test Mic")}
          </button>
        </div>

        {/* Noise Cancelling Switch */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 mb-3">
          <div>
            <p className="text-[11px] font-black text-white">{isRtl ? "نویزگیر هوشمند لوکس" : "Studio Noise Cancellation"}</p>
            <p className="text-[9px] text-gray-500 leading-normal">{isRtl ? "حذف خودکار اکو و نویز صدای شما در حین تماس" : "Hardware echo & noise suppression"}</p>
          </div>
          <div 
            onClick={() => setNoiseCanceling(!noiseCanceling)}
            className={cn(
              "w-10 h-5 rounded-full relative cursor-pointer border transition-colors shrink-0",
              noiseCanceling ? "bg-neon-pink/20 border-neon-pink/30" : "bg-white/5 border-white/10"
            )}
          >
            <div className={cn(
              "absolute top-1 h-3 w-3 rounded-full transition-all",
              noiseCanceling ? "right-1 bg-neon-pink shadow-[0_0_10px_rgba(255,0,127,1)]" : "right-6 bg-gray-500"
            )} />
          </div>
        </div>

        {/* Mic Sensitivity Slider */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold">
            <span>{isRtl ? "حساسیت صدا (Gate Threshold)" : "Activation Sensitivity"}</span>
            <span className="text-[#00e5ff] font-sans">{micSensitivity}</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="40" 
            value={micSensitivity} 
            onChange={(e) => setMicSensitivity(parseInt(e.target.value, 10))}
            className="w-full accent-[#00e5ff] bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-[8px] text-gray-500 leading-normal font-sans">
            {isRtl ? "مقدار کمتر = حساس‌تر (مناسب محیط آرام)، مقدار بیشتر = نویزگیر قوی‌تر (نیازمند صدای بلندتر)" : "Lower = more sensitive, Higher = filters more background noise"}
          </p>
        </div>

        {/* Active Open Delay */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold">
            <span>{isRtl ? "تاخیر در باز شدن مایک (Open Delay)" : "Voice Activation Delay"}</span>
            <span className="text-neon-pink font-sans">{micOpenDelay} ms</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="2000" 
            step="50"
            value={micOpenDelay} 
            onChange={(e) => setMicOpenDelay(parseInt(e.target.value, 10))}
            className="w-full accent-neon-pink bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-[8px] text-gray-500 leading-normal font-sans">
            {isRtl ? "تاخیر قبل از ارسال صدا؛ به شما اجازه می‌دهد فاقد نویزهای کوتاه و لحظه‌ای باشید" : "Delay before your mic starts transmitting audio"}
          </p>
        </div>

        {/* Active Close Delay */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold">
            <span>{isRtl ? "تاخیر در بسته شدن مایک (Close Delay)" : "Voice Gate Close Delay"}</span>
            <span className="text-indigo-400 font-sans">{micCloseDelay} ms</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="3000" 
            step="100"
            value={micCloseDelay} 
            onChange={(e) => setMicCloseDelay(parseInt(e.target.value, 10))}
            className="w-full accent-indigo-400 bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-[8px] text-gray-500 leading-normal font-sans">
            {isRtl ? "تاخیر در قطع شدن صدا پس از اتمام صحبت؛ از بریده بریده شدن جملات جلوگیری می‌کند" : "Keeps microphone open briefly of silence to prevent speech cutting off"}
          </p>
        </div>
      </div>

      {/* Shared Web-Only Overlay appearance settings */}
      {!isElectron && (
        <div className="border border-white/5 p-3.5 rounded-2xl bg-white/5 space-y-3">
          <p className="text-xs font-black text-white select-none">{isRtl ? "تنظیمات ظاهر ویترین زنده (HUD Overlay)" : "HUD Desktop Overlay Appearance Config"}</p>

          {/* Overlay Toggle Switch */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-black/40">
            <div>
              <p className="text-xs font-black text-white">{isRtl ? "طرح زنده روی بازی‌ها (Live Overlay)" : "Live In-game HUD Overlay"}</p>
              <p className="text-[9px] text-gray-500 font-bold font-sans">{isRtl ? "نمایش لیست فعال کانال صوتی روی گوشه تصویر بقیه برنامه‌ها" : "Render active speaker list on top of fullscreen programs & games"}</p>
            </div>
            <div 
              onClick={() => setOverlayEnabled(!overlayEnabled)}
              className={cn(
                "w-12 h-6 rounded-full relative cursor-pointer border transition-colors",
                overlayEnabled ? "bg-neon-blue/20 border-neon-blue/30" : "bg-white/5 border-white/10"
              )}
            >
              <div className={cn(
                "absolute top-1 h-4 w-4 rounded-full transition-all",
                overlayEnabled ? "right-1 bg-neon-blue shadow-[0_0_10px_rgba(0,229,255,1)]" : "right-7 bg-gray-500"
              )} />
            </div>
          </div>

          {/* Hide non-talking toggle */}
          <div className={cn("flex items-center justify-between p-3 rounded-2xl bg-black/40 transition-opacity", !overlayEnabled && "opacity-50 pointer-events-none")}>
            <div>
              <p className="text-xs font-black text-white">{isRtl ? "فقط نمایش کاربران در حال صحبت" : "Show speaking users only"}</p>
              <p className="text-[9px] text-gray-500 font-bold font-sans">{isRtl ? "مخفی کردن اعضای ساکت از کادر روی صفحه زمان سکوت" : "Hide quiet players from the HUD panel to minimize layout clutter"}</p>
            </div>
            <div 
              onClick={() => setOverlayOnlyTalking(!overlayOnlyTalking)}
              className={cn(
                "w-12 h-6 rounded-full relative cursor-pointer border transition-colors",
                overlayOnlyTalking ? "bg-neon-blue/20 border-neon-blue/30" : "bg-white/5 border-white/10"
              )}
            >
              <div className={cn(
                "absolute top-1 h-4 w-4 rounded-full transition-all",
                overlayOnlyTalking ? "right-1 bg-neon-blue shadow-[0_0_10px_rgba(0,229,255,1)]" : "right-7 bg-gray-500"
              )} />
            </div>
          </div>

          {/* Display members list display toggle */}
          <div className={cn("flex items-center justify-between p-3 rounded-2xl bg-black/40 transition-opacity", !overlayEnabled && "opacity-50 pointer-events-none")}>
            <div>
              <p className="text-xs font-black text-white">{isRtl ? "نمایش لیست اعضا روی اورلی" : "Render members roster list"}</p>
              <p className="text-[9px] text-gray-400 font-bold font-sans">{isRtl ? "نمایش یا پنهان‌سازی اسامی و آواتار اعضا در لابی روی تصویر" : "Control the visibility of individual names & avatars in the overlay box"}</p>
            </div>
            <div 
              onClick={() => setOverlayMembersVisible(!overlayMembersVisible)}
              className={cn(
                "w-12 h-6 rounded-full relative cursor-pointer border transition-colors",
                overlayMembersVisible ? "bg-neon-blue/20 border-neon-blue/30" : "bg-white/5 border-white/10"
              )}
            >
              <div className={cn(
                "absolute top-1 h-4 w-4 rounded-full transition-all",
                overlayMembersVisible ? "right-1 bg-neon-blue shadow-[0_0_10px_rgba(0,229,255,1)]" : "right-7 bg-gray-500"
              )} />
            </div>
          </div>
        </div>
      )}

      {/* LOXX MUSIC BOT MANAGEMENT SECTION */}
      <div className="border border-white/5 p-3.5 rounded-2xl bg-white/5 space-y-4 mt-4">
        <p className="text-xs font-black text-white flex items-center gap-2 border-b border-white/5 pb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,1)] animate-pulse" />
          {isRtl ? "مدیریت بات هوشمند موزیک (Music Bot)" : "Intelligent Music Bot Settings"}
        </p>

        {/* Host controls to Add/Remove Bot */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-black/40">
          <div>
            <p className="text-xs font-black text-white">{isRtl ? "حضور بات موزیک در لابی" : "Music Bot Presence"}</p>
            <p className="text-[9px] text-gray-500 font-bold">{isRtl ? "ورود بات صوتی مجازی به کانال لابی شما" : "Virtual voice bot playing high-fidelity streams"}</p>
          </div>
          {isHost ? (
            <div 
              onClick={() => {
               const willBeActive = !musicBotState?.active;
               toggleMusicBot(willBeActive);
               if (willBeActive) {
                 setIsSettingsModalOpen(false);
                 setShowBotSetupModal(true);
               }
              }}
              className={cn(
                "w-12 h-6 rounded-full relative cursor-pointer border transition-colors shrink-0",
                musicBotState?.active ? "bg-[#00e5ff]/20 border-[#00e5ff]/30" : "bg-white/5 border-white/10"
              )}
            >
              <div className={cn(
                "absolute top-1 h-4 w-4 rounded-full transition-all",
                musicBotState?.active ? (isRtl ? "left-1 bg-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,1)]" : "right-1 bg-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,1)]") : (isRtl ? "left-7 bg-gray-500" : "right-7 bg-gray-500")
              )} />
            </div>
          ) : (
            <span className={cn(
              "px-2 py-1 rounded text-xs font-bold leading-none shrink-0",
              musicBotState?.active ? "bg-[#00e5ff]/10 text-[#00e5ff]" : "bg-white/5 text-gray-500"
            )}>
              {musicBotState?.active ? (isRtl ? "فعال" : "Active") : (isRtl ? "غیرفعال" : "Inactive")}
            </span>
          )}
        </div>

        {/* Personalized Ducking Volume Sliders for everyone */}
        <div className="space-y-3 bg-black/20 p-3 rounded-xl border border-white/5">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{isRtl ? "تنظیمات شخصی‌سازی هوشمند صدا (Ducking)" : "Personalized Ducking & Volume Controls"}</p>
          
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold font-sans">
              <span>{isRtl ? "حجم صدای موسیقی در سکوت لابی" : "Silence volume ratio"}</span>
              <span className="text-[#00e5ff] font-sans">{musicVolumeSilence}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={musicVolumeSilence} 
              onChange={(e) => setMusicVolumeSilence(parseInt(e.target.value, 10))}
              className="w-full accent-[#00e5ff] bg-black/40 h-1 rounded appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold font-sans">
              <span>{isRtl ? "حجم صدای موسیقی هنگام صحبت هم‌تیمی‌ها" : "Talking (ducked) volume ratio"}</span>
              <span className="text-neon-pink font-sans">{musicVolumeTalking}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={musicVolumeTalking} 
              onChange={(e) => setMusicVolumeTalking(parseInt(e.target.value, 10))}
              className="w-full accent-neon-pink bg-black/40 h-1 rounded appearance-none cursor-pointer"
            />
          </div>
          <p className="text-[8px] text-gray-500 leading-normal border-t border-white/5 pt-1.5 mt-1.5">
            {isRtl ? "هنگام شروع صحبت سایر اعضا، ولوم صدای بات به طور اتوماتیک کاهش یافته و دوباره ملایم فیداین می‌شود." : "The music bot volume scales automatically when someone speaks, fading back dynamically."}
          </p>
        </div>

        {/* Dynamic Category/Track Selector inside Settings modal */}
        {musicBotState?.active && (
          <>
            {/* Loxx Music Library Category Explorer */}
            <div className="bg-black/35 p-3 rounded-xl border border-white/5 space-y-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase">{isRtl ? "آلبوم موسیقی‌های لوکس" : "Loxx Dynamic Music Library"}</span>
              
              {/* Category selector tabs */}
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                {Object.keys(libraryCategories).length > 0 ? (
                  Object.keys(libraryCategories).map((catName) => (
                    <button
                      key={catName}
                      onClick={() => setSelectedLibCategory(catName)}
                      className={cn(
                        "px-2.5 py-1 text-[9px] font-bold rounded-lg whitespace-nowrap transition-all border shrink-0",
                        selectedLibCategory === catName 
                          ? "bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]/30 shadow-[0_0_8px_rgba(0,229,255,0.15)]" 
                          : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10"
                      )}
                    >
                      {catName}
                    </button>
                  ))
                ) : (
                  <span className="text-[8px] text-gray-600 py-1">{isRtl ? "درحال بارگذاری دسته‌بندی‌ها..." : "Loading categories..."}</span>
                )}
              </div>

              {/* Tracks inside selected category */}
              <div className="max-h-36 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                {selectedLibCategory && libraryCategories[selectedLibCategory] && libraryCategories[selectedLibCategory].length > 0 ? (
                  libraryCategories[selectedLibCategory].map((track: any) => {
                    const isInQueue = musicBotState?.queue?.some((t: any) => t.id === track.id || t.title === track.title);
                    return (
                      <div 
                        key={track.id || track.title} 
                        className="flex justify-between items-center bg-white/5 p-1.5 px-2.5 rounded-lg border border-white/5 hover:border-white/10 transition-all"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-white truncate">{track.title}</p>
                          <p className="text-[8px] text-gray-500 leading-none mt-0.5">{track.category}</p>
                        </div>
                        
                        <div className="flex gap-1 shrink-0">
                          {isHost ? (
                            <>
                              <button
                                onClick={() => controlMusicBot("update-queue", { tracks: [track] })}
                                className="p-1 px-2 text-[8px] font-black bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 border border-[#00e5ff]/20 text-[#00e5ff] rounded-md transition-all whitespace-nowrap"
                                title={isRtl ? "پخش آنی موزیک" : "Instant Play Stream"}
                              >
                                {isRtl ? "پخش" : "Play"}
                              </button>
                              <button
                                onClick={() => controlMusicBot("update-queue", { 
                                  tracks: [...(musicBotState?.queue || []), track] 
                                })}
                                className={cn(
                                  "p-1 px-2 text-[8px] font-black rounded-md transition-all whitespace-nowrap border",
                                  isInQueue 
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-default animate-pulse" 
                                    : "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
                                )}
                              >
                                {isInQueue ? (isRtl ? "در صف" : "Queued") : (isRtl ? "+ صف" : "+ Queue")}
                              </button>
                            </>
                          ) : (
                            <span className="text-[8px] text-gray-600 font-semibold">{isRtl ? "مخصوص سازنده" : "Host only"}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-4 text-[9px] text-gray-600">{isRtl ? "آهنگی در این دسته‌بندی یافت نشد." : "No songs found in this category."}</p>
                )}
              </div>
            </div>

            {/* Playing Track Details and Quick Music Bot Queue Controller panel */}
            <div className="bg-black/35 p-3 rounded-xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase">{isRtl ? "موسیقی در حال پخش" : "Current Track & Playlist"}</span>
                <span className="text-[8px] font-mono bg-[#00e5ff]/10 text-[#00e5ff] px-1.5 py-0.5 rounded leading-none shrink-0 border border-[#00e5ff]/10 animate-pulse">LIVE DJ STREAM</span>
              </div>

              <div className="flex items-center gap-2.5 bg-black/40 p-2 rounded-lg">
                <div className="w-8 h-8 rounded bg-[#111] border border-white/5 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-lg overflow-hidden relative">
                  {musicBotState?.currentTrackCover ? (
                   <img src={musicBotState.currentTrackCover} className={cn("w-full h-full object-cover", musicBotState?.isPlaying && "animate-[spin_4s_linear_infinite] rounded-full")} />
                  ) : (
                   <span className={cn(musicBotState?.isPlaying && "animate-[spin_4s_linear_infinite]")}>💿</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black text-white truncate">{musicBotState?.currentTrackName ? musicBotState.currentTrackName : (isRtl ? "آهنگی انتخاب نشده است" : "Playlist empty")}</p>
                  <p className="text-[9px] text-gray-500 leading-none mt-1 font-bold truncate">{musicBotState?.currentCategory ? musicBotState.currentCategory : (isRtl ? "بدون دسته‌بندی" : "No active category")}</p>
                </div>
                {/* Skip / Next Controls for Host */}
                {isHost && (
                  <div className="flex gap-1 shrink-0">
                    <button 
                      onClick={() => controlMusicBot("play", { currentTime: localMusicAudioRef.current?.currentTime || 0 })} 
                      className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-all text-xs"
                      title={isRtl ? "پخش مجدد" : "Force Play/Resume"}
                    >
                      ▶
                    </button>
                    <button 
                      onClick={() => controlMusicBot("pause", { currentTime: localMusicAudioRef.current?.currentTime || 0 })} 
                      className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-all text-xs"
                      title={isRtl ? "توقف موقت" : "Pause Track"}
                    >
                      ⏸
                    </button>
                    <button 
                      onClick={() => controlMusicBot("update-queue", { tracks: musicBotState?.queue?.slice(1) || [] })} 
                      className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-all text-xs font-bold"
                      title={isRtl ? "آهنگ بعدی" : "Skip Song"}
                    >
                      ⏭
                    </button>
                  </div>
                )}
              </div>
              
              {/* Queue info */}
              <div className="text-[9px] text-gray-400 font-semibold space-y-1 pt-1 border-t border-white/5">
                <div className="flex justify-between font-bold text-gray-500">
                  <span>{isRtl ? "ردیف‌های لیست شیفت" : "Bot Track List Queue"}</span>
                  <span>{musicBotState.queue?.length || 0} track(s)</span>
                </div>
                {musicBotState.queue && musicBotState.queue.length > 0 ? (
                  <div className="max-h-24 overflow-y-auto space-y-1 custom-scrollbar pr-1 mt-1 font-sans">
                    {musicBotState.queue.map((track: any, idx: number) => (
                      <div key={track.id || idx} className={cn("flex justify-between items-center bg-white/5 p-1 px-2 rounded-lg text-[9px]", musicBotState.queueIndex === idx && "border border-[#00e5ff]/20 bg-[#00e5ff]/5 text-white font-bold")}>
                        <span className="truncate max-w-[185px]">{track.title}</span>
                        <span className="text-[8px] text-gray-500 shrink-0">{track.category}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-2 text-[8px] text-gray-405 mt-1">{isRtl ? "لیست پخش بات خالی است" : "Waitlist empty, add tracks from lobby list"}</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
</Modal>
 )}
 </AnimatePresence>
 </div>
 </main>
 </div>
 );
};

function StatCard({ label, value }: { label: string, value: string }) {
 return (
 <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
 <p className="text-[8px] font-black text-gray-500 uppercase mb-1">{label}</p>
 <p className="text-sm font-black text-white">{value}</p>
 </div>
 );
}

function RemoteAudioPlayer({ stream, onVolumeChange, volumeLevel }: { stream: MediaStream, onVolumeChange: (vol: number) => void, volumeLevel: number, key?: any }) {
 const audioRef = useRef<HTMLAudioElement>(null);

 useEffect(() => {
 if (audioRef.current && stream) {
 if (audioRef.current.srcObject !== stream) {
 audioRef.current.srcObject = stream;
 }
 audioRef.current.play().catch(e => console.warn("AutoPlay blocked:", e));
 }
 }, [stream]);

 useEffect(() => {
 if (audioRef.current) {
 audioRef.current.volume = Math.min(Math.max(volumeLevel / 100, 0), 1);
 }
 }, [volumeLevel]);

 useEffect(() => {
 let analyzer: AnalyserNode;
 let microphone: MediaStreamAudioSourceNode;
 let rafId: number;
 let sharedAudioContext: AudioContext;

 if (stream && stream.getAudioTracks().length > 0) {
 try {
 sharedAudioContext = getSharedAudioContext();
 
 analyzer = sharedAudioContext.createAnalyser();

 microphone = sharedAudioContext.createMediaStreamSource(stream);
 
 // Only connect for analysis, NOT for playback. Playback happens via <audio> tag.
 microphone.connect(analyzer);
 
 analyzer.fftSize = 256;
 const bufferLength = analyzer.frequencyBinCount;
 const dataArray = new Uint8Array(bufferLength);

 let lastVol = 0;
 let lastAnalysisTime = 0;
 const analyzeVoice = (timestamp: number) => {
 const now = timestamp || performance.now();
 if (now - lastAnalysisTime >= 100) {
 lastAnalysisTime = now;
 const tracks = stream.getAudioTracks();
 if (tracks.length > 0 && tracks[0].enabled) {
 analyzer.getByteFrequencyData(dataArray);
 let sum = 0;
 for(let i = 0; i < bufferLength; i++) {
 sum += dataArray[i];
 }
 const avg = sum / bufferLength;
 const currentVol = Math.min(100, Math.round(avg * 2.5));
 
 if (Math.abs(currentVol - lastVol) > 15 || (currentVol === 0 && lastVol !== 0) || (currentVol > 10 && lastVol === 0)) {
 lastVol = currentVol;
 onVolumeChange(currentVol);
 }
 } else if (lastVol !== 0) {
 lastVol = 0;
 onVolumeChange(0);
 }
 }
 rafId = requestAnimationFrame(analyzeVoice);
 };
 rafId = requestAnimationFrame(analyzeVoice);
 } catch (e) {
 console.error("Voice setup failed", e);
 }
 }

 return () => {
 if (rafId) cancelAnimationFrame(rafId);
 try {
 if (microphone) microphone.disconnect();
 if (analyzer) analyzer.disconnect();
 } catch(e) {}
 };
 }, [stream, onVolumeChange]);

 return (
 <audio ref={audioRef} autoPlay playsInline className="hidden" />
 );
}



function ControlButton({ icon, active = false, onClick, className, tooltip }: { icon: React.ReactNode, active?: boolean, onClick?: () => void, className?: string, tooltip?: string }) {
 return (
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
}

function MatchInfoPanel({ isStarting, isMatchStarted, countdown, players, lobby, onCancel, onReopen, isVipLobby, isStreamerLobby }: { 
 isStarting: boolean, 
 isMatchStarted: boolean,
 countdown: number, 
 players: Player[],
 lobby: any,
 onCancel: () => void,
 onReopen: () => void,
 isVipLobby?: boolean,
 isStreamerLobby?: boolean
}) {
 const { language } = useLanguage();
 const isRtl = language === "fa";
 const activePlayers = players.filter(p => !p.id.startsWith("slot-"));
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
 <h3 className="text-xl font-black text-white">{isRtl ? "در حال بازی کردن..." : "In Game..."}</h3>
 <p className="text-xs text-green-500 font-bold flex items-center gap-2">
 <Lock size={12} /> {isRtl ? "لابی قفل شد و امکان ورود نیست." : "Lobby is locked and joining is disabled."}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <div className="px-5 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-500 text-[10px] font-black uppercase ">
 {isRtl ? "مدرج (LOBBY LOCKED)" : "LOCKED"}
 </div>
 <button 
 onClick={onReopen}
 className="px-5 py-2 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase hover:scale-105 transition-transform"
 >
 {isRtl ? "باز کردن لابی" : "Unlock Lobby"}
 </button>
 </div>
 </motion.div>
 ) : isStarting ? (
 <motion.div 
 key="starting"
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: "auto", opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 className={cn(
 "rounded-[28px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden",
 isStreamerLobby ? "bg-purple-500/20 border border-purple-500/40 shadow-[0_20px_50px_rgba(168,85,247,0.1)]" :
 isVipLobby ? "bg-yellow-400/20 border border-yellow-400/40 shadow-[0_20px_50px_rgba(250,204,21,0.1)]" : "bg-neon-blue/20 border border-neon-blue/40 shadow-[0_20px_50px_rgba(0,229,255,0.1)]"
 )}
 >
 <div className="flex items-center gap-4">
 <div className={cn("h-12 w-12 rounded-full border-4 border-t-white animate-spin", isStreamerLobby ? "border-purple-500" : isVipLobby ? "border-yellow-400" : "border-neon-blue")} />
 <div>
 <h3 className="text-xl font-black text-white">{isRtl ? "در حال شروع بازی..." : "Match Starting..."}</h3>
 <p className="text-xs text-neon-blue font-bold">{isRtl ? "بچه‌ها آماده باشید، سرور در حال پیکربندی است." : "Get ready! Configuring room server details."}</p>
 </div>
 </div>
 <div className="flex items-center gap-8">
 <span className="text-6xl font-black text-white tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{countdown}</span>
 <button 
 onClick={onCancel}
 className="text-[10px] font-black text-gray-400 hover:text-white underline uppercase transition-colors"
 >
 {isRtl ? "لغو شروع" : "Cancel"}
 </button>
 </div>
 </motion.div>
 ) : (
 <motion.div 
 key="waiting"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 bg-white/5 py-5 rounded-[28px] border border-white/5"
 >
 <div className="flex items-center gap-4">
 <div className="relative">
 <div className={cn("h-3 w-3 rounded-full animate-pulse", isStreamerLobby ? "bg-purple-500" : isVipLobby ? "bg-yellow-400" : "bg-neon-blue")} />
 <div className={cn("absolute inset-0 h-3 w-3 rounded-full animate-ping", isStreamerLobby ? "bg-purple-500/50" : isVipLobby ? "bg-yellow-400/50" : "bg-neon-blue/50")} />
 </div>
 <span className="text-xs font-black uppercase text-gray-400 ">
 {readyCount === activePlayers.length ? (isRtl ? "همه بازیکنان آماده هستند!" : "All players are ready!") : (isRtl ? `در انتظار بازیکنان... (${readyCount}/${activePlayers.length})` : `In queue... (${readyCount}/${activePlayers.length})`)}
 </span>
 </div>

 <div className="flex flex-wrap items-center gap-6">
 <div className="flex items-center gap-3 border-r border-white/10 pr-6">
 <span className="text-[10px] font-black text-gray-600 uppercase ">REGION</span>
 <span className="text-xs font-black text-neon-pink uppercase">{lobby?.region || "ME"}</span>
 </div>
 
 {/* Dynamic Metadata */}
 {(() => {
 let meta: any = {};
 try { 
 meta = typeof lobby?.metadata === 'string' ? JSON.parse(lobby.metadata || "{}") : (lobby?.metadata || {}); 
 } catch(e) {}
 
 const excludedKeys = [
 'discordRequired', 'ageRestricted', 'autoClose', 'autoArchive',
 'modes', 'maps', 'features', 'slug', 'description', 'imageUrl',
 'genre', 'developer', 'platform'
 ];

 return Object.entries(meta)
 .filter(([key, v]) => !excludedKeys.includes(key) && typeof v !== 'object')
 .map(([key, value]) => (
 <div key={key} className="flex items-center gap-3">
 <span className="text-[10px] font-black text-gray-600 uppercase ">{key}</span>
 <span className="text-xs font-black text-white bg-white/5 px-3 py-1 rounded-lg border border-white/10">{value as string}</span>
 </div>
 ));
 })()}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
};

function DiscordLayoutPlayerCard({ 
 player, volume, isSelected, onSelect, onVolumeChange, onMute, onInvite, onProfile, onDirectMessage, onAddFriend, onKick, onBan, isHostView, isVipLobby, isStreamerLobby
}) {
 const { language } = useLanguage();
 const isRtl = language === "fa";
 const isSlot = player.name === "Empty Slot";
 return (
 <motion.div
 layout
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9 }}
 onClick={!isSlot ? () => onProfile(player.id) : () => onInvite()}
 onContextMenu={(e) => {
 if (!isSlot) {
 e.preventDefault();
 onSelect();
 }
 }}
 className={cn(
 "relative rounded-[16px] border transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col justify-end p-2 md:p-3 items-center text-center aspect-square md:aspect-auto md:h-[180px] w-full",
 isSlot ? "border-dashed border-white/10 bg-transparent opacity-40 hover:opacity-100 items-center justify-center" : "bg-[#0a0a0f] border-white/10 shadow-lg",
 player.isReady && !isSlot ? "ring-1 ring-neon-blue/40 border-neon-blue/30 shadow-[0_10px_20px_-5px_rgba(0,229,255,0.15)]" : "",
 player.isSpeaking && "ring-2 ring-green-500/50"
 )}
 >
 {!isSlot ? (
 <>
 {/* Avatar Area */}
 <div className="absolute inset-0 z-0">
 <SmartImage src={player.avatarUrl || player.avatar} className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity blur-sm scale-110" />
 </div>
 
 <div className="relative z-10 w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden mb-2 border-2 border-white/10">
 <SmartImage src={player.avatarUrl || player.avatar} className="w-full h-full object-cover" />
 </div>

 <div className="relative z-10 w-full bg-black/60 backdrop-blur-md rounded-xl p-1.5 md:p-2 border border-white/10 flex flex-col items-center">
 <span className="text-[10px] md:text-xs font-bold text-white truncate max-w-full">
 {player.name ? (player.name.length > 10 ? player.name.substring(0, 10) + "..." : player.name) : ""}
 </span>
 <div className="flex items-center gap-1 mt-0.5">
 {player.isMuted ? <MicOff size={10} className="text-red-400" /> : <Mic size={10} className="text-gray-400" />}
 <span className="text-[8px] font-mono text-gray-500">{player.ping}ms</span>
 </div>
 </div>

 {isSelected && (
 <div className="absolute inset-0 bg-[#0a0a0f]/95 backdrop-blur-md z-20 flex flex-col p-4 border border-neon-blue/50 rounded-[16px] justify-center items-center shadow-2xl" onClick={e => e.stopPropagation()}>
 
 <div className="w-full flex-1 flex flex-col justify-center gap-6">
 <div className="w-full px-2 space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-gray-400">VOLUME</span>
 <span className="text-[10px] font-bold text-white">{player.volume}%</span>
 </div>
 <input 
 type="range" min="0" max="200" value={player.volume} 
 onChange={(e) => onVolumeChange(parseInt(e.target.value))}
 className="w-full h-1.5 bg-white/10 rounded-lg appearance-none accent-neon-blue"
 />
 </div>

 <div className="flex items-center justify-center gap-2">
 <QuickAction icon={<Users size={14} />} tooltip={isRtl ? "پروفایل" : "Profile"} onClick={() => onProfile(player.id)} />
 <QuickAction icon={<MessageSquare size={14} />} tooltip={isRtl ? "پیام" : "Message"} onClick={() => onDirectMessage(player.id)} />
 <QuickAction icon={player.isMuted ? <Mic size={14} /> : <MicOff size={14} />} tooltip={isRtl ? "صدا" : "Voice"} onClick={() => onMute(player.id)} />
 </div>
 </div>
 </div>
 )}
 </>
 ) : (
 <div className="flex flex-col items-center justify-center h-full text-white/20">
 <UserPlus size={24} className="mb-2" />
 </div>
 )}
 </motion.div>
 )
}

function CompactLayoutPlayerCard({ 
 player, volume, isSelected, onSelect, onVolumeChange, onMute, onInvite, onProfile, onDirectMessage, onAddFriend, onKick, onBan, isHostView, isVipLobby, isStreamerLobby
}) {
 const { language } = useLanguage();
 const isRtl = language === "fa";
 const isSlot = player.name === "Empty Slot";
 return (
 <motion.div
 layout
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9 }}
 onClick={!isSlot ? () => onProfile(player.id) : () => onInvite()}
 onContextMenu={(e) => {
 if (!isSlot) {
 e.preventDefault();
 onSelect();
 }
 }}
 className={cn(
 "relative rounded-[16px] border transition-all duration-300 cursor-pointer overflow-hidden group flex w-full sm:w-[calc(50%-6px)] lg:w-[calc(33.333%-10px)] h-[60px] md:h-[72px] items-center p-2 md:p-3 shrink-0",
 isSlot ? "border-dashed border-white/10 bg-transparent opacity-40 hover:opacity-100" : "bg-[#0a0a0f] border-white/10 hover:bg-[#12121a]",
 player.isReady && !isSlot ? "border-neon-blue/30 shadow-[0_0_15px_rgba(0,229,255,0.1)]" : "",
 player.isSpeaking && "ring-1 ring-green-500/50"
 )}
 >
 {!isSlot ? (
 <>
 <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 mr-3">
 <SmartImage src={player.avatarUrl || player.avatar} className="w-full h-full object-cover" />
 </div>
 <div className="flex-1 min-w-0 pr-2">
 <div className="flex items-center justify-between">
 <span className="text-xs md:text-sm font-bold text-white truncate">
 {player.name ? (player.name.length > 10 ? player.name.substring(0, 10) + "..." : player.name) : ""}
 </span>
 <div className="flex items-center gap-1.5 shrink-0">
 {player.isMuted ? <MicOff size={12} className="text-red-400" /> : <Mic size={12} className="text-green-400" />}
 <span className="text-[9px] font-mono text-gray-500">{player.ping}ms</span>
 </div>
 </div>
 <div className="text-[10px] text-gray-500 truncate mt-0.5">{player.rank}</div>
 </div>

 {isSelected && (
 <div className="absolute inset-0 bg-[#0a0a0f]/95 backdrop-blur-md z-20 flex flex-col justify-center px-4 border border-neon-blue/40 rounded-[16px] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
 {/* Banner Background */}
 {player.bannerUrl && (
   <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `url(${player.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
 )}
 <div className="relative z-10 flex items-center justify-between w-full">
  <div className="flex items-center gap-2 w-[100px]">
  <SmartImage src={player.avatarUrl || player.avatar} className="w-8 h-8 rounded-full border border-white/20 shrink-0" />
  <input 
  type="range" min="0" max="200" value={player.volume} 
  onChange={(e) => onVolumeChange(parseInt(e.target.value))}
  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none accent-neon-blue"
  />
  </div>
  <div className="flex items-center gap-2 shrink-0">
  <QuickAction icon={<Users size={14} />} tooltip={isRtl ? "پروفایل" : "Profile"} onClick={() => onProfile(player.id)} />
  <QuickAction icon={<MessageSquare size={14} />} tooltip={isRtl ? "پیام" : "Message"} onClick={() => onDirectMessage(player.id)} />
  <QuickAction icon={player.isMuted ? <Mic size={14} /> : <MicOff size={14} />} tooltip={isRtl ? "صدا" : "Voice"} onClick={() => onMute(player.id)} />
  </div>
 </div>
 </div>
 )}
 </>
 ) : (
 <div className="flex items-center gap-3 w-full text-white/20">
 <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl border border-dashed border-white/20 flex items-center justify-center">
 <UserPlus size={16} />
 </div>
 <span className="text-xs lowercase font-mono">empty_slot</span>
 </div>
 )}
 </motion.div>
 )
}

const PlayerCard: React.FC<{
 player: Player;
 volume?: number;
 isSelected: boolean;
 onSelect: () => void;
 onVolumeChange: (val: number) => void;
 onMute: (id: string) => void;
 onInvite: () => void;
 onProfile: (id: string) => void;
 onDirectMessage: (id: string) => void;
 onAddFriend: (id: string) => void;
 onKick?: (id: string) => void;
 onBan?: (id: string) => void;
 isHostView?: boolean;
 disabled?: boolean;
 isVipLobby?: boolean;
 isStreamerLobby?: boolean;
 layoutMode?: 'default' | 'compact' | 'discord';
}> = ({
 player, 
 volume,
 isSelected, 
 onSelect, 
 onVolumeChange, 
 onMute, 
 onInvite, 
 onProfile, 
 onDirectMessage, 
 onAddFriend, 
 onKick,
 onBan,
 isHostView,
 disabled,
 isVipLobby,
 isStreamerLobby,
 layoutMode = 'default'
}) => {
 const isSlot = player.name === "Empty Slot";
 const { user } = useAuth();
 const isMe = user?.id === player.id;
 const { language } = useLanguage();
 const isRtl = language === "fa";

 if (layoutMode === 'discord') {
 return <DiscordLayoutPlayerCard player={player} isSelected={isSelected} onSelect={onSelect} onInvite={onInvite} isVipLobby={isVipLobby} isStreamerLobby={isStreamerLobby} volume={volume} onVolumeChange={onVolumeChange} onMute={onMute} onProfile={onProfile} onDirectMessage={onDirectMessage} onAddFriend={onAddFriend} onKick={onKick} onBan={onBan} isHostView={isHostView} />
 }

 if (layoutMode === 'compact') {
 return <CompactLayoutPlayerCard player={player} isSelected={isSelected} onSelect={onSelect} onInvite={onInvite} isVipLobby={isVipLobby} isStreamerLobby={isStreamerLobby} volume={volume} onVolumeChange={onVolumeChange} onMute={onMute} onProfile={onProfile} onDirectMessage={onDirectMessage} onAddFriend={onAddFriend} onKick={onKick} onBan={onBan} isHostView={isHostView} />
 }

 return (
 <motion.div
 layout
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9 }}
 whileHover={!isSlot ? { y: -8, transition: { duration: 0.2 } } : {}}
 onClick={!isSlot ? () => onProfile(player.id) : () => onInvite()}
 onContextMenu={(e) => {
 if (!isSlot) {
 e.preventDefault();
 onSelect();
 }
 }}
 className={cn(
 "relative p-3 md:p-6 rounded-[24px] md:rounded-[32px] border transition-all duration-300 backdrop-blur-md cursor-pointer group flex flex-col justify-between min-h-[220px] md:min-h-[360px] w-full sm:w-[calc(50%-6px)] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-10px)] xl:w-[calc(25%-18px)] shrink-0 grow min-w-[140px] sm:min-w-[220px] md:min-w-[245px]",
 isSlot ? "border-dashed border-white/10 bg-transparent opacity-40 hover:opacity-100" : "bg-[#0a0a0f] border-white/10 shadow-2xl overflow-hidden",
 player.isReady && !isSlot && (
 isStreamerLobby ? "scale-[1.02] ring-1 ring-purple-500/40 border-purple-500/30 shadow-[0_20px_40px_-5px_rgba(168,85,247,0.15)] bg-gradient-to-b from-[#0a0a0f] to-purple-900/10" :
 isVipLobby ? "scale-[1.02] ring-1 ring-yellow-400/40 border-yellow-400/30 shadow-[0_20px_40px_-5px_rgba(250,204,21,0.15)] bg-gradient-to-b from-[#0a0a0f] to-yellow-900/10" : "scale-[1.02] ring-1 ring-neon-blue/40 border-neon-blue/30 shadow-[0_20px_40px_-5px_rgba(0,229,255,0.15)]"
 ),
 (isVipLobby || isStreamerLobby) && !isSlot && (isStreamerLobby ? "border-purple-500/20 hover:border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.05)] bg-purple-500/5 bg-blend-soft-light" : "border-yellow-400/20 hover:border-yellow-400/40 shadow-[0_0_20px_rgba(250,204,21,0.05)] bg-yellow-400/5 bg-blend-soft-light"),
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
 <span className="text-[7px] md:text-[9px] font-black text-gray-500 uppercase truncate max-w-[50px] md:max-w-none">{player.rank}</span>
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
 className={isStreamerLobby ? "text-purple-500" : isVipLobby ? "text-yellow-400" : "text-neon-blue"}
 style={{ strokeDasharray: "290" }}
 initial={{ strokeDashoffset: 290 }}
 animate={{ strokeDashoffset: 290 - (290 * (player.activity || 0)) / 100 }}
 transition={{ type: "spring", bounce: 0, damping: 20 }}
 />
 </svg>

 <div 
 className={cn(
 "h-10 w-10 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-[18px] md:rounded-[28px] flex items-center justify-center text-xl md:text-3xl relative z-10 transition-all duration-500 shadow-2xl cursor-pointer hover:scale-110 hover:ring-2",
 isStreamerLobby ? "hover:ring-purple-500/50" : isVipLobby ? "hover:ring-yellow-400/50" : "hover:ring-neon-blue/50",
 player.isReady ? "bg-white/10" : "bg-white/5",
 player.isSpeaking ? "scale-105" : ""
 )}
 onClick={(e) => {
 e.stopPropagation();
 onProfile(player.id);
 }}
 >
 <div className="relative z-10 h-full w-full flex items-center justify-center overflow-hidden rounded-[18px] md:rounded-[28px]">
 <SmartImage 
 src={player.avatarUrl || ""}
 className="w-full h-full object-cover"
 alt={player.name}
 />
 </div>
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
 className={cn(
 "absolute -bottom-1 -left-1 md:-bottom-2 md:-left-2 h-6 w-6 md:h-8 md:w-8 rounded-lg md:rounded-2xl border-2 md:border-4 border-[#0a0a0f] flex items-center justify-center shadow-lg z-20",
 isVipLobby ? "bg-yellow-400" : "bg-neon-blue"
 )}
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

 <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-2 max-w-full">
 <h3 className="text-xs md:text-xl font-black text-white truncate flex items-center gap-1.5">
 {player.role === "STREAMER" && (
 <CheckCircle2 size={18} className="text-white fill-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
 )}
 {player.membership === "VIP" && player.role !== "STREAMER" && (
 <Crown size={16} className="text-yellow-500 fill-yellow-500 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
 )}
 {player.name ? (player.name.length > 10 ? player.name.substring(0, 10) + "..." : player.name) : ""}
 {player.isVerified && player.role !== "STREAMER" && (
 <CheckCircle2 size={14} className="text-neon-blue" fill="currentColor" />
 )}
 </h3>
 <UserBadges badges={player.badges || []} />
 </div>
 
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
 <span className="text-[6px] md:text-[8px] font-black text-gray-700 uppercase ">Volume</span>
 <span className="text-[9px] font-bold text-white">{player.volume}%</span>
 </div>
 <input 
 type="range" 
 min="0" max="200" 
 value={player.volume} 
 onChange={(e) => onVolumeChange(parseInt(e.target.value))}
 onClick={(e) => e.stopPropagation()}
 className={cn("w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer", isVipLobby ? "accent-yellow-400" : "accent-neon-blue")}
 />
 </div>

 <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-1 flex items-center justify-between shadow-xl" onClick={(e) => e.stopPropagation()}>
 <QuickAction icon={<Users size={14} />} tooltip={isRtl ? "پروفایل" : "Profile"} onClick={() => onProfile(player.id)} />
 <QuickAction icon={<MessageSquare size={14} />} tooltip={isRtl ? "پیام" : "Message"} onClick={() => onDirectMessage(player.id)} />
 <QuickAction icon={<UserPlus size={14} />} tooltip={isRtl ? "افزودن" : "Add Friend"} onClick={() => onAddFriend(player.id)} />
 <QuickAction 
 icon={player.isMuted ? <Mic size={14} /> : <MicOff size={14} />} 
 tooltip={player.isMuted ? (isRtl ? "آن‌میوت" : "Unmute") : (isRtl ? "میوت" : "Mute")} 
 onClick={() => onMute(player.id)}
 color={player.isMuted ? "blue" : "pink"}
 />
 {isHostView && !isMe && (
 <>
 <QuickAction 
 icon={<ShieldAlert size={14} />} 
 tooltip={isRtl ? "اخراج" : "Kick"} 
 onClick={() => onKick?.(player.id)}
 color="pink"
 />
 <QuickAction 
 icon={<Gavel size={14} />} 
 tooltip={isRtl ? "مسدود سازی" : "Ban"} 
 onClick={() => onBan?.(player.id)}
 color="pink"
 />
 </>
 )}
 </div>
 </div>

 {player.isHost && (
 <div className={cn(
 "absolute top-8 left-8 h-8 w-8 rounded-2xl border flex items-center justify-center shadow-lg",
 isVipLobby 
 ? "bg-yellow-400/10 border-yellow-400/20 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]"
 : "bg-neon-pink/10 border-neon-pink/20 text-neon-pink shadow-[0_0_15px_rgba(255,69,143,0.2)]"
 )}>
 <Crown size={14} />
 </div>
 )}
 </>
 ) : (
 <div className="h-full flex flex-col items-center justify-center py-6 min-h-[300px]">
 <div className="h-20 w-20 rounded-[32px] border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 mb-6 group-hover:border-white/30 transition-all duration-300 group-hover:scale-110">
 <UserPlus size={40} />
 </div>
 <span className="text-[11px] font-black uppercase text-gray-600 group-hover:text-white transition-colors">
 {isRtl ? "دعوت بازیکن" : "Invite Player"}
 </span>
 </div>
 )}
 </motion.div>
 );
};

function QuickAction({ icon, tooltip, color = "blue", onClick }: { icon: React.ReactNode, tooltip: string, color?: "blue" | "pink", onClick?: () => void }) {
 return (
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
}

function PingChart({ ping }: { ping: number }) {
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

function ChatPanel({ messages, players, inputMessage, setInputMessage, onSend, onClose, currentUserId, isVipLobby, isStreamerLobby }: { 
 messages: Message[], 
 players: Player[],
 inputMessage: string, 
 setInputMessage: React.Dispatch<React.SetStateAction<string>>,
 onSend: (e: React.FormEvent) => void,
 onClose?: () => void,
 currentUserId?: string,
 isVipLobby?: boolean,
 isStreamerLobby?: boolean
}) {
 const { language } = useLanguage();
 const isRtl = language === "fa";
 const filteredMessages = messages.filter(msg => !msg.toUserId || msg.isSystem);
 const scrollRef = useRef<HTMLDivElement>(null);
 
 const [contextMenu, setContextMenu] = useState<{ id: string, x: number, y: number } | null>(null);

 useEffect(() => {
 if (scrollRef.current) {
 scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
 }
 }, [filteredMessages.length]);
 
 useEffect(() => {
 const handleGlobalClick = () => setContextMenu(null);
 window.addEventListener('click', handleGlobalClick);
 return () => window.removeEventListener('click', handleGlobalClick);
 }, []);

 const handleContextMenu = (e: React.MouseEvent, msgId: string) => {
 e.preventDefault();
 setContextMenu({ id: msgId, x: e.clientX, y: e.clientY });
 };

 return (
 <div className="flex-1 flex flex-col h-full bg-[#0d0d14]/40 backdrop-blur-xl border-l md:border-r border-white/5">
 <div className="flex flex-col">
 <div className="p-6 border-b border-white/5 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="h-2 w-2 rounded-full bg-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.8)]" />
 <h2 className="text-xs font-black uppercase text-white">Lobby Comms</h2>
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
 const sender = players.find(p => p.id === msg.fromUserId);
 const isVIP = sender?.membership === "VIP" || msg.badges?.includes("VIP");
 const isPLUS = sender?.membership === "PLUS" || msg.badges?.includes("PLUS");
 const isStreamer = sender?.role === "STREAMER" || msg.badges?.includes("STREAMER");
 
 return (
 <div key={`${msg.id}-${index}`} className={cn(
 "group flex flex-col gap-1.5", 
 msg.isSystem ? "items-center my-4" : isYou ? "items-start" : "items-end"
 )}>
 {msg.isSystem ? (
 <div className={cn(
 "relative w-full flex items-center justify-center p-3 rounded-2xl border", 
 isStreamerLobby ? "border-purple-500/20 bg-purple-500/[0.02]" :
 isVipLobby ? "border-yellow-400/20 bg-yellow-400/[0.02]" : "border-neon-blue/10 bg-neon-blue/[0.02]"
 )}>
 <span className={cn("text-[10px] font-black uppercase text-center px-4", isStreamerLobby ? "text-purple-400" : isVipLobby ? "text-yellow-400" : "text-neon-blue")}>
 {msg.text}
 </span>
 </div>
 ) : (
 <div 
 className={cn(
 "flex items-start gap-3 max-w-[95%] sm:max-w-[85%]",
 isYou ? "flex-row" : "flex-row-reverse"
 )}
 onContextMenu={(e) => handleContextMenu(e, msg.id || `${index}`)}
 >
 <div className="h-8 w-8 rounded-xl bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center text-lg mt-1 font-black uppercase overflow-hidden">
 <SmartImage 
 src={msg.avatarUrl || ""}
 className="w-full h-full object-cover"
 alt={msg.user}
 />
 </div>
 <div className={cn("flex-1 space-y-1", isYou ? "text-right" : "text-left")}>
 <div className={cn("flex items-center gap-2 md:gap-3", isYou ? "flex-row" : "flex-row-reverse")}>
 <div className="flex items-center gap-1.5 min-w-0">
 <span className={cn(
 "text-[10px] font-black uppercase truncate max-w-[120px] flex items-center gap-1",
 isYou ? "text-neon-pink" : "text-neon-blue"
 )}>
 {isStreamer && <CheckCircle2 className="w-[14px] h-[14px] shrink-0 fill-purple-500 text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />}
 {isVIP && !isStreamer && <Crown className="w-[14px] h-[14px] shrink-0 fill-yellow-500 text-yellow-500 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />}
 {msg.user}
 </span>
 <UserBadges badges={msg.badges || []} className={cn(isYou ? "flex-row" : "flex-row-reverse")} />
 </div>
 <span className="text-[8px] font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">{msg.time}</span>
 </div>
 <div className={cn(
 "relative overflow-hidden border rounded-2xl px-4 py-2.5 text-xs text-gray-300 leading-relaxed shadow-lg",
 isYou ? "bg-neon-pink/5 rounded-tr-none border-neon-pink/10" : "bg-white/5 rounded-tl-none border-white/10",
 isVIP && !isStreamer && "border-yellow-400/40 bg-gradient-to-br from-yellow-400/[0.12] to-transparent shadow-[0_0_40px_rgba(250,204,21,0.12)]",
 isPLUS && !isStreamer && "border-neon-blue/40 bg-gradient-to-br from-neon-blue/[0.12] to-transparent shadow-[0_0_30px_rgba(0,229,255,0.12)]",
 isStreamer && "border-purple-500/50 bg-gradient-to-br from-purple-500/[0.15] to-transparent shadow-[0_0_20px_rgba(168,85,247,0.3)]"
 )}>
 {/* VIP/PLUS/STREAMER Shimmer Effect */}
 {(isVIP || isPLUS || isStreamer) && (
 <motion.div 
 animate={{ x: ["-100%", "200%"] }}
 transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
 className={cn(
 "absolute inset-0 skew-x-12 pointer-events-none z-0 mix-blend-overlay",
 isStreamer ? "bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" :
 isVIP ? "bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" : "bg-gradient-to-r from-transparent via-neon-blue/40 to-transparent"
 )}
 />
 )}
 <span className="relative z-10">{msg.text}</span>
 </div>
 </div>
 </div>
 )}
 </div>
 )})}
 </div>

 <AnimatePresence>
 {contextMenu && (
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 transition={{ duration: 0.1 }}
 className="fixed z-[9999] w-48 bg-[#0a0a0f] border border-white/10 rounded-xl shadow-2xl py-1 overflow-hidden"
 style={{ 
 top: contextMenu.y, 
 left: contextMenu.x,
 }}
 >
 <button
 onClick={() => {
 const message = messages.find(m => (m.id || m.id) === contextMenu.id);
 if (message?.text) {
 navigator.clipboard.writeText(message.text);
 toast.success(isRtl ? "متن پیام کپی شد!" : "Message copied!");
 }
 }}
 className={cn("w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors group", isRtl ? "justify-end text-right" : "justify-start text-left")}
 >
 {isRtl ? (
 <>
 کپی متن
 <Copy size={14} className="text-gray-500 group-hover:text-white transition-colors" />
 </>
 ) : (
 <>
 <Copy size={14} className="text-gray-500 group-hover:text-white transition-colors" />
 Copy TEXT
 </>
 )}
 </button>
 <button
 onClick={() => {
 const message = messages.find(m => (m.id || m.id) === contextMenu.id);
 if (message) {
 setInputMessage((prev: string) => isRtl ? `در پاسخ به ${message.user}:\n${prev}` : `In reply to ${message.user}:\n${prev}`);
 }
 }}
 className={cn("w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-3 transition-colors group", isRtl ? "justify-end text-right" : "justify-start text-left")}
 >
 {isRtl ? (
 <>
 پاسخ دادن
 <Reply size={14} className="text-gray-500 group-hover:text-white transition-colors" />
 </>
 ) : (
 <>
 <Reply size={14} className="text-gray-500 group-hover:text-white transition-colors" />
 Reply
 </>
 )}
 </button>
 </motion.div>
 )}
 </AnimatePresence>

 <form onSubmit={onSend} className="p-4 md:p-6 pb-6 bg-black/20 border-t border-white/5">
 <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-1 pr-4 focus-within:border-neon-blue/50 transition-all relative">
 <input
 type="text"
 value={inputMessage}
 onChange={(e) => setInputMessage(e.target.value)}
 placeholder={isRtl ? "چیزی بنویسید..." : "Type message..."}
 className="flex-1 bg-transparent py-4 text-xs text-white placeholder:text-gray-700 focus:outline-none font-medium pr-2"
 />
 <button 
 type="submit"
 className={cn(
 "h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl text-dark-bg transition-colors shadow-lg",
 isStreamerLobby ? "bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/20" :
 isVipLobby ? "bg-yellow-400 hover:bg-yellow-400/90 shadow-yellow-400/20" : "bg-neon-blue hover:bg-neon-blue/90 shadow-neon-blue/20"
 )}
 >
 <Send size={18} className="translate-y-[1px] translate-x-[1px]" />
 </button>
 </div>
 </form>
 </div>
 );
};
