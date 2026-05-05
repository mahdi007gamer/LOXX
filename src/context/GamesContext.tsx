import React, { createContext, useContext, useState, useEffect } from "react";
import { Game } from "../types";
import api from "../lib/api.js";

interface GamesContextType {
  allGames: Game[];
  myGames: string[]; // IDs
  toggleMyGame: (gameId: string) => void;
  loading: boolean;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

export const GamesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [myGames, setMyGames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await api.get("/games");
        if (response.data.status === "success") {
          setAllGames(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch games:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const toggleMyGame = (gameId: string) => {
    setMyGames(prev => 
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId) 
        : [...prev, gameId]
    );
  };

  return (
    <GamesContext.Provider value={{ allGames, myGames, toggleMyGame, loading }}>
      {children}
    </GamesContext.Provider>
  );
};

export const useGames = () => {
  const context = useContext(GamesContext);
  if (!context) throw new Error("useGames must be used within a GamesProvider");
  return context;
};
