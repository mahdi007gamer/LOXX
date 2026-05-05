import React, { createContext, useContext, useState, useEffect } from "react";
import { Game } from "../types";
import api from "../lib/api";

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

        const myGamesRes = await api.get("/user/me/games");
        if (myGamesRes.data.status === "success") {
          setMyGames(myGamesRes.data.data.map((g: any) => g.id));
        }
      } catch (error) {
        console.error("Failed to fetch games:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const toggleMyGame = async (gameId: string) => {
    try {
      const response = await api.post("/user/me/games/toggle", { gameId });
      if (response.data.status === "success") {
        const isAdded = response.data.data.added;
        setMyGames(prev => 
          isAdded 
            ? [...prev, gameId] 
            : prev.filter(id => id !== gameId)
        );
      }
    } catch (error) {
      console.error("Failed to toggle game:", error);
    }
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
