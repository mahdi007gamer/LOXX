import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { lobbySocket, chatSocket, voiceSocket, mainPlatformVoiceSocket, presenceSocket, getSharedAudioContext, resumeSharedAudioContext } from "../lib/socket";
import { toast } from "react-hot-toast";
import { MicVAD } from "@ricky0123/vad-web";
import { useAuth } from "./AuthContext";
import { useWebRTC } from "../hooks/useWebRTC";
import { RemoteAudioPlayer } from "../components/voice/RemoteAudioPlayer";

export type LobbyStatus = "WAITING" | "READY" | "STARTING" | "IN_PROGRESS" | "FINISHED";

interface LobbyMember {
 userId: string;
 username: string;
 role: "HOST" | "PLAYER";
 isReady: boolean;
 micMuted?: boolean;
 avatarUrl?: string;
 bannerUrl?: string;
 level?: number;
 membership?: string;
 vipMetadata?: any;
 badges?: any[];
}

export interface ChatMessage {
 id: string;
 from: {
 userId: string;
 username: string;
 membership: string;
 avatarUrl?: string;
 bannerUrl?: string;
 level?: number;
 vipMetadata?: any;
 badges?: any[];
 };
 content: string;
 createdAt: number;
 targetType?: string;
 targetId?: string;
}

interface LobbyState {
 id: string | null;
 title?: string;
 gameId: string | null;
 gameTitle: string;
 players: LobbyMember[];
 maxPlayers: number;
 status: LobbyStatus;
 hostId: string | null;
 messages: ChatMessage[];
 talkingUsers: string[]; // List of user IDs currently talking
 countdown?: number;
 isMuted?: boolean;
 mode?: string;
 selectedMaps?: string;
 description?: string;
 micRequired?: boolean;
 isPrivate?: boolean;
}

interface LobbyContextType {
 lobby: LobbyState | null;
 joinLobby: (lobbyId: string) => void;
 leaveLobby: () => void;
 toggleReady: () => void;
 setLobbyMuted: (muted: boolean) => void;
 setBotStream: (stream: MediaStream | null) => void;
 sendMessage: (content: string) => void;
 updateLobbySettings: (settings: { isPrivate?: boolean, micRequired?: boolean }) => void;
 kickPlayer: (userId: string) => void;
 banPlayer: (userId: string) => void;
 isJoining: string | null;
 joinError: string | null;
 peerPings: Record<string, number>;

 // Voice states & functions
 localStream: MediaStream | null;
 voiceMode: "activation" | "ptt";
 setVoiceMode: (mode: "activation" | "ptt") => void;
 pttKey: string;
 setPttKey: (key: string) => void;
 isPttPressed: boolean;
 setIsPttPressed: (pressed: boolean) => void;
 isAudioContextResumed: boolean;
 resumeAudio: () => Promise<void>;
 peerVolumes: Record<string, number>;
 peerActivity: Record<string, number>;
 setPeerVolume: (userId: string, volume: number) => void;
 localVolume: number;
 isDeafened: boolean;
 setIsDeafened: (val: boolean) => void;
 micSensitivity: number;
 setMicSensitivity: (val: number) => void;
 micOpenDelay: number;
 setMicOpenDelay: (val: number) => void;
 micCloseDelay: number;
 setMicCloseDelay: (val: number) => void;
 noiseCanceling: boolean;
 setNoiseCanceling: (val: boolean) => void;
 isMicTestOn: boolean;
 setIsMicTestOn: (val: boolean) => void;

 // Overlay Settings
 overlayEnabled: boolean;
 setOverlayEnabled: (val: boolean) => void;
 overlayPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
 setOverlayPosition: (val: "top-left" | "top-right" | "bottom-left" | "bottom-right") => void;
 overlaySize: "small" | "medium" | "large";
 setOverlaySize: (val: "small" | "medium" | "large") => void;
 overlayOnlyTalking: boolean;
 setOverlayOnlyTalking: (val: boolean) => void;
 overlayToastPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
 setOverlayToastPosition: (val: "top-left" | "top-right" | "bottom-left" | "bottom-right") => void;
 overlayToastXOffset: number;
 setOverlayToastXOffset: (val: number) => void;
 overlayToastYOffset: number;
 setOverlayToastYOffset: (val: number) => void;
 overlayMembersVisible: boolean;
 setOverlayMembersVisible: (val: boolean) => void;
 overlayNormalOpacity: number;
 setOverlayNormalOpacity: (val: number) => void;
 overlaySpeakingOpacity: number;
 setOverlaySpeakingOpacity: (val: number) => void;

 // Electron Launcher Specific Settings
 isElectron: boolean;
 launcherCloseToTray: boolean;
 launcherStartAtLogin: boolean;
 launcherHardwareAcceleration: boolean;
 launcherGlobalPttKey: string;
 launcherGlobalMuteKey: string;
  bypassSystemProxy: boolean;
  appDnsProvider: "system" | "cloudflare" | "google" | "electro" | "shecan";
  launcherThrottleGameMode: boolean;
 updateLauncherSettings: (settings: { voiceMode?: "activation" | "ptt";
 closeToTray?: boolean;
 startAtLogin?: boolean;
 hardwareAcceleration?: boolean;
 globalPttKey?: string;
 globalMuteKey?: string;
 overlayX?: number;
 overlayY?: number;
 overlayWidth?: number;
 overlayHeight?: number;
 overlayOpacity?: number;
 overlayClickThrough?: boolean;
 bypassSystemProxy?: boolean;
 appDnsProvider?: "system" | "cloudflare" | "google" | "electro" | "shecan";
 }) => void;

 // New Desktop Features
 audioInputDevices: MediaDeviceInfo[];
 audioOutputDevices: MediaDeviceInfo[];
 selectedAudioInput: string;
 setSelectedAudioInput: (deviceId: string) => void;
 selectedAudioOutput: string;
 setSelectedAudioOutput: (deviceId: string) => void;
 refreshAudioDevices: () => Promise<void>;
 
 transparentOverlayEnabled: boolean;
 setTransparentOverlayEnabled: (val: boolean) => void;
 overlayX: number;
 overlayY: number;
 overlayWidth: number;
 overlayHeight: number;
 overlayOpacity: number;
 overlayClickThrough: boolean;
 gameDetected: string | null;
 launcherRichPresenceEnabled: boolean;
 setLauncherRichPresenceEnabled: (val: boolean) => void;
 remoteStreams: Map<string, MediaStream>;
	isMediasoupSFU: boolean;
 setScreenStreamForWebRTC: (stream: MediaStream | null) => void;
 musicBotState: any;
 toggleMusicBot: (active: boolean, botType?: "music" | "melody") => void;
 controlMusicBot: (action: "play" | "pause" | "update-queue" | "seek", params?: any) => void;
 musicVolumeSilence: number;
 setMusicVolumeSilence: (val: number) => void;
 musicVolumeTalking: number;
 setMusicVolumeTalking: (val: number) => void;
  localMusicAudioRef: React.RefObject<HTMLAudioElement | null>;
  localMusicDuration: number;
  setLocalMusicDuration: React.Dispatch<React.SetStateAction<number>>;
  localMusicCurrentTime: number;
  setLocalMusicCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  isDucking: boolean;
}

const LobbyContext = createContext<LobbyContextType | undefined>(undefined);

export const LobbyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const [lobby, setLobby] = useState<LobbyState | null>(null);
 const { user } = useAuth();
 
 // Voice integration states
 const [localStream, setLocalStream] = useState<MediaStream | null>(null);
 const [isLocalSpeaking, setIsLocalSpeaking] = useState<boolean>(false);
 const rawLocalStreamRef = useRef<MediaStream | null>(null);
 const [botStream, setBotStream] = useState<MediaStream | null>(null);
 const [screenStream, setScreenStreamForWebRTCState] = useState<MediaStream | null>(null);
 const localStreamRef = useRef<MediaStream | null>(null);
 const [voiceMode, setVoiceMode] = useState<"activation" | "ptt">("activation");
 const [pttKey, setPttKey] = useState<string>("v");
 const [isPttPressed, setIsPttPressed] = useState<boolean>(false);
 const [isAudioContextResumed, setIsAudioContextResumed] = useState<boolean>(true);
 const [peerVolumes, setPeerVolumes] = useState<Record<string, number>>({});
 const [peerActivity, setPeerActivity] = useState<Record<string, number>>({});
 const [peerPings, setPeerPings] = useState<Record<string, number>>({});
 const [localVolume, setLocalVolume] = useState<number>(0);

 // Overlay state definitions synced to localStorage
 const [overlayEnabled, setOverlayEnabled] = useState<boolean>(() => {
 if (typeof window !== "undefined") {
 const val = localStorage.getItem("loxx_overlay_enabled");
 return val !== null ? val === "true" : true;
 }
 return true;
 });
 const [overlayPosition, setOverlayPosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right">(() => {
 if (typeof window !== "undefined") {
 return (localStorage.getItem("loxx_overlay_position") as any) || "top-left";
 }
 return "top-left";
 });
 const [overlaySize, setOverlaySize] = useState<"small" | "medium" | "large">(() => {
 if (typeof window !== "undefined") {
 return (localStorage.getItem("loxx_overlay_size") as any) || "medium";
 }
 return "medium";
 });
 const [overlayOnlyTalking, setOverlayOnlyTalking] = useState<boolean>(() => {
 if (typeof window !== "undefined") {
 const val = localStorage.getItem("loxx_overlay_only_talking");
 return val !== null ? val === "true" : false;
 }
 return false;
 });

 const [overlayToastPosition, setOverlayToastPosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right">(() => {
 if (typeof window !== "undefined") {
 return (localStorage.getItem("loxx_overlay_toast_position") as any) || "bottom-right";
 }
 return "bottom-right";
 });

 const [overlayToastXOffset, setOverlayToastXOffset] = useState<number>(() => {
 if (typeof window !== "undefined") {
 const val = localStorage.getItem("loxx_overlay_toast_x_offset");
 return val !== null ? parseInt(val, 10) : 40;
 }
 return 40;
 });

 const [overlayToastYOffset, setOverlayToastYOffset] = useState<number>(() => {
 if (typeof window !== "undefined") {
 const val = localStorage.getItem("loxx_overlay_toast_y_offset");
 return val !== null ? parseInt(val, 10) : 40;
 }
 return 40;
 });

 const [overlayMembersVisible, setOverlayMembersVisible] = useState<boolean>(() => {
 if (typeof window !== "undefined") {
 const val = localStorage.getItem("loxx_overlay_members_visible");
 return val !== null ? val === "true" : true;
 }
 return true;
 });

 const [overlayNormalOpacity, setOverlayNormalOpacity] = useState<number>(() => {
 if (typeof window !== "undefined") {
 const val = localStorage.getItem("loxx_overlay_normal_opacity");
 return val !== null ? parseFloat(val) : 0.75;
 }
 return 0.75;
 });

 const [overlaySpeakingOpacity, setOverlaySpeakingOpacity] = useState<number>(() => {
 if (typeof window !== "undefined") {
 const val = localStorage.getItem("loxx_overlay_speaking_opacity");
 return val !== null ? parseFloat(val) : 1.0;
 }
 return 1.0;
 });

 useEffect(() => {
 localStorage.setItem("loxx_overlay_members_visible", String(overlayMembersVisible));
 }, [overlayMembersVisible]);

 useEffect(() => {
 localStorage.setItem("loxx_overlay_normal_opacity", String(overlayNormalOpacity));
 }, [overlayNormalOpacity]);

 useEffect(() => {
 localStorage.setItem("loxx_overlay_speaking_opacity", String(overlaySpeakingOpacity));
 }, [overlaySpeakingOpacity]);

 // Sync state changes to localStorage
 useEffect(() => {
 localStorage.setItem("loxx_overlay_enabled", String(overlayEnabled));
 }, [overlayEnabled]);

 useEffect(() => {
 localStorage.setItem("loxx_overlay_position", overlayPosition);
 }, [overlayPosition]);

 useEffect(() => {
 localStorage.setItem("loxx_overlay_size", overlaySize);
 }, [overlaySize]);

 useEffect(() => {
 localStorage.setItem("loxx_overlay_only_talking", String(overlayOnlyTalking));
 }, [overlayOnlyTalking]);

 useEffect(() => {
 localStorage.setItem("loxx_overlay_toast_position", overlayToastPosition);
 }, [overlayToastPosition]);

 useEffect(() => {
 localStorage.setItem("loxx_overlay_toast_x_offset", String(overlayToastXOffset));
 }, [overlayToastXOffset]);

 useEffect(() => {
 localStorage.setItem("loxx_overlay_toast_y_offset", String(overlayToastYOffset));
 }, [overlayToastYOffset]);

 // Use refs to track latest state for socket listeners
 const lobbyRef = useRef<LobbyState | null>(null);
 const userRef = useRef<any>(null);

 const [isDeafened, setIsDeafened] = useState(false);

 useEffect(() => {
 lobbyRef.current = lobby;
 }, [lobby]);

 useEffect(() => {
 userRef.current = user;
 }, [user]);

 // Electron Specific States & Global Listeners
 const [isElectron, setIsElectron] = useState<boolean>(false);
 const [launcherCloseToTray, setLauncherCloseToTray] = useState<boolean>(true);
 const [launcherStartAtLogin, setLauncherStartAtLogin] = useState<boolean>(false);
 const [launcherHardwareAcceleration, setLauncherHardwareAcceleration] = useState<boolean>(true);
 const [launcherThrottleGameMode, setLauncherThrottleGameMode] = useState<boolean>(true);
 const throttleGameModeRef = useRef<boolean>(true);
 useEffect(() => {
   throttleGameModeRef.current = launcherThrottleGameMode;
 }, [launcherThrottleGameMode]);
 const [launcherGlobalPttKey, setLauncherGlobalPttKey] = useState<string>("CommandOrControl+Alt+V");
 const [launcherGlobalMuteKey, setLauncherGlobalMuteKey] = useState<string>("=");
  const [bypassSystemProxy, setBypassSystemProxy] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("loxx_bypass_system_proxy") === "true";
    }
    return false;
  });
  const [appDnsProvider, setAppDnsProvider] = useState<"system" | "cloudflare" | "google" | "electro" | "shecan">(rawDnsVal => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("loxx_app_dns_provider") as any) || "system";
    }
    return "system";
  });

 // New Desktop Features States
 const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
 const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
 const [selectedAudioInput, setSelectedAudioInput] = useState<string>(() => {
 if (typeof window !== "undefined") {
 return localStorage.getItem("loxx_selected_audio_input") || "default";
 }
 return "default";
 });
 const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>(() => {
 if (typeof window !== "undefined") {
 return localStorage.getItem("loxx_selected_audio_output") || "default";
 }
 return "default";
 });

  const [transparentOverlayEnabled, setTransparentOverlayEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("loxx_transparent_overlay");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });

 const [overlayX, setOverlayX] = useState<number>(24);
 const [overlayY, setOverlayY] = useState<number>(80);
 const [overlayWidth, setOverlayWidth] = useState<number>(300);
 const [overlayHeight, setOverlayHeight] = useState<number>(500);
 const [overlayOpacity, setOverlayOpacity] = useState<number>(0.9);
 const [overlayClickThrough, setOverlayClickThrough] = useState<boolean>(true);

 const [gameDetected, setGameDetected] = useState<string | null>(null);

 const [micSensitivity, setMicSensitivityState] = useState<number>(() => {
  if (typeof window !== "undefined") {
   const saved = localStorage.getItem("loxx_mic_sensitivity");
   return saved ? parseInt(saved, 10) : 8;
  }
  return 8;
 });

 const [micOpenDelay, setMicOpenDelayState] = useState<number>(() => {
  if (typeof window !== "undefined") {
   const saved = localStorage.getItem("loxx_mic_open_delay");
   return saved ? parseInt(saved, 10) : 0;
  }
  return 0;
 });

 const [micCloseDelay, setMicCloseDelayState] = useState<number>(() => {
  if (typeof window !== "undefined") {
   const saved = localStorage.getItem("loxx_mic_close_delay");
   return saved ? parseInt(saved, 10) : 300;
  }
  return 300;
 });

 const [noiseCanceling, setNoiseCancelingState] = useState<boolean>(() => {
  if (typeof window !== "undefined") {
   const saved = localStorage.getItem("loxx_noise_canceling");
   return saved !== "false";
  }
  return true;
 });

 const [isMicTestOn, setIsMicTestOn] = useState<boolean>(false);

  const localMusicAudioRef = useRef<HTMLAudioElement | null>(null);
  const [localMusicDuration, setLocalMusicDuration] = useState<number>(0);
  const [localMusicCurrentTime, setLocalMusicCurrentTime] = useState<number>(0);
  const [isDucking, setIsDucking] = useState<boolean>(false);

 const [musicBotState, setMusicBotState] = useState<any>(null);

 const [musicVolumeSilence, setMusicVolumeSilenceState] = useState<number>(() => {
  if (typeof window !== "undefined") {
   const saved = localStorage.getItem("loxx_music_vol_silence");
   return saved ? parseInt(saved, 10) : 80;
  }
  return 80;
 });

 const [musicVolumeTalking, setMusicVolumeTalkingState] = useState<number>(() => {
  if (typeof window !== "undefined") {
   const saved = localStorage.getItem("loxx_music_vol_talking");
   return saved ? parseInt(saved, 10) : 5;
  }
  return 5;
 });

 const setMusicVolumeSilence = (val: number) => {
  setMusicVolumeSilenceState(val);
  localStorage.setItem("loxx_music_vol_silence", val.toString());
 };

 const setMusicVolumeTalking = (val: number) => {
  setMusicVolumeTalkingState(val);
  localStorage.setItem("loxx_music_vol_talking", val.toString());
 };

 const micSensitivityRef = React.useRef(micSensitivity);
 const micOpenDelayRef = React.useRef(micOpenDelay);
 const micCloseDelayRef = React.useRef(micCloseDelay);

 React.useEffect(() => { micSensitivityRef.current = micSensitivity; }, [micSensitivity]);
 React.useEffect(() => { micOpenDelayRef.current = micOpenDelay; }, [micOpenDelay]);
 React.useEffect(() => { micCloseDelayRef.current = micCloseDelay; }, [micCloseDelay]);

 const setNoiseCanceling = (val: boolean) => {
  setNoiseCancelingState(val);
  localStorage.setItem("loxx_noise_canceling", val.toString());
 };

 const setMicSensitivity = (val: number) => {
  setMicSensitivityState(val);
  localStorage.setItem("loxx_mic_sensitivity", val.toString());
 };

 const setMicOpenDelay = (val: number) => {
  setMicOpenDelayState(val);
  localStorage.setItem("loxx_mic_open_delay", val.toString());
 };

 const setMicCloseDelay = (val: number) => {
  setMicCloseDelayState(val);
  localStorage.setItem("loxx_mic_close_delay", val.toString());
 };
 const [launcherRichPresenceEnabled, setLauncherRichPresenceEnabled] = useState<boolean>(() => {
 if (typeof window !== "undefined") {
 return localStorage.getItem("loxx_rich_presence_enabled") !== "false";
 }
 return true;
 });

 const refreshAudioDevices = useCallback(async () => {
 try {
 if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
 const devices = await navigator.mediaDevices.enumerateDevices();
 const inputs = devices.filter(d => d.kind === "audioinput");
 const outputs = devices.filter(d => d.kind === "audiooutput");
 setAudioInputDevices(inputs);
 setAudioOutputDevices(outputs);
 }
 } catch (e) {
 console.error("Failed to enumerate audio devices:", e);
 }
 }, []);

 useEffect(() => {
 refreshAudioDevices();
 if (typeof navigator !== "undefined" && navigator.mediaDevices) {
 navigator.mediaDevices.addEventListener("devicechange", refreshAudioDevices);
 return () => navigator.mediaDevices.removeEventListener("devicechange", refreshAudioDevices);
 }
 }, [refreshAudioDevices]);

 useEffect(() => {
 localStorage.setItem("loxx_selected_audio_input", selectedAudioInput);
 }, [selectedAudioInput]);

 useEffect(() => {
 localStorage.setItem("loxx_selected_audio_output", selectedAudioOutput);
 }, [selectedAudioOutput]);

 useEffect(() => {
 localStorage.setItem("loxx_transparent_overlay", String(transparentOverlayEnabled));
 if (isElectron) {
 if (typeof window !== "undefined" && (window as any).electronAPI) {
     const isOverlayWidget = true;
    if (isOverlayWidget) {
      (window as any).electronAPI.setTransparentOverlayActive(transparentOverlayEnabled);
    }
 (window as any).electronAPI.updateLauncherSettings({ overlayEnabled: transparentOverlayEnabled });
 }
 }
 }, [transparentOverlayEnabled, isElectron]);

 useEffect(() => {
 localStorage.setItem("loxx_rich_presence_enabled", String(launcherRichPresenceEnabled));
 if (isElectron) {
 if (launcherRichPresenceEnabled && gameDetected) {
 (window as any).electronAPI.updateRichPresence(gameDetected);
 } else {
 (window as any).electronAPI.updateRichPresence(null);
 }
 }
 }, [launcherRichPresenceEnabled, gameDetected, isElectron]);

 useEffect(() => {
 if (gameDetected) {
 presenceSocket.emit("presence.update", { status: "in_game", activity: gameDetected });
 } else {
 presenceSocket.emit("presence.update", { status: "online" });
 }
 }, [gameDetected]);

 useEffect(() => {
const checkElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
 setIsElectron(checkElectron);
 if (checkElectron) {
 const api = (window as any).electronAPI;
 api.getLauncherSettings().then((settings: any) => {
 if (settings) {
 if (settings.closeToTray !== undefined) setLauncherCloseToTray(settings.closeToTray);
 if (settings.startAtLogin !== undefined) setLauncherStartAtLogin(settings.startAtLogin);
 if (settings.hardwareAcceleration !== undefined) setLauncherHardwareAcceleration(settings.hardwareAcceleration);
 if (settings.globalPttKey !== undefined) setLauncherGlobalPttKey(settings.globalPttKey);
 if (settings.globalMuteKey !== undefined) setLauncherGlobalMuteKey(settings.globalMuteKey);
 if (settings.overlayX !== undefined) setOverlayX(Number(settings.overlayX));
 if (settings.overlayY !== undefined) setOverlayY(Number(settings.overlayY));
 if (settings.overlayWidth !== undefined) setOverlayWidth(Number(settings.overlayWidth));
 if (settings.overlayHeight !== undefined) setOverlayHeight(Number(settings.overlayHeight));
 if (settings.overlayOpacity !== undefined) setOverlayOpacity(Number(settings.overlayOpacity));
 if (settings.overlayClickThrough !== undefined) setOverlayClickThrough(!!settings.overlayClickThrough);
 if (settings.overlayEnabled !== undefined) {
    const hasSavedTransparentOverlay = localStorage.getItem("loxx_transparent_overlay") !== null;
    if (!hasSavedTransparentOverlay) {
      setTransparentOverlayEnabled(!!settings.overlayEnabled);
    }
  }
        if (settings.throttleGameMode !== undefined) {
          setLauncherThrottleGameMode(!!settings.throttleGameMode);
        }
        if (settings.bypassSystemProxy !== undefined) {
          setBypassSystemProxy(!!settings.bypassSystemProxy);
          localStorage.setItem("loxx_bypass_system_proxy", String(settings.bypassSystemProxy));
        }
        if (settings.appDnsProvider !== undefined) {
          setAppDnsProvider(settings.appDnsProvider);
          localStorage.setItem("loxx_app_dns_provider", settings.appDnsProvider);
        }
 }
 }).catch((err: any) => console.error("Error loading Electron launcher settings:", err));

 // Listen to native game detections
 const stopGameDetector = api.onGameDetected((game: string | null) => {
 if (api.sendGameDetectedReply) {
 api.sendGameDetectedReply(!!game);
 }
 setGameDetected(prevGame => {
 if (game && game !== prevGame) {
 toast.success(`🎮 لانچر Loxx: بازی ${game} شناسایی شد!`, { icon: "🎮" });
 
 // Automatically enable the Transparent Windows Overlay when a game is launched
 setTransparentOverlayEnabled(true);

 // Close window if throttleGameMode is enabled to reduce resources
 if (throttleGameModeRef.current) {
   if (api.closeWindow) {
     setTimeout(() => {
       api.closeWindow();
       toast.success("🎮 بازی شناسایی شد. جهت کاهش مصرف حافظه و پرفورمنس گیمینگ، پنجره لابی لوکس بسته شد.", { icon: "⚡" });
     }, 500);
   }
 }
 }
 return game;
 });
 });

  return () => {
    if (stopGameDetector) stopGameDetector();
  };
  }
  }, []);

  const updateLauncherSettings = useCallback((updated: { voiceMode?: "activation" | "ptt";
    closeToTray?: boolean;
    startAtLogin?: boolean;
    hardwareAcceleration?: boolean;
    globalPttKey?: string;
    globalMuteKey?: string;
    overlayX?: number;
    overlayY?: number;
    overlayWidth?: number;
    overlayHeight?: number;
    overlayOpacity?: number;
    overlayClickThrough?: boolean;
    bypassSystemProxy?: boolean;
    appDnsProvider?: "system" | "cloudflare" | "google" | "electro" | "shecan";
    throttleGameMode?: boolean;
   }) => {
     if (updated.voiceMode !== undefined) setVoiceMode(updated.voiceMode);
     if (updated.closeToTray !== undefined) setLauncherCloseToTray(updated.closeToTray);
     if (updated.startAtLogin !== undefined) setLauncherStartAtLogin(updated.startAtLogin);
     if (updated.hardwareAcceleration !== undefined) setLauncherHardwareAcceleration(updated.hardwareAcceleration);
     if (updated.globalPttKey !== undefined) {
       setLauncherGlobalPttKey(updated.globalPttKey);
       const parts = updated.globalPttKey.split("+");
       setPttKey(parts[parts.length - 1]);
     }
     if (updated.globalMuteKey !== undefined) setLauncherGlobalMuteKey(updated.globalMuteKey);
     if (updated.overlayX !== undefined) setOverlayX(updated.overlayX);
     if (updated.overlayY !== undefined) setOverlayY(updated.overlayY);
     if (updated.overlayWidth !== undefined) setOverlayWidth(updated.overlayWidth);
     if (updated.overlayHeight !== undefined) setOverlayHeight(updated.overlayHeight);
     if (updated.overlayOpacity !== undefined) setOverlayOpacity(updated.overlayOpacity);
     if (updated.overlayClickThrough !== undefined) setOverlayClickThrough(updated.overlayClickThrough);
     if (updated.bypassSystemProxy !== undefined) {
       setBypassSystemProxy(updated.bypassSystemProxy);
       localStorage.setItem("loxx_bypass_system_proxy", String(updated.bypassSystemProxy));
     }
     if (updated.appDnsProvider !== undefined) {
       setAppDnsProvider(updated.appDnsProvider);
       localStorage.setItem("loxx_app_dns_provider", updated.appDnsProvider);
     }
     if (updated.throttleGameMode !== undefined) {
       setLauncherThrottleGameMode(updated.throttleGameMode);
     }

     const checkElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
     if (checkElectron) {
       (window as any).electronAPI.updateLauncherSettings(updated);
     }
   }, []);

 
  // Sync overlay settings across electron windows in real-time via storage events
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "loxx_overlay_members_visible" && e.newValue !== null) {
        setOverlayMembersVisible(e.newValue === "true");
      } else if (e.key === "loxx_overlay_normal_opacity" && e.newValue !== null) {
        setOverlayNormalOpacity(parseFloat(e.newValue));
      } else if (e.key === "loxx_overlay_speaking_opacity" && e.newValue !== null) {
        setOverlaySpeakingOpacity(parseFloat(e.newValue));
      } else if (e.key === "loxx_overlay_position" && e.newValue !== null) {
        setOverlayPosition(e.newValue);
      } else if (e.key === "loxx_overlay_size" && e.newValue !== null) {
        setOverlaySize(e.newValue);
      } else if (e.key === "loxx_overlay_only_talking" && e.newValue !== null) {
        setOverlayOnlyTalking(e.newValue === "true");
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    }
  }, []);


  // Sync PTT status and speaking indicator to Electron
 useEffect(() => {
 if (isElectron) {
 const api = (window as any).electronAPI;
 const speakLevel = localVolume > 20;
 api.setVoiceStatus(speakLevel ? 'talking' : (lobby ? 'connected' : 'idle'));
 }
 }, [isElectron, localVolume, lobby]);

 // Synchronize current lobby speaking players state directly to the Electron translucent overlay
 useEffect(() => {
 if (isElectron) {
 const api = (window as any).electronAPI;
 if (api && api.sendOverlayPlayers) {
 if (lobby) {
 const playersList = (lobby.players || []).map((player: any) => {
 const isMe = player.userId === user?.id;
 const vol = isMe ? localVolume : (peerVolumes[player.userId] || 0);
 const isSpeaking = vol > 15;
 return {
 userId: player.userId,
 username: player.username || "بازیکن",
 avatarUrl: player.avatarUrl,
 isSpeaking,
 isMuted: !!player.micMuted
 };
 });
 api.sendOverlayPlayers(playersList);
 } else {
 api.sendOverlayPlayers([]);
 }
 }
 }
 }, [isElectron, lobby, user?.id, localVolume, peerVolumes]);

 // Handle native global OS event listeners
 useEffect(() => {
 if (!isElectron) return;
 const api = (window as any).electronAPI;

 api.getLauncherSettings().then((cfg: any) => {
 if (cfg.voiceMode) setVoiceMode(cfg.voiceMode);
 if (cfg.globalPttKey) setPttKey(cfg.globalPttKey);
 });

 const stopPttListener = api.onGlobalPttChange((pressed: boolean) => {
 // we check local voiceMode state in the listener
 setIsPttPressed(pressed);
 });

 const stopMuteListener = api.onGlobalMuteToggle(() => {
 if (lobbyRef.current && userRef.current) {
 const myPlayer = lobbyRef.current.players?.find((p: any) => p.userId === userRef.current?.id);
 const currentMuted = myPlayer ? !!(myPlayer as any).micMuted : false;
 // Toggle Mic
 const targetMuted = !currentMuted; lobbySocket.emit("lobby.mic", { lobbyId: lobbyRef.current.id, muted: targetMuted }); if (targetMuted && mainPlatformVoiceSocket) { mainPlatformVoiceSocket.emit("voice.talking", { roomId: lobbyRef.current.id, isTalking: false }); }
 setLobby((prev: any) => { if (!prev) return null; const talking = prev.talkingUsers || []; return { ...prev, isMuted: targetMuted, talkingUsers: targetMuted ? talking.filter(id => id !== userRef.current?.id) : talking }; });
 toast.success(targetMuted ? "میکروفون قطع شد (Muted)" : "میکروفون فعال شد (Unmuted)");
 }
 });

 return () => {
 if (stopPttListener) stopPttListener();
 if (stopMuteListener) stopMuteListener();
 };
 }, [isElectron, voiceMode]);

 const requestMicrophone = useCallback(async () => {
 try {
 if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia && !localStreamRef.current) {
 const constraints: any = {
 echoCancellation: true,
 noiseSuppression: noiseCanceling,
 autoGainControl: true,
 channelCount: 1,
 sampleRate: 48000,
 sampleSize: 16,
 googEchoCancellation: true,
 googAutoGainControl: true,
 googNoiseSuppression: true,
 googNoiseSupression: true,
 googHighpassFilter: true,
 latency: { ideal: 0.005 }
 };
 if (selectedAudioInput && selectedAudioInput !== "default") {
 constraints.deviceId = { exact: selectedAudioInput };
 }
 const stream = await navigator.mediaDevices.getUserMedia({ audio: constraints });
 rawLocalStreamRef.current = stream;

 // Clone send track for WebRTC to prevent sending background/noise packets on silent states.
 const clonedTrack = stream.getAudioTracks()[0].clone();
 clonedTrack.enabled = false; // Start disabled to prevent ambient noise bleeding

 const clonedStream = new MediaStream([clonedTrack]);
 localStreamRef.current = clonedStream;
 setLocalStream(clonedStream);
 }
 } catch (e) {
 console.error("Microphone permission denied", e);
 setIsAudioContextResumed(false);
 }
 }, [selectedAudioInput, noiseCanceling]);

 const stopMicrophone = useCallback(() => {
 if (localStreamRef.current) {
 localStreamRef.current.getTracks().forEach(track => track.stop());
 localStreamRef.current = null;
 setLocalStream(null);
 }
 if (rawLocalStreamRef.current) {
 rawLocalStreamRef.current.getTracks().forEach(track => track.stop());
 rawLocalStreamRef.current = null;
 }
 setIsLocalSpeaking(false);
 }, []);

 // Hot-swap microphone on input device selection changes
 useEffect(() => {
 if (localStreamRef.current || rawLocalStreamRef.current) {
 stopMicrophone();
 requestMicrophone();
 }
 }, [selectedAudioInput, requestMicrophone, stopMicrophone]);

 // Dynamically apply noise suppression constraints without stopping mic track!
 useEffect(() => {
  const tracksToUpdate = [];
  if (localStreamRef.current) tracksToUpdate.push(localStreamRef.current.getAudioTracks()[0]);
  if (rawLocalStreamRef.current) tracksToUpdate.push(rawLocalStreamRef.current.getAudioTracks()[0]);
  
  tracksToUpdate.forEach(audioTrack => {
   if (audioTrack && typeof audioTrack.applyConstraints === "function") {
    audioTrack.applyConstraints({
     noiseSuppression: noiseCanceling,
     googNoiseSuppression: noiseCanceling,
     googNoiseSupression: noiseCanceling
    }).catch((err) => {
     console.warn("[LobbyContext] Failed to apply dynamic constraints:", err);
    });
   }
  });
 }, [noiseCanceling]);

 const resumeAudio = useCallback(async () => {
 try {
 await requestMicrophone();
 const resumed = await resumeSharedAudioContext();
 if (resumed) {
 setIsAudioContextResumed(true);
 toast.success("سیستم صوتی فعال شد", { id: 'audio-resume' });
 } else {
 throw new Error("Failed to resume shared context");
 }
 } catch (err) {
 console.error("Failed to resume AudioContext", err);
 toast.error("خطا در فعال‌سازی سیستم صوتی");
 }
 }, [requestMicrophone]);

 const setPeerVolume = useCallback((userId: string, volume: number) => {
 setPeerVolumes(prev => ({ ...prev, [userId]: volume }));
 }, []);

 useEffect(() => {
 const ctx = getSharedAudioContext();
 if (ctx.state === "suspended") {
 setIsAudioContextResumed(false);
 } else {
 setIsAudioContextResumed(true);
 }
 }, []);

 // Sync mic on lobby join / leave
 useEffect(() => {
 if (lobby?.id || isMicTestOn) { requestMicrophone();
 const ctx = getSharedAudioContext();
 if (ctx.state === "suspended") {
 ctx.resume()
 .then(() => setIsAudioContextResumed(true))
 .catch(e => console.warn("Auto-play AudioContext blocked:", e));
 } else {
 setIsAudioContextResumed(true);
 }
 } else {
 stopMicrophone();
 }
 }, [lobby?.id, isMicTestOn, requestMicrophone, stopMicrophone]);

 // Manage stream enabled/disabled state based on mic status & PTT keys
 useEffect(() => {
 const isMicMuted = !!(lobby?.players?.find(p => p.userId === user?.id) as any)?.micMuted;
 if (localStream && localStream.getAudioTracks().length > 0) {
 if (isMicMuted) {
 localStream.getAudioTracks()[0].enabled = false;
 } else if (voiceMode === "ptt") {
 localStream.getAudioTracks()[0].enabled = isPttPressed;
 } else {
 // Voice activation mode: enable output track only when actively speaking (VAD triggers isLocalSpeaking)
 // This blocks keyboard noise, ambient echoes and game sound during silence while saving huge upload bandwidth (fixing ping issues)
 localStream.getAudioTracks()[0].enabled = isLocalSpeaking;
 }
 }
 }, [lobby?.players, user?.id, localStream, voiceMode, isPttPressed, isLocalSpeaking]);

 // Window keyboard PTT listeners
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

 // Handle local voice analysis globally
 useEffect(() => {
		let audioContext: AudioContext;
		let analyzer: AnalyserNode;
		let microphone: MediaStreamAudioSourceNode;
		let micTestGainNode: GainNode | null = null;
		let rafId: number;
		let isTalking = false;
		let lastVol = 0;
		let speakStartTime = 0;
		let silenceStartTime = 0;

		const currentRawStream = rawLocalStreamRef.current;

		if (currentRawStream && isAudioContextResumed) {
			try {
				audioContext = getSharedAudioContext();
				analyzer = audioContext.createAnalyser();
				microphone = audioContext.createMediaStreamSource(currentRawStream);
				microphone.connect(analyzer);
				
				analyzer.fftSize = 256;
				const bufferLength = analyzer.frequencyBinCount;
				const dataArray = new Uint8Array(bufferLength);

				// Connect mic-test audio routing if enabled
				if (isMicTestOn) {
					micTestGainNode = audioContext.createGain();
					micTestGainNode.gain.setValueAtTime(0, audioContext.currentTime); // start silent (gated)
					microphone.connect(micTestGainNode);
					micTestGainNode.connect(audioContext.destination);

					// Apply custom output destination if selected and supported
					if (selectedAudioOutput && selectedAudioOutput !== "default" && (audioContext as any).setSinkId) {
						(audioContext as any).setSinkId(selectedAudioOutput).catch(console.warn);
					}
				}

				let myvad: any = null;
				MicVAD.new({
					getStream: () => Promise.resolve(currentRawStream),
					baseAssetPath: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/",
					onnxWASMBasePath: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.26.0/dist/",
					positiveSpeechThreshold: Math.max(0.18, Math.min(0.99, (45 - micSensitivityRef.current) / 45)), // Optimised higher noise floor & sensitivity scale for gamers
					negativeSpeechThreshold: Math.max(0.12, Math.min(0.95, ((45 - micSensitivityRef.current) / 45) - 0.15)), // Safe speech end probability
					minSpeechMs: 150, // Filter click/noise spikes under ~150ms 
					redemptionMs: micCloseDelayRef.current || 300, // Dynamic hang-time/redemption from close delay setting
					onSpeechStart: () => {
						setIsLocalSpeaking(true);
						if (!isTalking) {
							isTalking = true;
							if (lobby && mainPlatformVoiceSocket) {
								mainPlatformVoiceSocket.emit("voice.talking", { roomId: lobby.id, isTalking: true });
							}
							if (lobby && user) {
								setLobby(prev => {
									if (!prev) return null;
									const talkingUsers = prev.talkingUsers || [];
									if (!talkingUsers.includes(user.id)) {
										return { ...prev, talkingUsers: [...talkingUsers, user.id] };
									}
									return prev;
								});
							}
							if (micTestGainNode && audioContext) {
								micTestGainNode.gain.setTargetAtTime(1.0, audioContext.currentTime, 0.03);
							}
						}
					},
					onSpeechEnd: () => {
						setIsLocalSpeaking(false);
						if (isTalking) {
							isTalking = false;
							if (lobby && mainPlatformVoiceSocket) {
								mainPlatformVoiceSocket.emit("voice.talking", { roomId: lobby.id, isTalking: false });
							}
							if (lobby && user) {
								setLobby(prev => {
									if (!prev) return null;
									const talkingUsers = prev.talkingUsers || [];
									if (talkingUsers.includes(user.id)) {
										return { ...prev, talkingUsers: talkingUsers.filter(id => id !== user.id) };
									}
									return prev;
								});
							}
							if (micTestGainNode && audioContext) {
								micTestGainNode.gain.setTargetAtTime(0.0, audioContext.currentTime, 0.03);
							}
						}
					}
				}).then((vad) => {
					myvad = vad;
					vad.start();
				}).catch(e => {
					console.error("VAD-WEB Failed to Load, falling back to volume gate:", e);
				});

				const intervalId = setInterval(() => {
					if (currentRawStream.getAudioTracks().length > 0 && currentRawStream.getAudioTracks()[0].enabled) {
						analyzer.getByteFrequencyData(dataArray);
						let sum = 0;
						for(let i = 0; i < bufferLength; i++) {
							sum += dataArray[i];
						}
						const avg = sum / bufferLength;
						const newVol = Math.min(100, Math.round(avg * 2));
						
						if (Math.abs(newVol - lastVol) > 20 || (newVol === 0 && lastVol !== 0) || (newVol > 15 && lastVol === 0)) {
							lastVol = newVol;
							setLocalVolume(newVol);
						}
					} else {
						if (lastVol !== 0) {
							lastVol = 0;
							setLocalVolume(0);
						}
						if (isTalking) {
							isTalking = false;
							setIsLocalSpeaking(false);
							if (lobby && mainPlatformVoiceSocket) mainPlatformVoiceSocket.emit("voice.talking", { roomId: lobby.id, isTalking: false });
							if (lobby && user) {
								setLobby(prev => {
									if (!prev) return null;
									return { ...prev, talkingUsers: prev.talkingUsers?.filter(id => id !== user.id) || [] };
								});
							}
						}
					}
				}, 150); // 150ms interval

				(currentRawStream as any)._audioIntervalId = intervalId;

			} catch (err) {
				console.error("Local stream analyzer error:", err);
			}
		}

		return () => {
			if (currentRawStream && (currentRawStream as any)._audioIntervalId) {
				clearInterval((currentRawStream as any)._audioIntervalId);
			}
			try {
				if (microphone) microphone.disconnect();
				if (analyzer) analyzer.disconnect();
				if (micTestGainNode) micTestGainNode.disconnect();
			} catch (e) {}
		};
	}, [lobby?.id, user?.id, localStream, isAudioContextResumed, isMicTestOn, selectedAudioOutput]);

 

 // Connect globally using our WebRTC signaling hook
 const { remoteStreams, isMediasoupSFU } = useWebRTC(lobby?.id || null, localStream, user?.id, screenStream, isMicTestOn, botStream);

 // Monitor speaking volumes for glowing effects
 const handlePeerVolumeChange = useCallback((peerUserId: string, vol: number) => {
 // Save to global state so elements can use it
 setPeerActivity(prev => {
 if (Math.abs((prev[peerUserId] || 0) - vol) < 35 && vol !== 0 && prev[peerUserId] !== 0) return prev;
 if (prev[peerUserId] === vol) return prev;
 return { ...prev, [peerUserId]: vol };
 });
 }, []);

 // SFX Helper
 const playSFX = (type: 'message' | 'join' | 'leave' | 'notification' | 'action' | 'pop') => {
 // Disabled SFX due to network blocks on mixkit assets in some regions
 // which causes console errors.
 };

 useEffect(() => {
 // Listen for member updates using the new dot-protocol
 lobbySocket.on("lobby.closed", (data: { lobbyId: string }) => {
 const currentLobby = lobbyRef.current;
 
 setLobby(prev => {
 if (prev?.id === data.lobbyId) {
 return null;
 }
 return prev;
 });

 if (currentLobby?.id === data.lobbyId) {
 playSFX('notification');
 toast.error("لابی توسط میزبان بسته شد", { icon: '🚫' });
 }
 });

 lobbySocket.on("lobby.kicked", (data: { lobbyId: string, userId: string }) => {
 const currentLobby = lobbyRef.current;
 const currentUser = userRef.current;

 if (currentUser?.id === data.userId && currentLobby?.id === data.lobbyId) {
 setLobby(null);
 playSFX('notification');
 toast.error("شما از لابی اخراج شدید", { icon: '👢' });
 } else {
 setLobby(prev => {
 if (!prev || prev.id !== data.lobbyId) return prev;
 return {
 ...prev,
 players: prev.players.filter(p => p.userId !== data.userId)
 };
 });
 }
 });

 lobbySocket.on("lobby.member_joined", (data: { user: any, membersCount: number }) => {
 setLobby(prev => {
 if (!prev) return null;
 const exists = prev.players.some(p => p.userId === data.user.id);
 if (exists) return prev;
 return {
 ...prev,
 players: [...prev.players, { ...data.user, userId: data.user.id, isReady: false, micMuted: false }]
 };
 });
 
 if (data.user.id !== userRef.current?.id) {
 playSFX('join');
 
 if (data.user.role === 'ADMIN') {
 toast.custom((t) => (
 <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-[#1a0505] shadow-2xl rounded-2xl pointer-events-auto flex items-center ring-1 ring-red-500/50 p-4 border-s-4 border-s-red-500`}>
 <div className="flex-1 w-0">
 <div className="flex items-start">
 <div className="flex-shrink-0 pt-0.5 relative">
 <div className="absolute -inset-1 bg-red-500 blur-sm rounded-full opacity-50 animate-pulse"></div>
 <img className="h-10 w-10 rounded-full border border-red-500 relative z-10 bg-black" src={data.user.avatarUrl || "https://api.dicebear.com/7.x/notionists/svg"} alt="" />
 </div>
 <div className="ms-3 flex-1">
 <p className="text-sm font-black text-red-500 uppercase drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]" style={{ direction: 'ltr', textAlign: 'left' }}>
 LOXX ADMIN JOINED
 </p>
 <p className="mt-1 text-sm text-gray-300 font-bold" style={{ direction: 'rtl', textAlign: 'right' }}>
 مدیر کل <span className="text-white">{data.user.username}</span> وارد لابی شد
 </p>
 </div>
 </div>
 </div>
 </div>
 ), { duration: 5000, id: `admin-join-${data.user.id}` });
 } else {
 toast(`${data.user.username} وارد لابی شد`, { icon: '👋', id: `join-${data.user.id}` });
 }
 }
 });

 lobbySocket.on("lobby.member_left", (data: { userId: string, membersCount: number, reason?: string }) => {
 if (data.userId === userRef.current?.id && (data.reason === "kicked" || data.reason === "banned")) {
 setLobby(null);
 toast.error(data.reason === "kicked" ? "از لابی اخراج شدید" : "شما از این لابی مسدود شدید", { id: 'kick-ban' });
 window.location.href = "/lobbies";
 return;
 }
 
 setLobby(prev => {
 if (!prev) return null;
 return {
 ...prev,
 players: prev.players.filter(p => p.userId !== data.userId),
 talkingUsers: prev.talkingUsers ? prev.talkingUsers.filter(id => id !== data.userId) : []
 };
 });
 playSFX('leave');
 });

 lobbySocket.on("lobby.member_updated", (data: { userId: string, isReady?: boolean, micMuted?: boolean }) => { const isMutedNow = data.micMuted === true;
 setLobby(prev => {
 if (!prev) return null;
 return {
 ...prev,
 talkingUsers: isMutedNow && prev.talkingUsers ? prev.talkingUsers.filter((id) => id !== data.userId) : prev.talkingUsers,
  players: prev.players.map(p => 
 p.userId === data.userId 
 ? { 
 ...p, 
 isReady: data.isReady !== undefined ? data.isReady : p.isReady,
 micMuted: data.micMuted !== undefined ? data.micMuted : p.micMuted 
 } 
 : p
 )
 };
 });
 });

 // Chat Listeners
 const handleChatMessage = (msg: any) => {
 console.log("LobbyContext: [SOCKET_MSG_INCOMING]", msg);
 
 const tType = msg.targetType || msg.target?.type;
 const tId = msg.targetId || (msg.target?.id ? String(msg.target.id) : undefined);

 console.log("LobbyContext: Parsed target ->", { tType, tId, currentLobbyId: lobbyRef.current?.id });

 if (tType !== "lobby") {
 return;
 }

 setLobby(prev => {
 if (!prev) return null;
 
 // Ensure both IDs are compared as strings
 if (tId && String(tId) !== String(prev.id)) {
 return prev;
 }
 
 // Comprehensive anti-duplicate check (check ID or content+from+time)
 const isDuplicate = prev.messages?.some(m => 
 (msg.id && m.id === msg.id) || 
 (msg.tempId && m.id === msg.tempId) ||
 (msg.tempId && m.id === msg.id) ||
 (m.content === msg.content && m.from.userId === msg.from.userId && Math.abs(m.createdAt - (msg.createdAt || msg.timestamp || Date.now())) < 2000)
 );

 if (isDuplicate) {
 console.log("LobbyContext: Duplicate msg detected.");
 // Update tempId message with real ID if needed
 if (msg.id) {
 return {
 ...prev,
 messages: prev.messages.map(m => 
 (m.id === msg.tempId || !m.id) && m.content === msg.content && m.from.userId === msg.from.userId 
 ? { ...m, id: msg.id } 
 : m
 )
 };
 }
 return prev;
 }

 console.log("LobbyContext: Adding message to UI state");
 const newMessage: ChatMessage = {
 id: msg.id || msg.tempId || crypto.randomUUID(),
 from: msg.from,
 content: msg.content,
 createdAt: msg.createdAt || msg.timestamp || Date.now(),
 targetType: tType,
 targetId: tId
 };

 return {
 ...prev,
 messages: [...(prev.messages || []), newMessage]
 };
 });
 
 if (msg.from?.userId !== userRef.current?.id) {
 playSFX('pop');
 }
 };
 chatSocket.on("chat.message", handleChatMessage);
 lobbySocket.on("chat.message", handleChatMessage);

 // Voice Listeners (Talking indicators)
 const handleVoiceTalking = (data: { userId: string, isTalking: boolean }) => {
 setLobby(prev => {
 if (!prev) return null;
 const talkingUsers = prev.talkingUsers || [];
 if (data.isTalking) {
 if (!talkingUsers.includes(data.userId)) {
 return { ...prev, talkingUsers: [...talkingUsers, data.userId] };
 }
 } else {
 return { ...prev, talkingUsers: talkingUsers.filter(id => id !== data.userId) };
 }
 return prev;
 });
 };
 mainPlatformVoiceSocket.on("voice.talking", handleVoiceTalking);

 lobbySocket.on("lobby.status_changed", (data: { status: LobbyStatus }) => {
 setLobby(prev => {
 if (!prev) return null;
 return { ...prev, status: data.status };
 });
 if (data.status === "STARTING") {
 toast.success("بازی در حال شروع است!", { icon: '🚀' });
 }
 });

 lobbySocket.on("lobby.settings_updated", (data: { lobbyId: string, isPrivate?: boolean, micRequired?: boolean }) => {
 setLobby(prev => {
 if (!prev) return null;
 return {
 ...prev,
 ...(data.isPrivate !== undefined && { isPrivate: data.isPrivate }),
 ...(data.micRequired !== undefined && { micRequired: data.micRequired })
 };
 });
 });

 lobbySocket.on("error", (err) => {
 toast.error(err.message || "خطایی در لابی رخ داد");
 });

 return () => {
 lobbySocket.off("lobby.closed");
 lobbySocket.off("lobby.member_joined");
 lobbySocket.off("lobby.member_left");
 lobbySocket.off("lobby.member_updated");
 lobbySocket.off("lobby.status_changed");
 lobbySocket.off("error");
 chatSocket.off("chat.message", handleChatMessage);
 lobbySocket.off("chat.message", handleChatMessage);
 mainPlatformVoiceSocket.off("voice.talking", handleVoiceTalking);
 };
 }, []);

 useEffect(() => {
 const syncRooms = () => {
 const currentLobby = lobbyRef.current;
 if (currentLobby?.id) {
 console.log("LobbyContext: Syncing rooms for lobby", currentLobby.id);
 chatSocket.emit("chat.join", { type: "lobby", id: currentLobby.id });
 mainPlatformVoiceSocket.emit("voice.join", { roomId: currentLobby.id });
 lobbySocket.emit("lobby.join", { lobbyId: currentLobby.id });
 }
 };

 if (lobby?.id) {
 syncRooms();
 
 // Re-sync on certain triggers
 const syncInterval = setInterval(syncRooms, 60000); // Proactive sync every 60s (Optimized for gaming ping)

 chatSocket.on("connect", () => {
 console.log("Chat Socket reconnected, syncing rooms...");
 syncRooms();
 });
 mainPlatformVoiceSocket.on("connect", syncRooms);
 lobbySocket.on("connect", () => {
 console.log("Lobby Socket reconnected, syncing rooms...");
 syncRooms();
 });
 
 return () => {
 clearInterval(syncInterval);
 chatSocket.off("connect");
 mainPlatformVoiceSocket.off("connect", syncRooms);
 lobbySocket.off("connect");
 };
 }
 }, [lobby?.id]);

  // Periodic ping logic for calculating precise latency
  useEffect(() => {
    if (!lobby?.id) {
      setPeerPings({});
      return;
    }

    let lastCalculatedPing: number | null = null;

    const interval = setInterval(() => {
      // Prioritize pinging the dedicated voice SFU server (VPS) for real voice latency.
      if (voiceSocket && voiceSocket.connected) {
        voiceSocket.emit("voice.ping", { timestamp: Date.now() });
      }
      // Always ping lobbySocket as a highly stable heartbeat and web latency calculator
      if (lobbySocket && lobbySocket.connected) {
        lobbySocket.emit("lobby.ping", { timestamp: Date.now() });
      }
    }, 15000); // Optimized block: Ping every 15s instead of 4.5s to minimize ping jitter in online games

    const handleVoicePong = (data: { timestamp: number }) => {
      const rawPing = Date.now() - data.timestamp;
      // Exponentially Weighted Moving Average (EWMA) with alpha = 0.3 for smoothing jitter
      const calculatedPing = lastCalculatedPing === null 
        ? rawPing 
        : Math.round(lastCalculatedPing * 0.7 + rawPing * 0.3);
      lastCalculatedPing = calculatedPing;

      const currentLobby = lobbyRef.current;
      if (currentLobby?.id && lobbySocket && lobbySocket.connected) {
        lobbySocket.emit("lobby.publish_ping", {
          lobbyId: currentLobby.id,
          ping: calculatedPing
        });
      }
    };

    const handleLobbyPong = (data: { timestamp: number }) => {
      // Fallback web latency
      const rawPing = Date.now() - data.timestamp;
      const calculatedPing = lastCalculatedPing === null 
        ? rawPing 
        : Math.round(lastCalculatedPing * 0.7 + rawPing * 0.3);
      lastCalculatedPing = calculatedPing;

      const currentLobby = lobbyRef.current;
      if (currentLobby?.id && lobbySocket && lobbySocket.connected) {
        lobbySocket.emit("lobby.publish_ping", {
          lobbyId: currentLobby.id,
          ping: calculatedPing
        });
      }
    };

    const handlePingUpdated = (data: { userId: string, ping: number }) => {
      setPeerPings(prev => ({
        ...prev,
        [data.userId]: data.ping
      }));
    };

    if (voiceSocket) {
      voiceSocket.on("voice.pong", handleVoicePong);
    }
    if (lobbySocket) {
      lobbySocket.on("lobby.pong", handleLobbyPong);
      lobbySocket.on("lobby.ping_updated", handlePingUpdated);
    }

    return () => {
      clearInterval(interval);
      if (voiceSocket) {
        voiceSocket.off("voice.pong", handleVoicePong);
      }
      if (lobbySocket) {
        lobbySocket.off("lobby.pong", handleLobbyPong);
        lobbySocket.off("lobby.ping_updated", handlePingUpdated);
      }
    };
  }, [lobby?.id]);

  // LAN Tunneling Relay Controller
 useEffect(() => {
 const isElectronAvailable = typeof window !== "undefined" && !!(window as any).electronAPI;
 if (!isElectronAvailable || !lobby?.id || !lobby?.isLanMode) {
 if (isElectronAvailable) {
 (window as any).electronAPI.stopLanRelay();
 }
 return;
 }

 const api = (window as any).electronAPI;
 const isHost = lobby.hostId === user?.id;
 const role = isHost ? 'host' : 'client';

 console.log(`[LAN] Starting local zero-TUN proxy as [${role}] for lobby [${lobby.id}]`);
 api.startLanRelay(role, lobby.id);

 // 1. Send captured host discovery broadcasts to other players in the lobby
 const stopUdpBroadcaster = api.onLanPacketCaptured(({ port, data }: { port: number, data: string }) => {
 console.log(`[LAN] Capturing host local broadcast announcement on port ${port}...`);
 lobbySocket.emit("lobby.lan.relay", {
 lobbyId: lobby.id,
 event: "udp_broadcast",
 payload: { port, data }
 });
 });

 // 2. Handle outbound TCP initialization request from client to host
 const stopTcpConnectHandler = api.onLanTcpConnectReq(({ connectionId, port }: { connectionId: string, port: number }) => {
 console.log(`[LAN] Client requesting tunnel connection [${connectionId}]...`);
 lobbySocket.emit("lobby.lan.relay", {
 lobbyId: lobby.id,
 event: "tcp_connect",
 payload: { targetUserId: lobby.hostId, connectionId, port }
 });
 });

 // 3. Handle outbound TCP stream packets from client to host (and vice versa)
 const stopTcpDataSender = api.onLanTcpDataReceived(({ connectionId, data }: { connectionId: string, data: string }) => {
 const targetUser = isHost ? null : lobby.hostId;
 lobbySocket.emit("lobby.lan.relay", {
 lobbyId: lobby.id,
 event: "tcp_data",
 payload: { targetUserId: targetUser, connectionId, data }
 });
 });

 // 4. Handle connection terminations
 const stopTcpCloseSender = api.onLanTcpCloseReq(({ connectionId }: { connectionId: string }) => {
 const targetUser = isHost ? null : lobby.hostId;
 lobbySocket.emit("lobby.lan.relay", {
 lobbyId: lobby.id,
 event: "tcp_close",
 payload: { targetUserId: targetUser, connectionId }
 });
 });

 // 5. Handle pure UDP multiplayer packets
 const stopUdpDataSender = api.onLanUdpDataReceived((payload: any) => {
 const targetUser = isHost ? null : lobby.hostId;
 lobbySocket.emit("lobby.lan.relay", {
 lobbyId: lobby.id,
 event: "udp_data",
 payload: { ...payload, targetUserId: targetUser }
 });
 });

 // 6. Handle LAN status transitions
 const stopStatusListener = api.onLanStatusChange((data: any) => {
 console.log("[LAN] Status code received:", data);
 });

 // 7. Handle LAN errors beautifully
 const stopErrorListener = api.onLanError((err: { type: string, port: number, message: string }) => {
 console.error("[LAN] Bridge internal error:", err);
 if (err.type === "TCP_PROXY_BIND_FAILED" || err.type === "UDP_BIND_FAILED") {
 toast.error(`⚠️ خطای شبکه LAN: پورت بازی ${err.port} اشغال است! لطفاً مطمئن شوید خودِ بازی در حالت هاستینگ قرار ندارد و پورت آن آزاد است.`, { id: `lan-port-conflict-${err.port}` });
 }
 });

 // RECEIVE LAN RELAYS FROM OTHER PLAYERS VIA SOCKET.IO AND INJECT
 const handleRemoteLanEvent = (msg: { senderUserId: string, event: string, payload: any }) => {
 if (msg.senderUserId === user?.id) return;
 const { event, payload } = msg;

 if (event === "udp_broadcast") {
 if (role === 'client') {
 api.injectLanUdpPacket(payload.port, payload.data);
 }
 } 
 else if (event === "tcp_connect") {
 if (role === 'host') {
 api.sendRemoteTcpConnect(payload.connectionId, payload.port);
 }
 } 
 else if (event === "tcp_data") {
 if (payload.targetUserId && payload.targetUserId !== user?.id) return;
 api.sendRemoteTcpData(payload.connectionId, payload.data);
 } 
 else if (event === "tcp_close") {
 if (payload.targetUserId && payload.targetUserId !== user?.id) return;
 api.sendRemoteTcpClose(payload.connectionId);
 } 
 else if (event === "udp_data") {
 if (payload.targetUserId && payload.targetUserId !== user?.id) return;
 api.sendRemoteUdpData(
 payload.connectionId, 
 payload.port, 
 payload.data, 
 !!payload.isResponse, 
 payload.clientAddress, 
 payload.clientPort
 );
 }
 };

 lobbySocket.on("lobby.lan.event", handleRemoteLanEvent);

 return () => {
 console.log("[LAN] Leaving room, cleaning up LAN-bridge events and bindings.");
 lobbySocket.off("lobby.lan.event", handleRemoteLanEvent);
 if (stopUdpBroadcaster) stopUdpBroadcaster();
 if (stopTcpConnectHandler) stopTcpConnectHandler();
 if (stopTcpDataSender) stopTcpDataSender();
 if (stopTcpCloseSender) stopTcpCloseSender();
 if (stopUdpDataSender) stopUdpDataSender();
 if (stopStatusListener) stopStatusListener();
 if (stopErrorListener) stopErrorListener();
 api.stopLanRelay();
 };
 }, [lobby?.id, lobby?.isLanMode, lobby?.hostId, user?.id]);

 const [isJoining, setIsJoining] = useState<string | null>(null);
 const [joinError, setJoinError] = useState<string | null>(null);

 const joinLobby = (lobbyId: string) => {
 if (lobby?.id === lobbyId || isJoining === lobbyId) return;
 
 setIsJoining(lobbyId);
 setJoinError(null);
 lobbySocket.emit("lobby.join", { lobbyId }, (ack: any) => {
 setIsJoining(null);
 if (ack?.status === "ok") {
 setJoinError(null);
 setLobby({
 ...ack.data,
 gameId: ack.data.gameId || null,
 talkingUsers: []
 });
 
 // Immediately join chat and voice rooms
 const joinChatAndVoice = () => {
 chatSocket.emit("chat.join", { type: "lobby", id: lobbyId });
 mainPlatformVoiceSocket.emit("voice.join", { roomId: lobbyId });
 };
 joinChatAndVoice();
 chatSocket.once("connect", () => { chatSocket.emit("chat.join", { type: "lobby", id: lobbyId }); });
 mainPlatformVoiceSocket.once("connect", () => { mainPlatformVoiceSocket.emit("voice.join", { roomId: lobbyId }); });
 } else {
 const errorMsg = ack?.error?.message || "Join failed";
 setJoinError(errorMsg);
 toast.error(errorMsg);
 }
 });
 };

 const leaveLobby = () => {
 if (lobby) {
 lobbySocket.emit("lobby.leave", { lobbyId: lobby.id });
 setLobby(null);
 }
 };

 const toggleReady = () => {
 if (lobby && user) {
 // Find current ready state
 const me = lobby.players.find(p => p.userId === user.id);
 const currentReady = me?.isReady || false;
 lobbySocket.emit("lobby.ready", { lobbyId: lobby.id, ready: !currentReady }); 
 }
 };

 const setLobbyMuted = (muted: boolean) => {
 if (user && lobby) {
 lobbySocket.emit("lobby.mic", { lobbyId: lobby.id, muted }); if (muted && mainPlatformVoiceSocket) { mainPlatformVoiceSocket.emit("voice.talking", { roomId: lobby.id, isTalking: false }); }
 setLobby(prev => { if (!prev) return null; const talking = prev.talkingUsers || []; return { ...prev, isMuted: muted, talkingUsers: muted ? talking.filter(id => id !== user.id) : talking }; });
 }
 };

 const sendMessage = (content: string) => {
 if (lobby && user) {
 const tempId = crypto.randomUUID();
 const msgData = {
 target: { type: "lobby", id: lobby.id },
 content,
 tempId
 };
 
 // Optimistic update
 const optimisticMsg: ChatMessage = {
 id: tempId,
 from: {
 userId: user.id,
 username: user.username,
 membership: (user as any).membership || "MEMBER",
 badges: (user as any).badges || []
 },
 content,
 createdAt: Date.now(),
 targetType: "lobby",
 targetId: lobby.id
 };

 setLobby(prev => {
 if (!prev) return null;
 return {
 ...prev,
 messages: [...(prev.messages || []), optimisticMsg]
 };
 });

 console.log("LobbyContext: sending message", msgData);
 lobbySocket.emit("lobby.chat.send", msgData, (ack: any) => {
 if (ack?.status === "error") {
 console.error("LobbyContext: Failed to send message", ack.error);
 toast.error(`خطا در ارسال پیام: ${ack.error?.message}`);
 } else {
 console.log("LobbyContext: Message sent successfully", ack);
 }
 });
 }
 };

 useEffect(() => {
  if (lobby?.id) {
   const handleStateChange = (state: any) => {
    console.log("[LobbyContext] Synced Music Bot state", state);
    setMusicBotState({
      ...state,
      updatedAt: Date.now() // Override with local time to prevent drift issues due to clock desync
    });
   };
   lobbySocket.on("lobby.musicbot.state", handleStateChange);

   lobbySocket.emit("lobby.musicbot.get_state", { lobbyId: lobby.id }, (res: any) => {
    if (res?.status === "success") {
     setMusicBotState({
       ...res.data,
       updatedAt: Date.now()
     });
    }
   });

   return () => {
    lobbySocket.off("lobby.musicbot.state", handleStateChange);
   };
  } else {
   setMusicBotState(null);
  }
 }, [lobby?.id]);

 const toggleMusicBot = (active: boolean, botType?: "music" | "melody") => {
  if (lobby) {
   const finalBotType = botType || musicBotState?.botType || "music";
    lobbySocket.emit("lobby.musicbot.toggle", { lobbyId: lobby.id, active, botType: finalBotType }, (res: any) => {
    if (res?.status === "success") {
     setMusicBotState({
       ...res.data,
       updatedAt: Date.now()
     });
     const botName = finalBotType === "melody" ? "ملودی لوکس (طلایی)" : "ربات موزیک";
     toast.success(active ? `${botName} فعال شد` : `${botName} غیرفعال شد`);
    } else if (res?.message) {
     toast.error(res.message);
    }
   });
  }
 };

 const controlMusicBot = (action: "play" | "pause" | "update-queue" | "seek", params: any = {}) => {
  if (lobby) {
   lobbySocket.emit("lobby.musicbot.control", { lobbyId: lobby.id, action, ...params }, (res: any) => {
    if (res?.status === "success") {
     setMusicBotState({
       ...res.data,
       updatedAt: Date.now()
     });
    } else if (res?.message) {
     toast.error(res.message);
    }
   });
  }
 };

   // --- High-Fidelity Sync & Media Server Broadcasting (Music Bot) ---
  const [audioElMounted, setAudioElMounted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // 1. Synchronized local HTML5 playback
  useEffect(() => {
    const audioEl = localMusicAudioRef.current;
    if (!audioEl) return;
    if (!audioElMounted) setAudioElMounted(true);

    const isHost = lobby?.hostId === user?.id;

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
      const isHostOrMelody = isHost || musicBotState?.botType === "melody";
      if (isHostOrMelody && dur > 0) {
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
    let fullUrl = rawUrl.startsWith("http") ? rawUrl : (rawUrl.startsWith("blob:") ? rawUrl : `${window.location.origin}${rawUrl}`);
    
    // Proxy external audio to bypass CORS for Web Audio API
    if (fullUrl.startsWith("http") && !fullUrl.startsWith(window.location.origin)) {
       fullUrl = `/api/v1/proxy/audio?url=${encodeURIComponent(fullUrl)}`;
    }

    if (audioEl.src !== fullUrl && audioEl.src !== window.location.origin + fullUrl) {
      audioEl.src = fullUrl;
      audioEl.load();
    }

    if (musicBotState.currentTime !== undefined && musicBotState.updatedAt) {
      const timeSinceUpdate = (Date.now() - musicBotState.updatedAt) / 1000;
      const targetTime = musicBotState.currentTime + (musicBotState.isPlaying ? timeSinceUpdate : 0);
      const drift = Math.abs(audioEl.currentTime - targetTime);
      
      // Host is master source of truth. We only snap if the drift is large (e.g. initial load or massive desync)
      const maxDrift = isHost ? 10.0 : 2.0;
      if (drift > maxDrift) {
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
    lobby?.id,
    user?.id
  ]);

  // 2. Peers progress simulation
  useEffect(() => {
    const isHost = lobby?.hostId === user?.id;
    if (isHost || !musicBotState?.active || musicBotState?.currentTime === undefined) return;
    
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
  }, [lobby?.hostId, user?.id, musicBotState?.active, musicBotState?.isPlaying, musicBotState?.currentTime, musicBotState?.updatedAt, musicBotState?.duration]);

  // Synchronize duration on peer when it changes in state
  useEffect(() => {
    const isHost = lobby?.hostId === user?.id;
    if (!isHost && musicBotState?.duration) {
      setLocalMusicDuration(musicBotState.duration);
    }
  }, [lobby?.hostId, user?.id, musicBotState?.duration]);

  // Resume host AudioContext on user gesture
  useEffect(() => {
    const isHost = lobby?.hostId === user?.id;
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
  }, [lobby?.hostId, user?.id]);

  // Vocal ducking / volume adjustment
  useEffect(() => {
    const audioEl = localMusicAudioRef.current;
    if (!audioEl) return;

    const botId = `music-bot-${lobby?.id}`;
    const botVolumeLevel = peerVolumes[botId] !== undefined ? peerVolumes[botId] : 100;

    const hasHighPeerActivity = Object.entries(peerActivity).some(([uid, vol]) => {
      if (uid === botId) return false;
      const player = lobby?.players?.find((p: any) => p.userId === uid);
      if (!player) return false;
      if (player.micMuted) return false;
      return (vol as number) > 5; // Speak threshold
    });

    const baseVolume = isDeafened ? 0 : botVolumeLevel;
    
    let targetVol = (baseVolume / 100) * (musicVolumeSilence / 100);
    if (hasHighPeerActivity) {
      targetVol = (baseVolume / 100) * (musicVolumeTalking / 100);
      setIsDucking(true);
    } else {
      setIsDucking(false);
    }

    targetVol = Math.max(0, Math.min(1, targetVol));

    if (Math.abs(audioEl.volume - targetVol) > 0.01) {
      const step = (targetVol - audioEl.volume) / 10;
      let count = 0;
      const interval = setInterval(() => {
        if (count >= 10) {
          audioEl.volume = targetVol;
          clearInterval(interval);
        } else {
          audioEl.volume = Math.max(0, Math.min(1, audioEl.volume + step));
          count++;
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [peerActivity, peerVolumes, musicVolumeSilence, musicVolumeTalking, lobby?.players, lobby?.id, isDeafened]);

  const updateLobbySettings = (settings: { isPrivate?: boolean, micRequired?: boolean }) => {
 if (lobby) {
 lobbySocket.emit("lobby.update_settings", { lobbyId: lobby.id, ...settings }, (ack: any) => {
 if (ack?.status === "error") {
 toast.error(ack.error?.message || "مشکلی در ذخیره تنظیمات پیش آمد");
 }
 });
 }
 };

 const kickPlayer = (userId: string) => {
 if (lobby) {
 lobbySocket.emit("lobby.kick", { lobbyId: lobby.id, targetUserId: userId }, (ack: any) => {
 if (ack?.status === "ok") {
 playSFX('action');
 toast.success("کاربر اخراج شد");
 } else {
 toast.error(ack?.error?.message || "خطا در اخراج کاربر");
 }
 });
 }
 };

 const banPlayer = (userId: string) => {
 if (lobby) {
 lobbySocket.emit("lobby.ban", { lobbyId: lobby.id, targetUserId: userId }, (ack: any) => {
 if (ack?.status === "ok") {
 playSFX('action');
 toast.success("کاربر مسدود شد");
 } else {
 toast.error(ack?.error?.message || "خطا در مسدود سازی کاربر");
 }
 });
 }
 };

 return (
 <LobbyContext.Provider value={{ 
 lobby, 
 joinLobby,
 leaveLobby,
 toggleReady,
 setLobbyMuted,
 setBotStream,
 sendMessage,
 updateLobbySettings,
 kickPlayer,
 banPlayer,
 isJoining,
 joinError,
 
 // Voice bindings
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
 peerPings,
 setPeerVolume,
 localVolume,
 isDeafened,
 setIsDeafened,
 micSensitivity,
 setMicSensitivity,
 micOpenDelay,
 setMicOpenDelay,
 micCloseDelay,
 setMicCloseDelay,
 noiseCanceling,
 setNoiseCanceling,
 isMicTestOn,
 setIsMicTestOn,

 // Overlay bindings
 overlayEnabled,
 setOverlayEnabled,
 overlayPosition,
 setOverlayPosition,
 overlaySize,
 setOverlaySize,
 overlayOnlyTalking,
 setOverlayOnlyTalking,
 overlayToastPosition,
 setOverlayToastPosition,
 overlayToastXOffset,
 setOverlayToastXOffset,
 overlayToastYOffset,
 setOverlayToastYOffset,
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
 launcherThrottleGameMode,
 updateLauncherSettings,
  bypassSystemProxy,
  appDnsProvider,

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
 remoteStreams,
 isMediasoupSFU,
 setScreenStreamForWebRTC: setScreenStreamForWebRTCState,
 musicBotState,
 toggleMusicBot,
 controlMusicBot,
 musicVolumeSilence,
 setMusicVolumeSilence,
  localMusicAudioRef,
  localMusicDuration,
  setLocalMusicDuration,
  localMusicCurrentTime,
  setLocalMusicCurrentTime,
  isDucking,
 musicVolumeTalking,
 setMusicVolumeTalking
 }}>
 {children}
  <audio className="hidden" ref={localMusicAudioRef} crossOrigin="anonymous" />
 {lobby?.id && Array.from(remoteStreams.entries()).map(([peerUserId, stream]) => {
  const isBot = peerUserId.startsWith("music-bot-");
  if (isBot) return null; // Bypassed: high-fidelity local HTML5 playback runs synchronously in LobbyRoomPage instead of degraded voice buffers.
  const baseVolume = isDeafened ? 0 : (peerVolumes[peerUserId] !== undefined ? peerVolumes[peerUserId] : 100);
  let finalVolume = baseVolume;
  if (isBot) {
   const anyUserSpeaking = (lobby?.talkingUsers || []).some(uid => !uid.startsWith("music-bot-"));
   const targetVolume = anyUserSpeaking ? musicVolumeTalking : musicVolumeSilence;
   finalVolume = (baseVolume / 100) * targetVolume;
  }
  return (
   <RemoteAudioPlayer 
    key={peerUserId}
    stream={stream}
    volumeLevel={finalVolume}
    onVolumeChange={(vol) => handlePeerVolumeChange(peerUserId, vol)}
    outputDeviceId={selectedAudioOutput}
    isMusicBot={isBot}
   />
  );
 })}
 </LobbyContext.Provider>
 );
};

export const useLobby = () => {
 const context = useContext(LobbyContext);
 if (!context) {
 throw new Error("useLobby must be used within a LobbyProvider");
 }
 return context;
};
