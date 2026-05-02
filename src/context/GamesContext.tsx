import React, { createContext, useContext, useState, useEffect } from "react";
import { Game } from "../types";

interface GamesContextType {
  allGames: Game[];
  myGames: string[]; // IDs
  toggleMyGame: (gameId: string) => void;
  loading: boolean;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

const INITIAL_GAMES: Game[] = [
  {
    id: "cs2",
    title: "Counter-Strike 2",
    genre: "تیراندازی اول شخص",
    image: "https://shared.cloudflare.steamstatic.com/store_apps/730/capsule_616x353.jpg",
    activeLobbies: 24,
    playerCount: "۱.۲ میلیون",
    friendsPlaying: ["ali_gamer", "sina_sultan"],
  },
  {
    id: "valorant",
    title: "Valorant",
    genre: "تیراندازی تاکتیکی",
    image: "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt7ef999db63f68d6f/652f1e967a15993202685718/VAL_Banner_1920x1080.jpg",
    activeLobbies: 18,
    playerCount: "۸۰۰ هزار",
    friendsPlaying: ["sina_sultan"],
  },
  {
    id: "dota2",
    title: "Dota 2",
    genre: "MOBA",
    image: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota2_social.jpg",
    activeLobbies: 15,
    playerCount: "۶۰۰ هزار",
    friendsPlaying: ["reza_king"],
  },
  {
    id: "apex",
    title: "Apex Legends",
    genre: "بتل رویال",
    image: "https://media.contentapi.ea.com/content/dam/apex-legends/images/2019/01/apex-featured-image-16x9.jpg.adapt.crop191x100.1200w.jpg",
    activeLobbies: 9,
    playerCount: "۳۰۰ هزار",
    friendsPlaying: [],
  },
  {
    id: "fifa24",
    title: "EA Sports FC 24",
    genre: "ورزشی",
    image: "https://media.direct.playstation.com/is/image/psdglobal/EASPORTS_FC_24_Banner?$Banner_S$",
    activeLobbies: 32,
    playerCount: "۴۰۰ هزار",
    friendsPlaying: ["ali_gamer"],
  },
  {
    id: "league",
    title: "League of Legends",
    genre: "MOBA",
    image: "https://gaming-cdn.com/images/products/6504/orig/league-of-legends-pc-game-cover.jpg?v=1662447432",
    activeLobbies: 45,
    playerCount: "۲ میلیون",
    friendsPlaying: ["reza_king", "sina_sultan"],
  },
];

export const GamesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allGames, setAllGames] = useState<Game[]>(INITIAL_GAMES);
  const [myGames, setMyGames] = useState<string[]>(["cs2", "valorant"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
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
