import { io } from "socket.io-client";

const SOCKET_URL = window.location.origin;

export const createNamespaceSocket = (namespace: string, withAuth = true) => {
 // Determine if we should force WSS (useful if Runflare configures HTTP but forwards to HTTPS)
 // By using location.origin, we respect the current protocol (HTTP vs HTTPS)
 // Force websocket transport to fix session unknown errors in VPS/Runflare load balancers
 
 const authConfig = withAuth ? {
 auth: (cb: any) => {
 const token = localStorage.getItem("loxx_token");
 cb({ token: `Bearer ${token}` });
 }
 } : {};

 return io(`${SOCKET_URL}/${namespace}`, {
 path: '/api/v1/socket.io',
 autoConnect: false,
 transports: ['websocket', 'polling'], // Start with websocket directly for lowest latency, fallback to polling if blocked
 reconnectionDelay: 1000,
 reconnectionDelayMax: 5000,
 ...authConfig
 });
};

// Global sockets that can be reused
export const publicSocket = createNamespaceSocket("public", false);
export const presenceSocket = createNamespaceSocket("presence");
export const lobbySocket = createNamespaceSocket("lobby");
export const chatSocket = createNamespaceSocket("chat");
export const notifySocket = createNamespaceSocket("notify");
export const rankingSocket = createNamespaceSocket("ranking");

// Helper to determine the dedicated high-performance voice server URL dynamically.
const getVoiceServerUrl = () => {
  if (import.meta.env.VITE_VOICE_SERVER_URL) {
    return import.meta.env.VITE_VOICE_SERVER_URL;
  }
  // Dedicated Voice Server VPS IP
  const defaultIP = "146.19.212.212";
  const port = "4000";
  
  // Choose secure (wss) vs insecure (ws) matching the browser protocol.
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  
  return `${protocol}//${defaultIP}:${port}`;
};

// Create a direct WebSocket connection pointing to the standalone mediasoup signaling server.
export const voiceSocket = io(getVoiceServerUrl(), {
  path: "/socket.io",
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
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

