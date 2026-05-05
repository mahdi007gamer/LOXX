import React, { createContext, useContext, useState, useEffect } from "react";
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
}

const LobbyContext = createContext<LobbyContextType | undefined>(undefined);

export const LobbyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Listen for member updates using the new dot-protocol
    lobbySocket.on("lobby.closed", (data: { lobbyId: string }) => {
      setLobby(prev => {
        if (prev?.id === data.lobbyId) {
          toast.error("لابی توسط میزبان بسته شد", { icon: '🚫' });
          return null;
        }
        return prev;
      });
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
      if (data.user.id !== user?.id) {
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
    const handleChatMessage = (msg: ChatMessage) => {
      if (msg.targetType && msg.targetType !== "lobby") return;
      setLobby(prev => {
        if (!prev) return null;
        // prevent duplicate messages by checking id
        if (prev.messages?.some(m => m.id === msg.id)) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), msg]
        };
      });
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

  const [isJoining, setIsJoining] = useState<string | null>(null);

  const joinLobby = (lobbyId: string) => {
    if (lobby?.id === lobbyId || isJoining === lobbyId) return;
    
    setIsJoining(lobbyId);
    lobbySocket.emit("lobby.join", { lobbyId }, (ack: any) => {
      setIsJoining(null);
      if (ack?.status === "ok") {
        setLobby({
          ...ack.data,
          messages: [],
          talkingUsers: []
        });
        
        // Join chat room too
        chatSocket.emit("chat.join", { type: "lobby", id: lobbyId });
        voiceSocket.emit("voice.join", { roomId: lobbyId });
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
    if (lobby) {
      chatSocket.emit("chat.send", {
         target: { type: "lobby", id: lobby.id },
         content,
         tempId: Date.now().toString()
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

  return (
    <LobbyContext.Provider value={{ 
      lobby, 
      joinLobby,
      leaveLobby,
      toggleReady,
      setLobbyMuted,
      sendMessage,
      updateLobbySettings
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
