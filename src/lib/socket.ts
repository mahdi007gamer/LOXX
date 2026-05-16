import { io } from "socket.io-client";

const SOCKET_URL = window.location.origin;

export const createNamespaceSocket = (namespace: string) => {
  // Determine if we should force WSS (useful if Runflare configures HTTP but forwards to HTTPS)
  // By using location.origin, we respect the current protocol (HTTP vs HTTPS)
  // Force websocket transport to fix session unknown errors in VPS/Runflare load balancers
  return io(`${SOCKET_URL}/${namespace}`, {
    autoConnect: false, // Better to let AuthContext connect them when token exists
    transports: ['websocket'], // MUST be websocket only to prevent load balancer session drops
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
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
