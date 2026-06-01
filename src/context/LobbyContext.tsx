import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { lobbySocket, chatSocket, voiceSocket, presenceSocket, getSharedAudioContext, resumeSharedAudioContext } from "../lib/socket";
import { toast } from "react-hot-toast";
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
  sendMessage: (content: string) => void;
  updateLobbySettings: (settings: { isPrivate?: boolean, micRequired?: boolean }) => void;
  kickPlayer: (userId: string) => void;
  banPlayer: (userId: string) => void;
  isJoining: string | null;
  joinError: string | null;

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
  updateLauncherSettings: (settings: {
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
  setScreenStreamForWebRTC: (stream: MediaStream | null) => void;
}

const LobbyContext = createContext<LobbyContextType | undefined>(undefined);

export const LobbyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const { user } = useAuth();
  
  // Voice integration states
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStreamForWebRTCState] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [voiceMode, setVoiceMode] = useState<"activation" | "ptt">("activation");
  const [pttKey, setPttKey] = useState<string>("v");
  const [isPttPressed, setIsPttPressed] = useState<boolean>(false);
  const [isAudioContextResumed, setIsAudioContextResumed] = useState<boolean>(true);
  const [peerVolumes, setPeerVolumes] = useState<Record<string, number>>({});
  const [peerActivity, setPeerActivity] = useState<Record<string, number>>({});
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
  const [launcherGlobalPttKey, setLauncherGlobalPttKey] = useState<string>("CommandOrControl+Alt+V");
  const [launcherGlobalMuteKey, setLauncherGlobalMuteKey] = useState<string>("CommandOrControl+Alt+M");

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
      return localStorage.getItem("loxx_transparent_overlay") === "true";
    }
    return false;
  });

  const [overlayX, setOverlayX] = useState<number>(24);
  const [overlayY, setOverlayY] = useState<number>(80);
  const [overlayWidth, setOverlayWidth] = useState<number>(300);
  const [overlayHeight, setOverlayHeight] = useState<number>(500);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.9);
  const [overlayClickThrough, setOverlayClickThrough] = useState<boolean>(true);

  const [gameDetected, setGameDetected] = useState<string | null>(null);
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
      (window as any).electronAPI.setTransparentOverlayActive(transparentOverlayEnabled);
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
          }
          return game;
        });
      });

      return () => {
        if (stopGameDetector) stopGameDetector();
      };
    }
  }, []);

  const updateLauncherSettings = useCallback((updated: {
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
  }) => {
    const checkElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
    if (checkElectron) {
      if (updated.closeToTray !== undefined) setLauncherCloseToTray(updated.closeToTray);
      if (updated.startAtLogin !== undefined) setLauncherStartAtLogin(updated.startAtLogin);
      if (updated.hardwareAcceleration !== undefined) setLauncherHardwareAcceleration(updated.hardwareAcceleration);
      if (updated.globalPttKey !== undefined) setLauncherGlobalPttKey(updated.globalPttKey);
      if (updated.globalMuteKey !== undefined) setLauncherGlobalMuteKey(updated.globalMuteKey);
      if (updated.overlayX !== undefined) setOverlayX(updated.overlayX);
      if (updated.overlayY !== undefined) setOverlayY(updated.overlayY);
      if (updated.overlayWidth !== undefined) setOverlayWidth(updated.overlayWidth);
      if (updated.overlayHeight !== undefined) setOverlayHeight(updated.overlayHeight);
      if (updated.overlayOpacity !== undefined) setOverlayOpacity(updated.overlayOpacity);
      if (updated.overlayClickThrough !== undefined) setOverlayClickThrough(updated.overlayClickThrough);
      (window as any).electronAPI.updateLauncherSettings(updated);
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
    if (isElectron && lobby) {
      const api = (window as any).electronAPI;
      if (api.sendOverlayPlayers) {
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
        lobbySocket.emit("lobby.mic", { lobbyId: lobbyRef.current.id, muted: !currentMuted });
        setLobby((prev: any) => prev ? { ...prev, isMuted: !currentMuted } : null);
        toast.success(!currentMuted ? "میکروفون قطع شد (Muted)" : "میکروفون فعال شد (Unmuted)");
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
          noiseSuppression: true
        };
        if (selectedAudioInput && selectedAudioInput !== "default") {
          constraints.deviceId = { exact: selectedAudioInput };
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: constraints });
        localStreamRef.current = stream;
        setLocalStream(stream);
      }
    } catch (e) {
      console.error("Microphone permission denied", e);
      setIsAudioContextResumed(false);
    }
  }, [selectedAudioInput]);

  const stopMicrophone = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
  }, []);

  // Hot-swap microphone on input device selection changes
  useEffect(() => {
    if (localStreamRef.current) {
      stopMicrophone();
      requestMicrophone();
    }
  }, [selectedAudioInput]);

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
    if (lobby?.id) {
      requestMicrophone();
    } else {
      stopMicrophone();
    }
  }, [lobby?.id, requestMicrophone, stopMicrophone]);

  // Manage stream enabled/disabled state based on mic status & PTT keys
  useEffect(() => {
    const isMicMuted = !!(lobby?.players?.find(p => p.userId === user?.id) as any)?.micMuted;
    if (localStream && localStream.getAudioTracks().length > 0) {
      if (isMicMuted) {
        localStream.getAudioTracks()[0].enabled = false;
      } else if (voiceMode === "ptt") {
        localStream.getAudioTracks()[0].enabled = isPttPressed;
      } else {
        localStream.getAudioTracks()[0].enabled = true;
      }
    }
  }, [lobby?.players, user?.id, localStream, voiceMode, isPttPressed]);

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
    let rafId: number;
    let isTalking = false;
    let lastVol = 0;

    if (lobby && user && localStream && isAudioContextResumed) {
      try {
        audioContext = getSharedAudioContext();
        analyzer = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(localStream);
        microphone.connect(analyzer);
        
        analyzer.fftSize = 256;
        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let lastAnalysisTime = 0;
        const analyzeVoice = (timestamp: number) => {
          const now = timestamp || performance.now();
          if (now - lastAnalysisTime >= 100) {
            lastAnalysisTime = now;
            if (localStream.getAudioTracks().length > 0 && localStream.getAudioTracks()[0].enabled) {
              analyzer.getByteFrequencyData(dataArray);
              let sum = 0;
              for(let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const avg = sum / bufferLength;
              const newVol = Math.min(100, Math.round(avg * 2));
              
              if (Math.abs(newVol - lastVol) > 15 || (newVol === 0 && lastVol !== 0) || (newVol > 10 && lastVol === 0)) {
                lastVol = newVol;
                setLocalVolume(newVol);
              }

              const talkingNow = avg > 15; 
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
          }
          rafId = requestAnimationFrame(analyzeVoice);
        };
        rafId = requestAnimationFrame(analyzeVoice);
      } catch (err) {
        console.error("Local stream analyzer error:", err);
      }
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      try {
        if (microphone) microphone.disconnect();
        if (analyzer) analyzer.disconnect();
      } catch (e) {}
    };
  }, [lobby?.id, user?.id, localStream, isAudioContextResumed]);

  const combinedStreamMemo = useMemo(() => {
    if (!localStream && !screenStream) return null;
    const stream = new MediaStream();
    if (localStream) {
      localStream.getTracks().forEach(t => stream.addTrack(t));
    }
    if (screenStream) {
      screenStream.getTracks().forEach(t => stream.addTrack(t));
    }
    return stream;
  }, [localStream, screenStream]);

  // Connect globally using our WebRTC signaling hook
  const { remoteStreams } = useWebRTC(lobby?.id || null, combinedStreamMemo, user?.id);

  // Monitor speaking volumes for glowing effects
  const handlePeerVolumeChange = useCallback((peerUserId: string, vol: number) => {
    // Save to global state so elements can use it
    setPeerActivity(prev => {
      if (Math.abs((prev[peerUserId] || 0) - vol) < 25 && vol !== 0 && prev[peerUserId] !== 0) return prev;
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
                    <p className="text-sm font-black text-red-500 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]" style={{ direction: 'ltr', textAlign: 'left' }}>
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
          players: prev.players.filter(p => p.userId !== data.userId)
        };
      });
      playSFX('leave');
    });

    lobbySocket.on("lobby.member_updated", (data: { userId: string, isReady?: boolean, micMuted?: boolean }) => {
      setLobby(prev => {
        if (!prev) return null;
        return {
          ...prev,
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
    voiceSocket.on("voice.talking", handleVoiceTalking);

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
      voiceSocket.off("voice.talking", handleVoiceTalking);
    };
  }, []);

  useEffect(() => {
    const syncRooms = () => {
      const currentLobby = lobbyRef.current;
      if (currentLobby?.id) {
        console.log("LobbyContext: Syncing rooms for lobby", currentLobby.id);
        chatSocket.emit("chat.join", { type: "lobby", id: currentLobby.id });
        voiceSocket.emit("voice.join", { roomId: currentLobby.id });
      }
    };

    if (lobby?.id) {
      syncRooms();
      
      // Re-sync on certain triggers
      const syncInterval = setInterval(syncRooms, 15000); // Proactive sync every 15s

      chatSocket.on("connect", () => {
        console.log("Chat Socket reconnected, syncing rooms...");
        syncRooms();
      });
      voiceSocket.on("connect", syncRooms);
      
      return () => {
        clearInterval(syncInterval);
        chatSocket.off("connect");
        voiceSocket.off("connect");
      };
    }
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
          voiceSocket.emit("voice.join", { roomId: lobbyId });
        };
        joinChatAndVoice();
        chatSocket.once("connect", () => { chatSocket.emit("chat.join", { type: "lobby", id: lobbyId }); });
        voiceSocket.once("connect", () => { voiceSocket.emit("voice.join", { roomId: lobbyId }); });
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
       lobbySocket.emit("lobby.mic", { lobbyId: lobby.id, muted });
       setLobby(prev => prev ? { ...prev, isMuted: muted } : null);
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
      setPeerVolume,
      localVolume,
      isDeafened,
      setIsDeafened,

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
      remoteStreams,
      setScreenStreamForWebRTC: setScreenStreamForWebRTCState
    }}>
      {children}
      {lobby?.id && Array.from(remoteStreams.entries()).map(([peerUserId, stream]) => (
        <RemoteAudioPlayer 
          key={peerUserId}
          stream={stream}
          volumeLevel={isDeafened ? 0 : (peerVolumes[peerUserId] !== undefined ? peerVolumes[peerUserId] : 100)}
          onVolumeChange={(vol) => handlePeerVolumeChange(peerUserId, vol)}
          outputDeviceId={selectedAudioOutput}
        />
      ))}
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
