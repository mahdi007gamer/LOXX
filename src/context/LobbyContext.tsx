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
    lobbySocket.on("lobby_update", (data) => {
      setLobby(prev => ({ ...prev, ...data }));
    });

    lobbySocket.on("player_joined", (data) => {
       toast(`${data.username} وارد لابی شد`, { icon: '👋' });
    });

    lobbySocket.on("player_left", (data) => {
      toast(`${data.username} از لابی خارج شد`, { icon: '🚪' });
    });

    lobbySocket.on("error", (err) => {
      toast.error(err.message || "خطایی در لابی رخ داد");
    });

    return () => {
      lobbySocket.off("lobby_update");
      lobbySocket.off("player_joined");
      lobbySocket.off("player_left");
      lobbySocket.off("error");
    };
  }, []);

  const joinLobby = (lobbyId: string) => {
    lobbySocket.emit("join_lobby", { lobbyId });
  };

  const leaveLobby = () => {
    if (lobby) {
      lobbySocket.emit("leave_lobby", { lobbyId: lobby.id });
      setLobby(null);
    }
  };

  const toggleReady = () => {
    if (lobby) {
      lobbySocket.emit("toggle_ready", { lobbyId: lobby.id });
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
