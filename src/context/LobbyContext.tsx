import React, { createContext, useContext, useState, useEffect } from "react";
import { lobbySocket } from "../lib/socket";
import { toast } from "react-hot-toast";

export type LobbyStatus = "WAITING" | "READY" | "STARTING" | "IN_PROGRESS" | "FINISHED";

interface LobbyMember {
  userId: string;
  username: string;
  role: "HOST" | "PLAYER";
  isReady: boolean;
}

interface LobbyState {
  id: string | null;
  gameTitle: string;
  players: LobbyMember[];
  maxPlayers: number;
  status: LobbyStatus;
  hostId: string | null;
  countdown?: number;
  isMuted?: boolean;
}

interface LobbyContextType {
  lobby: LobbyState | null;
  joinLobby: (lobbyId: string) => void;
  leaveLobby: () => void;
  toggleReady: () => void;
  setLobbyMuted: (muted: boolean) => void;
}

const LobbyContext = createContext<LobbyContextType | undefined>(undefined);

export const LobbyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lobby, setLobby] = useState<LobbyState | null>(null);

  useEffect(() => {
    // Listen for member updates using the new dot-protocol
    lobbySocket.on("lobby.member_joined", (data: { user: any, membersCount: number }) => {
      setLobby(prev => {
        if (!prev) return null;
        const exists = prev.players.some(p => p.userId === data.user.id);
        if (exists) return prev;
        return {
          ...prev,
          players: [...prev.players, { ...data.user, userId: data.user.id }]
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
                  micMuted: data.micMuted !== undefined ? data.micMuted : (p as any).micMuted 
                } 
              : p
          )
        };
      });
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
        setLobby(ack.data);
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
    if (lobby) {
      // Find my current ready state locally for optimistic toggle
      // The server will ack and broadcast the real state
      lobbySocket.emit("lobby.ready", { lobbyId: lobby.id, ready: true }); 
    }
  };

  const setLobbyMuted = (muted: boolean) => {
    setLobby(prev => prev ? { ...prev, isMuted: muted } : null);
  };

  return (
    <LobbyContext.Provider value={{ 
      lobby, 
      joinLobby,
      leaveLobby,
      toggleReady,
      setLobbyMuted
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
