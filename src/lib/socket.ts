import { io } from "socket.io-client";

const SOCKET_URL = window.location.origin;

export const createNamespaceSocket = (namespace: string) => {
  const token = localStorage.getItem("loxx_token");
  
  return io(`${SOCKET_URL}/${namespace}`, {
    auth: {
      token: `Bearer ${token}`
    },
    query: {
      token: `Bearer ${token}`
    }
  });
};

// Global sockets that can be reused
export const presenceSocket = createNamespaceSocket("presence");
export const lobbySocket = createNamespaceSocket("lobby");
export const chatSocket = createNamespaceSocket("chat");
export const notifySocket = createNamespaceSocket("notify");
export const rankingSocket = createNamespaceSocket("ranking");
export const voiceSocket = createNamespaceSocket("voice");
