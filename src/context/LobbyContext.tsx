import React, { createContext, useContext, useState, useEffect } from "react";
import { lobbySocket } from "../lib/socket";
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
}

const LobbyContext = createContext<LobbyContextType | undefined>(undefined);

export const LobbyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Listen for member updates using the new dot-protocol
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
      toast(`${data.user.username} وارد لابی شد`, { icon: '👋' });
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
    import("../lib/socket").then(({ chatSocket }) => {
       chatSocket.on("chat.message", (msg: ChatMessage) => {
         setLobby(prev => {
           if (!prev) return null;
           return {
             ...prev,
             messages: [...(prev.messages || []), msg]
           };
         });
       });
    });

    // Voice Listeners (Talking indicators)
    import("../lib/socket").then(({ voiceSocket }) => {
      // Assuming a simple event for "I am talking"
      voiceSocket.on("voice.talking", (data: { userId: string, isTalking: boolean }) => {
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
      });
    });

    lobbySocket.on("lobby.status_changed", (data: { status: LobbyStatus }) => {
      setLobby(prev => {
        if (!prev) return null;
        return { ...prev, status: data.status };
      });
      if (data.status === "STARTING") {
        toast.success("بازی در حال شروع است!", { icon: '🚀' });
      }
    });

    lobbySocket.on("error", (err) => {
      toast.error(err.message || "خطایی در لابی رخ داد");
    });

    return () => {
      lobbySocket.off("lobby.member_joined");
      lobbySocket.off("lobby.member_left");
      lobbySocket.off("lobby.member_updated");
      lobbySocket.off("error");
    };
  }, []);

  const joinLobby = (lobbyId: string) => {
    lobbySocket.emit("lobby.join", { lobbyId }, (ack: any) => {
      if (ack?.status === "ok") {
        setLobby({
          ...ack.data,
          messages: [],
          talkingUsers: []
        });
        
        // Join chat room too
        import("../lib/socket").then(({ chatSocket, voiceSocket }) => {
          chatSocket.emit("chat.join", { type: "lobby", id: lobbyId });
          voiceSocket.emit("voice.join", { roomId: lobbyId });
        });
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
       import("../lib/socket").then(({ chatSocket }) => {
          chatSocket.emit("chat.send", {
             target: { type: "lobby", id: lobby.id },
             content,
             tempId: Date.now().toString()
          });
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
      sendMessage
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
