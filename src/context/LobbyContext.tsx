import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { lobbySocket, chatSocket, voiceSocket } from "../lib/socket";
import { toast } from "react-hot-toast";
import { useAuth } from "./AuthContext";

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
}

const LobbyContext = createContext<LobbyContextType | undefined>(undefined);

export const LobbyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const { user } = useAuth();
  
  // Use refs to track latest state for socket listeners
  const lobbyRef = useRef<LobbyState | null>(null);
  const userRef = useRef<any>(null);

  useEffect(() => {
    lobbyRef.current = lobby;
  }, [lobby]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

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
        toast(`${data.user.username} وارد لابی شد`, { icon: '👋', id: `join-${data.user.id}` });
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
      joinError
    }}>
      {children}
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
