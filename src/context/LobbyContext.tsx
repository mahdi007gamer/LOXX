import React, { createContext, useContext, useState, useEffect } from "react";

export type LobbyStatus = "waiting" | "ready" | "starting" | "started" | "closing";

interface LobbyState {
  id: string | null;
  game: string;
  playersCount: number;
  maxPlayers: number;
  status: LobbyStatus;
  countdown: number;
  isMuted: boolean;
  lobbyCode: string;
}

interface LobbyContextType {
  lobby: LobbyState;
  setLobbyId: (id: string | null) => void;
  setLobbyStatus: (status: LobbyStatus) => void;
  setLobbyPlayers: (count: number) => void;
  setLobbyCountdown: (count: number) => void;
  setLobbyMuted: (muted: boolean) => void;
  leaveLobby: () => void;
}

const LobbyContext = createContext<LobbyContextType | undefined>(undefined);

export const LobbyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lobby, setLobby] = useState<LobbyState>({
    id: null,
    game: "CS2",
    playersCount: 3,
    maxPlayers: 5,
    status: "waiting",
    countdown: 5,
    isMuted: false,
    lobbyCode: "LX-9921-XP",
  });

  const setLobbyId = (id: string | null) => setLobby((prev) => ({ ...prev, id }));
  const setLobbyStatus = (status: LobbyStatus) => setLobby((prev) => ({ ...prev, status }));
  const setLobbyPlayers = (count: number) => setLobby((prev) => ({ ...prev, playersCount: count }));
  const setLobbyCountdown = (count: number) => setLobby((prev) => ({ ...prev, countdown: count }));
  const setLobbyMuted = (muted: boolean) => setLobby((prev) => ({ ...prev, isMuted: muted }));
  
  const leaveLobby = () => {
    setLobby((prev) => ({ ...prev, id: null, status: "waiting" }));
  };

  return (
    <LobbyContext.Provider value={{ 
      lobby, 
      setLobbyId, 
      setLobbyStatus, 
      setLobbyPlayers, 
      setLobbyCountdown, 
      setLobbyMuted,
      leaveLobby 
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
