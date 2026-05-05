import { io } from "socket.io-client";

const SOCKET_URL = window.location.origin;

export const createNamespaceSocket = (namespace: string) => {
  return io(`${SOCKET_URL}/${namespace}`, {
    autoConnect: false, // Better to let AuthContext connect them when token exists
    auth: (cb) => {
      const token = localStorage.getItem("loxx_token");
      cb({ token: `Bearer ${token}` });
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
