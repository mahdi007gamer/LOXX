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
}

export interface ChatMessage {
  id: string;
  from: {
    userId: string;
    username: string;
    membership: string;
  };
  content: string;
  createdAt: number;
  targetType?: string;
  targetId?: string;
}

interface LobbyState {
  id: string | null;
  title?: string;
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
    const sounds = {
      pop: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3', // Quick pop
      message: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
      join: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
      leave: 'https://assets.mixkit.co/active_storage/sfx/2359/2359-preview.mp3',
      notification: 'https://assets.mixkit.co/active_storage/sfx/2361/2361-preview.mp3',
      action: 'https://assets.mixkit.co/active_storage/sfx/2362/2362-preview.mp3'
    };
    const audio = new Audio(sounds[type]);
    audio.volume = 0.3;
    audio.play().catch(() => {});
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

    lobbySocket.on("lobby.member_left", (data: { userId: string, membersCount: number }) => {
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
      
      // Some servers use 'target' object, some use 'targetType'/'targetId'
      const tType = msg.targetType || msg.target?.type;
      const tId = msg.targetId || msg.target?.id;

      console.log("LobbyContext: Parsed target ->", { tType, tId });

      if (tType !== "lobby") {
        console.log("LobbyContext: Msg ignored (not lobby)");
        return;
      }

      setLobby(prev => {
        if (!prev) {
          console.log("LobbyContext: Msg ignored (no lobby in state)");
          return null;
        }
        
        // Match current lobby ID
        if (tId && tId !== prev.id) {
          console.log(`LobbyContext: Msg ignored (ID mismatch). Received: ${tId}, Current: ${prev.id}`);
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

  const joinLobby = (lobbyId: string) => {
    if (lobby?.id === lobbyId || isJoining === lobbyId) return;
    
    setIsJoining(lobbyId);
    lobbySocket.emit("lobby.join", { lobbyId }, (ack: any) => {
      setIsJoining(null);
      if (ack?.status === "ok") {
        setLobby({
          ...ack.data,
          talkingUsers: []
        });
        
        // Immediately join chat and voice rooms
        if (chatSocket.connected) {
          chatSocket.emit("chat.join", { type: "lobby", id: lobbyId });
        }
        if (voiceSocket.connected) {
          voiceSocket.emit("voice.join", { roomId: lobbyId });
        }
      } else {
        toast.error(ack?.error?.message || "Join failed");
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
          membership: "MEMBER"
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
      chatSocket.emit("chat.send", msgData);
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
      banPlayer
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
