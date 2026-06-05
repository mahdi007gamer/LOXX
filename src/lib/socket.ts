import { io } from "socket.io-client";

// Detect if we are on the production backend (real server instance)
const isProductionLoxx = typeof window !== 'undefined' && 
  (window.location.hostname === 'loxx.ir' || 
   window.location.hostname === 'www.loxx.ir' || 
   window.location.hostname === 'connect.loxx.ir');

// State to track if fallback is currently active
let activeSocketURL = isProductionLoxx ? "https://connect.loxx.ir" : window.location.origin;
let isUsingFallback = false;

// Array to keep track of sockets that need automatic fallback mapping
const registeredSockets: any[] = [];

export const createNamespaceSocket = (namespace: string, withAuth = true) => {
  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

  const authConfig = withAuth ? {
    auth: (cb: any) => {
      const token = localStorage.getItem("loxx_token");
      cb({ token: `Bearer ${token}` });
    }
  } : {};

  const socketURL = isProductionLoxx && isUsingFallback ? "https://loxx.ir" : activeSocketURL;

  const socket = io(`${socketURL}/${namespace}`, {
    path: '/api/v1/socket.io',
    autoConnect: false,
    transports: ['websocket', 'polling'], // Start with websocket directly for lowest latency, fallback to polling if blocked
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    query: { isElectron: isElectron ? "true" : "false" },
    ...authConfig
  });

  // Put socket in tracking registry for real-time fallback propagation
  registeredSockets.push({ socket, namespace });

  // Attach fallback error handling on connection failure
  socket.on("connect_error", (error) => {
    if (isProductionLoxx && !isUsingFallback && activeSocketURL === "https://connect.loxx.ir") {
      console.warn(`[Socket ${namespace}] Direct connection to connect.loxx.ir failed. Triggering fallback to loxx.ir (CDN)...`, error);
      triggerFallback();
    }
  });

  return socket;
};

// Global sockets that can be reused
export const publicSocket = createNamespaceSocket("public", false);
export const presenceSocket = createNamespaceSocket("presence");
export const lobbySocket = createNamespaceSocket("lobby");
export const chatSocket = createNamespaceSocket("chat");
export const notifySocket = createNamespaceSocket("notify");
export const rankingSocket = createNamespaceSocket("ranking");

// Propagate fallback to all namespaces immediately
const triggerFallback = () => {
  if (isUsingFallback) return;
  isUsingFallback = true;
  activeSocketURL = "https://loxx.ir";

  console.warn(`[Socket fallback] Direct connection to connect.loxx.ir failed. Re-routing all sockets to CDN proxied loxx.ir address...`);

  registeredSockets.forEach(({ socket, namespace }) => {
    if (socket) {
      if (socket.io) {
        socket.io.uri = "https://loxx.ir";
        if (socket.io.opts) {
          socket.io.opts.hostname = "loxx.ir";
          socket.io.opts.port = "443";
          socket.io.opts.secure = true;
        }
      }
      // Force absolute disconnect and reconnect unconditionally.
      // This is crucial to boot failed (offline) sockets onto the valid fallback CDN URL immediately.
      try {
        socket.disconnect();
        socket.connect();
        console.log(`[Socket fallback] Successfully forced absolute reconnect for namespace: ${namespace}`);
      } catch (err) {
        console.error(`[Socket fallback] Failed to reconnect namespace: ${namespace}`, err);
      }
    }
  });
};

// Helper to determine the dedicated high-performance voice server URL dynamically.
const getVoiceServerUrl = () => {
  // If we are in production on loxx.ir, we should absolutely use voice.loxx.ir for zero-proxy direct routing
  if (isProductionLoxx) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//voice.loxx.ir`;
  }

  if (import.meta.env.VITE_VOICE_SERVER_URL) {
    return import.meta.env.VITE_VOICE_SERVER_URL;
  }
  
  // Choose secure (wss) vs insecure (ws) matching the browser protocol.
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  
  // Using the domain address 'voice.loxx.ir' instead of raw IP for proper SSL handshake.
  // When running on HTTPS, modern browsers require a secure connection (wss://),
  // which is only possible with a trusted certificate on a valid domain.
  const host = "voice.loxx.ir";
  
  return `${protocol}//${host}`;
};

// Create a direct WebSocket connection pointing to the standalone mediasoup signaling server.
export const voiceSocket = io(getVoiceServerUrl(), {
  path: "/socket.io",
  autoConnect: false,
  transports: ["websocket"],
  upgrade: false,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10,
});

// Fallback voice socket connected directly to the main platform's downsampler room channel.
export const mainPlatformVoiceSocket = createNamespaceSocket("voice");

// We export a shared AudioContext manager so it can be resumed on user interaction
// and used everywhere to bypass mobile autoplay policies.

let sharedAudioContext: AudioContext | null = null;

export const getSharedAudioContext = () => {
 if (!sharedAudioContext) {
 const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
 if (AudioCtx) {
 sharedAudioContext = new AudioCtx({ latencyHint: "interactive" });
 }
 }
 return sharedAudioContext;
};

export const resumeSharedAudioContext = async () => {
 const ctx = getSharedAudioContext();
 if (ctx && ctx.state === "suspended") {
 try {
 await ctx.resume();
 console.log("Shared AudioContext resumed successfully.");
 return true;
 } catch (e) {
 console.error("Failed to resume shared AudioContext", e);
 return false;
 }
 }
 return true;
};

