import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/api";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  displayName?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  membership?: string;
  vipMetadata?: any;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: any) => void;
  logout: () => Promise<void>;
  updateUser: (newData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { presenceSocket, lobbySocket, chatSocket, notifySocket, rankingSocket, voiceSocket } from "../lib/socket";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await api.get("/auth/me");
      if (response.data.status === "success") {
        setUser(response.data.data || response.data.user);
      }
    } catch (error) {
      console.error("User refresh failed:", error);
    }
  };

  const connectSockets = () => {
    presenceSocket.connect();
    lobbySocket.connect();
    chatSocket.connect();
    notifySocket.connect();
    rankingSocket.connect();
    voiceSocket.connect();
  };

  const disconnectSockets = () => {
    presenceSocket.disconnect();
    lobbySocket.disconnect();
    chatSocket.disconnect();
    notifySocket.disconnect();
    rankingSocket.disconnect();
    voiceSocket.disconnect();
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("loxx_token");
      if (token) {
        try {
          const response = await api.get("/auth/me");
          if (response.data.status === "success") {
            setUser(response.data.data || response.data.user);
            connectSockets();
          }
        } catch (error) {
          console.error("Auth init failed:", error);
          localStorage.removeItem("loxx_token");
        }
      }
      setLoading(false);
    };

    initAuth();
    
    return () => disconnectSockets();
  }, []);

  const login = (token: string, userData: any) => {
    localStorage.setItem("loxx_token", token);
    setUser(userData);
    connectSockets();
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("loxx_token");
      setUser(null);
      disconnectSockets();
      window.location.href = "/auth";
    }
  };

  const updateUser = (newData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...newData });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
