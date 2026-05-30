import React, { createContext, useContext, useState, useEffect } from "react";
import { Game } from "../types";
import api from "../lib/api";
import { useAuth } from "./AuthContext";

interface GamesContextType {
  allGames: Game[];
  myGames: string[]; // IDs
  toggleMyGame: (gameId: string) => void;
  loading: boolean;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

// Global static memory cache for games data to prevent flickering during navigation
let cachedAllGames: Game[] = [];
let cachedMyGames: string[] = [];
let gamesFetchedOnce = false;

export const GamesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allGames, setAllGames] = useState<Game[]>(cachedAllGames);
  const [myGames, setMyGames] = useState<string[]>(cachedMyGames);
  const [loading, setLoading] = useState(!gamesFetchedOnce);
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        if (cachedAllGames.length === 0) {
          setLoading(true);
        }
        const response = await api.get("/games");
        if (response.data.status === "success") {
          cachedAllGames = response.data.data;
          setAllGames(response.data.data);
        }

        if (user) {
          const myGamesRes = await api.get("/user/me/games");
          if (myGamesRes.data.status === "success") {
            const mappedMyGames = myGamesRes.data.data.map((g: any) => g.id);
            cachedMyGames = mappedMyGames;
            setMyGames(mappedMyGames);
          }
        } else {
          cachedMyGames = [];
          setMyGames([]);
        }
        gamesFetchedOnce = true;
      } catch (error) {
        console.error("Failed to fetch games:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [user]);

  const toggleMyGame = async (gameId: string) => {
    try {
      const response = await api.post("/user/me/games/toggle", { gameId });
      if (response.data.status === "success") {
        const isAdded = response.data.data.added;
        setMyGames(prev => {
          const updated = isAdded 
            ? [...prev, gameId] 
            : prev.filter(id => id !== gameId);
          cachedMyGames = updated;
          return updated;
        });
        await refreshUser();
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
