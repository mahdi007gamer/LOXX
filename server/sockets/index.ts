import { Server, Socket } from "socket.io";
import { AuthService } from "../services/auth.service.js";
import prisma from "../utils/prisma.js";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function setupWebSockets(io: Server) {
  // Middleware for Auth
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.query.token as string || socket.handshake.auth.token as string;
    if (!token) return next(new Error("AUTH_EXPIRED"));

    const pureToken = token.replace("Bearer ", "");
    try {
      const decoded = AuthService.verifyAccessToken(pureToken);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error("AUTH_EXPIRED"));
    }
  });

  // Namespaces
  const presenceNs = io.of("/presence");
  const lobbyNs = io.of("/lobby");
  const chatNs = io.of("/chat");
  const notifyNs = io.of("/notify");

  // Presence Namespace
  presenceNs.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    socket.join(`user:${userId}`);

    socket.on("presence.update", (data) => {
      // Broadcast to friends
      socket.broadcast.emit("presence.changed", { userId, ...data });
    });
  });

  // Lobby Namespace
  lobbyNs.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    socket.on("lobby.join", async (data, callback) => {
      const { lobbyId } = data;
      socket.join(`lobby:${lobbyId}`);
      
      const lobby = await prisma.lobby.findUnique({
        where: { id: lobbyId },
        include: { members: { include: { user: { include: { profile: true } } } } }
      });

      if (lobby) {
        lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.member_joined", {
          user: { id: userId, username: "User" }, // Simplified
          membersCount: lobby.members.length
        });

        if (callback) callback({ status: "ok", data: { lobbyId, members: lobby.members } });
      }
    });

    socket.on("lobby.ready", async (data, callback) => {
      await prisma.lobbyMember.update({
        where: { lobbyId_userId: { lobbyId: data.lobbyId, userId } },
        data: { isReady: data.ready }
      });
      lobbyNs.to(`lobby:${data.lobbyId}`).emit("lobby.member_updated", { userId, isReady: data.ready });
      if (callback) callback({ status: "ok" });
    });
  });

  // Chat Namespace
  chatNs.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    socket.on("chat.send", async (data, callback) => {
      const { target, content, tempId } = data;
      const room = target.type === "lobby" ? `lobby:${target.id}` : `channel:${target.id}`;
      
      // Save to DB
      const msg = await prisma.message.create({
        data: {
          content,
          senderId: userId,
          channelId: target.id // Simplified: using target.id as channelId
        },
        include: { sender: true }
      });

      chatNs.to(room).emit("chat.message", {
        messageId: msg.id.toString(),
        from: { userId, username: msg.sender.username },
        content,
        createdAt: Date.now()
      });

      if (callback) callback({ status: "ok", data: { tempId, messageId: msg.id.toString() } });
    });
  });

  // Voice (Mediasoup Signaling)
  io.of("/voice").on("connection", (socket: AuthenticatedSocket) => {
    socket.on("voice.join", (data, callback) => {
      // Signaling logic would go here
      if (callback) callback({ status: "ok", rtpCapabilities: {} });
    });

    socket.on("voice.produce", (data, callback) => {
      if (callback) callback({ status: "ok", id: "producer-id" });
    });
  });

  console.log("WebSocket namespaces initialized");
}
