import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import * as mediasoup from "mediasoup";
import type { types } from "mediasoup";
import os from "os";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(helmet());

// Basic health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "LOXX Voice SFU Engine" });
});

// Friendly root endpoint
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "LOXX Ultra-Low Latency Voice SFU signaling server is active. Use Socket.io to connect.",
    healthCheck: "/health"
  });
});

const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

// The VPS Public IP where UDP traffic is routable
const PUBLIC_IP = process.env.PUBLIC_IP || "146.19.212.212";
const LISTEN_IP = process.env.LISTEN_IP || "0.0.0.0"; // Bind to all interfaces

// Mediasoup Worker configurations
let workers: types.Worker[] = [];
let nextWorkerIdx = 0;

// Room management structure
interface Peer {
  id: string; // Socket ID
  userId: string;
  transports: Map<string, types.WebRtcTransport>;
  producers: Map<string, types.Producer>;
  consumers: Map<string, types.Consumer>;
}

interface Room {
  id: string;
  router: types.Router;
  peers: Map<string, Peer>;
}

const rooms = new Map<string, Room>();

// Standalone signaling socket server
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 30000,
  pingInterval: 15000,
  transports: ["websocket"] // WebRTC signaling benefits from direct WebSocket speed
});

// Advanced Opus and Screensharing Codec Setup
const mediaCodecs: types.RtpCodecCapability[] = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
    preferredPayloadType: 111,
    parameters: {
      useinbandfec: 1, // Enable Forward Error Correction (crucial for packet loss)
      usedtx: 0,        // Continuous Transmission - disabled DTX to ensure zero choppy word cut-offs
      minptime: 10,
      ptime: 20         // 20ms packetization for lowest end-to-end delay (30-80ms target)
    }
  },
  {
    kind: "video",
    mimeType: "video/VP8",
    clockRate: 90000,
    preferredPayloadType: 96,
    parameters: {
      "x-google-start-bitrate": 1000 // Boost initial bitrate for high quality screen shares
    }
  }
];

// Initialize Mediasoup Workers
async function startMediasoup() {
  // Ensure the mediasoup-worker binary exists at runtime before booting workers
  const relativeWorkerPath = "node_modules/mediasoup/worker/out/Release/mediasoup-worker";
  const absWorkerPath = path.resolve(process.cwd(), relativeWorkerPath);

  if (!fs.existsSync(absWorkerPath)) {
    console.warn(`[SFU Voice Engine] 🚨 Mediasoup worker binary not found at: ${absWorkerPath}`);
    console.log(`[SFU Voice Engine] 🔄 Auto-executing get-worker.sh to retrieve the correct prebuilt binary...`);
    
    try {
      const scriptPath = path.resolve(process.cwd(), "get-worker.sh");
      if (fs.existsSync(scriptPath)) {
        // Run the getter script synchronously and pipe standard I/O so logs are visible
        execSync(`bash "${scriptPath}"`, { stdio: "inherit" });
        console.log(`[SFU Voice Engine] ✔ get-worker.sh recovery process completed. Checking binary...`);
        
        if (fs.existsSync(absWorkerPath)) {
          console.log(`[SFU Voice Engine] ✔ Excellent! mediasoup-worker successfully placed at: ${absWorkerPath}`);
        } else {
          console.error(`[SFU Voice Engine] ❌ Recovery script finished but binary is still missing.`);
        }
      } else {
        console.error(`[SFU Voice Engine] ❌ get-worker.sh script was not found at: ${scriptPath}`);
      }
    } catch (err: any) {
      console.error(`[SFU Voice Engine] ❌ Auto-recovery execution failed:`, err.message || err);
    }
  } else {
    console.log(`[SFU Voice Engine] ✔ Verified: mediasoup-worker is present at: ${absWorkerPath}`);
  }

  const numWorkers = os.cpus().length;
  console.log(`[SFU Voice Engine] Launching ${numWorkers} Mediasoup workers...`);
  
  for (let i = 0; i < numWorkers; i++) {
    const worker = await mediasoup.createWorker({
      logLevel: "warn",
      logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp"],
      rtcMinPort: 40000, // Explicitly defined UDP / TCP ports to configure in VPS Firewall
      rtcMaxPort: 49999
    });

    worker.on("died", (error) => {
      console.error(`[SFU Voice Engine] Mediasoup worker with PID ${worker.pid} has died!`, error || "");
      process.exit(1);
    });

    workers.push(worker);
  }
  console.log(`[SFU Voice Engine] Mediasoup workers initialized successfully.`);
}

function getNextWorker(): types.Worker {
  const worker = workers[nextWorkerIdx];
  nextWorkerIdx = (nextWorkerIdx + 1) % workers.length;
  return worker;
}

// Create WebRTC Transport
async function createWebRtcTransport(router: types.Router) {
  const transport = await router.createWebRtcTransport({
    listenInfos: [
      {
        protocol: "udp",
        ip: LISTEN_IP,
        announcedAddress: PUBLIC_IP
      },
      {
        protocol: "tcp",
        ip: LISTEN_IP,
        announcedAddress: PUBLIC_IP
      }
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: 800000
  });

  return transport;
}

// Socket signaling handler
io.on("connection", (socket: Socket) => {
  console.log(`[SFU Voice Signaling] New client connected. Socket ID: ${socket.id}`);
  let currentRoomId: string | null = null;
  let currentUserId: string | null = null;

  // 1. Join Room: Create or find Mediasoup router and return its RTP capabilities
  socket.on("join", async (data: { roomId: string; userId: string }, callback: Function) => {
    try {
      const { roomId, userId } = data;
      currentRoomId = roomId;
      currentUserId = userId;

      console.log(`[SFU Voice Signaling] User ${userId} wants to join Room ${roomId}`);

      let room = rooms.get(roomId);
      if (!room) {
        console.log(`[SFU Voice Engine] Room ${roomId} not found. Launching a dedicated Router instance...`);
        const worker = getNextWorker();
        const router = await worker.createRouter({ mediaCodecs });
        room = {
          id: roomId,
          router,
          peers: new Map()
        };
        rooms.set(roomId, room);
      }

      // Initialize peer representation
      const peer: Peer = {
        id: socket.id,
        userId,
        transports: new Map(),
        producers: new Map(),
        consumers: new Map()
      };
      
      room.peers.set(socket.id, peer);
      socket.join(roomId);

      // Return Router RTP capabilities to the client so the client-side Device can load them
      callback({
        success: true,
        routerRtpCapabilities: room.router.rtpCapabilities
      });

      console.log(`[SFU Voice Signaling] User ${userId} connected successfully to WebRTC Room ${roomId}`);
    } catch (err: any) {
      console.error(`[SFU Voice Signaling] Error joining room:`, err);
      callback({ success: false, error: err.message });
    }
  });

  // 2. Create WebRTC Transport (For Sending or Receiving tracks)
  socket.on("createWebRtcTransport", async (data: { direction: "send" | "recv" }, callback: Function) => {
    try {
      if (!currentRoomId) throw new Error("No active room session found for transport creation.");
      const room = rooms.get(currentRoomId);
      if (!room) throw new Error("Room structure is missing on server.");

      const peer = room.peers.get(socket.id);
      if (!peer) throw new Error("Peer session not initialized.");

      const transport = await createWebRtcTransport(room.router);
      peer.transports.set(transport.id, transport);

      // Listen on transport events to clean up when closed
      transport.on("dtlsstatechange", (dtlsState) => {
        if (dtlsState === "closed" || dtlsState === "failed") {
          console.log(`[SFU Voice Engine] DTLS state closed/failed for transport: ${transport.id}`);
          transport.close();
        }
      });

      callback({
        success: true,
        params: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters
        }
      });
    } catch (err: any) {
      console.error(`[SFU Voice Engine] Create WebRTC Transport error:`, err);
      callback({ success: false, error: err.message });
    }
  });

  // 3. Connect WebRTC Transport
  socket.on("connectWebRtcTransport", async (data: { transportId: string; dtlsParameters: any }, callback: Function) => {
    try {
      if (!currentRoomId) throw new Error("No active room session.");
      const room = rooms.get(currentRoomId)!;
      const peer = room.peers.get(socket.id)!;
      const transport = peer.transports.get(data.transportId);

      if (!transport) throw new Error(`Transport not found on server.`);

      await transport.connect({ dtlsParameters: data.dtlsParameters });
      console.log(`[SFU Voice Engine] WebRTC Transport ${data.transportId} connected successfully.`);
      callback({ success: true });
    } catch (err: any) {
      console.error(`[SFU Voice Engine] Connect Transport error:`, err);
      callback({ success: false, error: err.message });
    }
  });

  // 4. Produce Real-time Track (Produce Mic or Screen Share)
  socket.on("produce", async (data: { transportId: string; kind: "audio" | "video"; rtpParameters: any; appData?: any }, callback: Function) => {
    try {
      if (!currentRoomId) throw new Error("No active room session.");
      const room = rooms.get(currentRoomId)!;
      const peer = room.peers.get(socket.id)!;
      const transport = peer.transports.get(data.transportId);

      if (!transport) throw new Error(`Send Transport not found.`);

      // Optional AppData (helps identify screenshares from audio mics in consumer loop)
      const appData = data.appData || {};
      
      const producer = await transport.produce({
        kind: data.kind,
        rtpParameters: data.rtpParameters,
        appData: { ...appData, userId: peer.userId }
      });

      peer.producers.set(producer.id, producer);

      // Handle bitrate limit: set voice quality to around 40kbps max to prevent mobile congestion
      if (data.kind === "audio") {
        await transport.setMaxIncomingBitrate(48000); 
      }

      callback({
        success: true,
        id: producer.id
      });

      // Broadcast to other peers in the room that a new WebRTC producer has joined
      socket.to(currentRoomId).emit("newProducer", {
        producerId: producer.id,
        userId: peer.userId,
        kind: data.kind,
        appData: producer.appData
      });

      console.log(`[SFU Voice Engine] Peer ${peer.userId} started producing track of type [${data.kind}]`);
    } catch (err: any) {
      console.error(`[SFU Voice Engine] Produce track error:`, err);
      callback({ success: false, error: err.message });
    }
  });

  // 5. Query Active Producers (To help fresh joiners match active streams)
  socket.on("getProducers", (callback: Function) => {
    try {
      if (!currentRoomId) throw new Error("No active room session.");
      const room = rooms.get(currentRoomId)!;
      
      const producerList: any[] = [];
      room.peers.forEach((peer) => {
        if (peer.id !== socket.id) {
          peer.producers.forEach((producer) => {
            producerList.push({
              producerId: producer.id,
              userId: peer.userId,
              kind: producer.kind,
              appData: producer.appData
            });
          });
        }
      });

      callback({ success: true, producers: producerList });
    } catch (err: any) {
      callback({ success: false, error: err.message });
    }
  });

  // 6. Consume Remote Track
  socket.on("consume", async (data: { rtpCapabilities: any; producerId: string; transportId: string }, callback: Function) => {
    try {
      if (!currentRoomId) throw new Error("No active room session.");
      const room = rooms.get(currentRoomId)!;
      const peer = room.peers.get(socket.id)!;
      const transport = peer.transports.get(data.transportId);

      if (!transport) throw new Error(`Receive Transport not found.`);

      // Verify router is capable of forwarding media with client's RTP capability
      if (!room.router.canConsume({ producerId: data.producerId, rtpCapabilities: data.rtpCapabilities })) {
        throw new Error("Router cannot consume selected track with current capabilities.");
      }

      const consumer = await transport.consume({
        producerId: data.producerId,
        rtpCapabilities: data.rtpCapabilities,
        paused: true // Handshake starts paused, resume when ready
      });

      peer.consumers.set(consumer.id, consumer);

      // Clean up consumer reference when closed on transport
      consumer.on("transportclose", () => {
        peer.consumers.delete(consumer.id);
      });

      consumer.on("producerclose", () => {
        peer.consumers.delete(consumer.id);
        socket.emit("consumerClosed", { consumerId: consumer.id });
      });

      callback({
        success: true,
        params: {
          id: consumer.id,
          producerId: data.producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters
        }
      });

      console.log(`[SFU Voice Engine] Peer ${peer.userId} set up consumer for producer ${data.producerId}`);
    } catch (err: any) {
      console.error(`[SFU Voice Engine] Consume track error:`, err);
      callback({ success: false, error: err.message });
    }
  });

  // 7. Resume Consumer (After establishing transport connection)
  socket.on("resumeConsumer", async (data: { consumerId: string }, callback?: Function) => {
    try {
      if (!currentRoomId) throw new Error("No active room session.");
      const room = rooms.get(currentRoomId)!;
      const peer = room.peers.get(socket.id)!;
      const consumer = peer.consumers.get(data.consumerId);

      if (!consumer) throw new Error(`Consumer not found.`);

      await consumer.resume();
      if (typeof callback === "function") {
        callback({ success: true });
      }
      console.log(`[SFU Voice Engine] Consumer ${data.consumerId} is now active and playing.`);
    } catch (err: any) {
      if (typeof callback === "function") {
        callback({ success: false, error: err.message });
      } else {
        console.error(`[SFU Voice Engine] Failed to resume consumer ${data.consumerId}:`, err);
      }
    }
  });

  // 8. Close / Stops sharing a physical producer
  socket.on("closeProducer", async (data: { producerId: string }, callback?: Function) => {
    try {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId)!;
      const peer = room.peers.get(socket.id)!;
      const producer = peer.producers.get(data.producerId);

      if (producer) {
        producer.close();
        peer.producers.delete(data.producerId);
        socket.to(currentRoomId).emit("producerClosed", { producerId: data.producerId });
        console.log(`[SFU Voice Engine] Closed producer: ${data.producerId}`);
      }
      if (callback) callback({ success: true });
    } catch (e: any) {
      if (callback) callback({ success: false, error: e.message });
    }
  });

  // 9. Client leaves room manually
  const cleanupPeer = async () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const peer = room.peers.get(socket.id);
    if (!peer) return;

    console.log(`[SFU Voice Signaling] Cleaning up WebRTC trace for Peer ${peer.userId}`);

    // Stop and close all producers (tells clients to remove remote streams)
    peer.producers.forEach((producer: types.Producer) => {
      producer.close();
      if (currentRoomId) {
        socket.to(currentRoomId).emit("producerClosed", { producerId: producer.id });
      }
    });

    // Close all consumers
    peer.consumers.forEach((consumer: types.Consumer) => consumer.close());

    // Close all peer WebRTC Transports (frees UDP ports in pool)
    peer.transports.forEach((transport: types.WebRtcTransport) => transport.close());

    room.peers.delete(socket.id);

    // If room has no active users left, terminate the Mediasoup Router
    if (room.peers.size === 0) {
      console.log(`[SFU Voice Engine] Room ${currentRoomId} is fully empty. Retiring Mediasoup Router instance.`);
      room.router.close();
      rooms.delete(currentRoomId);
    }
  };

  socket.on("leave", async () => {
    await cleanupPeer();
    currentRoomId = null;
  });

  socket.on("disconnect", async () => {
    console.log(`[SFU Voice Signaling] Client disconnected: ${socket.id}`);
    await cleanupPeer();
  });
});

// Run server and launch Mediasoup Workers sequentially
startMediasoup().then(() => {
  httpServer.listen(PORT as any, LISTEN_IP, () => {
    console.log(`\n======================================================`);
    console.log(` LOXX VOIP MEDIA SERVER RUNNING`);
    console.log(` URL: http://${LISTEN_IP}:${PORT}`);
    console.log(` Routing IP: ${PUBLIC_IP}`);
    console.log(` WebSocket Signaling active on port: ${PORT}`);
    console.log(` WebRTC Mediasoup UDP Ports: [40000 -> 49999]`);
    console.log(`======================================================\n`);
  });
}).catch((err) => {
  console.error("FATAL: Mediasoup workers failed to boot", err);
  process.exit(1);
});
