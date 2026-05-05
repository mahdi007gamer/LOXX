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

    const broadcastLobbyUpdate = async (lobbyId: string) => {
      const lobby = await prisma.lobby.findUnique({
        where: { id: lobbyId },
        include: { 
          game: true,
          members: { include: { user: { include: { profile: true } } } } 
        }
      });

      if (lobby) {
        let status = lobby.status;
        if (status === "WAITING" && lobby.members.length >= 2 && lobby.members.every(m => m.isReady || m.userId === lobby.hostId)) {
          status = "READY";
        }

        lobbyNs.to(`lobby:${lobbyId}`).emit("lobby_update", {
          id: lobby.id,
          gameId: lobby.gameId,
          gameTitle: lobby.game.title,
          title: lobby.title,
          status: status,
          maxPlayers: lobby.maxPlayers,
          hostId: lobby.hostId,
          region: lobby.region,
          createdAt: lobby.createdAt,
          players: lobby.members.map(m => ({
            userId: m.userId,
            username: m.user.username,
            role: m.role,
            isReady: m.isReady
          }))
        });
      }
    };

    socket.on("join_lobby", async (data: { lobbyId: string }) => {
      const { lobbyId } = data;
      socket.join(`lobby:${lobbyId}`);
      
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        lobbyNs.to(`lobby:${lobbyId}`).emit("player_joined", { 
          userId, 
          username: user?.username || "Unknown" 
        });
        await broadcastLobbyUpdate(lobbyId);
      } catch (err) {
        socket.emit("error", { message: "Could not join lobby" });
      }
    });

    socket.on("leave_lobby", async (data: { lobbyId: string }) => {
      const { lobbyId } = data;
      socket.leave(`lobby:${lobbyId}`);
      
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        lobbyNs.to(`lobby:${lobbyId}`).emit("player_left", { 
          userId, 
          username: user?.username || "Unknown" 
        });
        // Remove from DB if necessary, but here we just leave the socket room
        // Real logic should probably remove LobbyMember record too
        await prisma.lobbyMember.delete({
          where: { lobbyId_userId: { lobbyId, userId } }
        }).catch(() => {});

        await broadcastLobbyUpdate(lobbyId);
      } catch (err) {
        socket.emit("error", { message: "Could not leave lobby" });
      }
    });

    socket.on("toggle_ready", async (data: { lobbyId: string }) => {
      const { lobbyId } = data;
      try {
        const member = await prisma.lobbyMember.findUnique({
          where: { lobbyId_userId: { lobbyId, userId } }
        });
        if (member) {
          await prisma.lobbyMember.update({
            where: { lobbyId_userId: { lobbyId, userId } },
            data: { isReady: !member.isReady }
          });
          await broadcastLobbyUpdate(lobbyId);
        }
      } catch (err) {
        socket.emit("error", { message: "Failed to toggle ready status" });
      }
    });

    socket.on("invite_player", async (data: { lobbyId: string, targetUserId: string }) => {
      const { lobbyId, targetUserId } = data;
      // Emit to the target user in the notification namespace
      notifyNs.to(`user:${targetUserId}`).emit("notification", {
        type: "LOBBY_INVITE",
        data: { lobbyId, fromUserId: userId }
      });
    });

    socket.on("start_match", async (data: { lobbyId: string }) => {
      const { lobbyId } = data;
      try {
        const lobby = await prisma.lobby.findUnique({ where: { id: lobbyId } });
        if (lobby && lobby.hostId === userId) {
          await prisma.lobby.update({
            where: { id: lobbyId },
            data: { status: "STARTING" }
          });
          await broadcastLobbyUpdate(lobbyId);
        }
      } catch (err) {
        socket.emit("error", { message: "Failed to start match" });
      }
    });

    socket.on("cancel_match", async (data: { lobbyId: string }) => {
      const { lobbyId } = data;
      try {
        const lobby = await prisma.lobby.findUnique({ where: { id: lobbyId } });
        if (lobby && lobby.hostId === userId) {
          await prisma.lobby.update({
            where: { id: lobbyId },
            data: { status: "WAITING" }
          });
          await broadcastLobbyUpdate(lobbyId);
        }
      } catch (err) {
        socket.emit("error", { message: "Failed to cancel match" });
      }
    });

    socket.on("reopen_lobby", async (data: { lobbyId: string }) => {
      const { lobbyId } = data;
      try {
        const lobby = await prisma.lobby.findUnique({ where: { id: lobbyId } });
        if (lobby && lobby.hostId === userId) {
          await prisma.lobby.update({
            where: { id: lobbyId },
            data: { status: "WAITING" }
          });
          await broadcastLobbyUpdate(lobbyId);
        }
      } catch (err) {
        socket.emit("error", { message: "Failed to reopen lobby" });
      }
    });

    socket.on("start_match_confirm", async (data: { lobbyId: string }) => {
      const { lobbyId } = data;
      try {
        const lobby = await prisma.lobby.findUnique({ where: { id: lobbyId } });
        if (lobby && lobby.hostId === userId) {
          await prisma.lobby.update({
            where: { id: lobbyId },
            data: { status: "IN_PROGRESS" }
          });
          await broadcastLobbyUpdate(lobbyId);
        }
      } catch (err) {
        socket.emit("error", { message: "Failed to confirm match start" });
      }
    });
  });

  // Chat Namespace
  chatNs.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    socket.on("join_chat", (data: { type: "lobby" | "channel" | "user", id: string }) => {
      if (data.type === "lobby") socket.join(`lobby:${data.id}`);
      if (data.type === "channel") socket.join(`channel:${data.id}`);
      if (data.type === "user") socket.join(`user:${userId}`); // Private chat room
    });

    socket.on("send_message", async (data: { target: { type: "lobby" | "channel" | "user", id: string }, content: string }) => {
      const { target, content } = data;
      
      try {
        const user = await prisma.user.findUnique({ 
          where: { id: userId },
          include: { profile: true } 
        });

        const messageData = {
          id: Math.random().toString(36).substr(2, 9),
          content,
          senderId: userId,
          senderName: user?.username || "Unknown",
          senderAvatar: user?.profile?.avatarUrl,
          createdAt: new Date(),
          targetType: target.type,
          targetId: target.id
        };

        if (target.type === "lobby") {
          chatNs.to(`lobby:${target.id}`).emit("new_message", messageData);
        } else if (target.type === "channel") {
          chatNs.to(`channel:${target.id}`).emit("new_message", messageData);
          // Also save to DB for channels
          await prisma.message.create({
            data: {
              content,
              senderId: userId,
              channelId: target.id
            }
          });
        } else if (target.type === "user") {
          // Private message
          chatNs.to(`user:${target.id}`).emit("new_message", messageData);
          socket.emit("new_message", messageData); // Echo to sender
        }
      } catch (err) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("chat.send", async (data, callback) => {
      // Maintaining legacy for now if needed
      const { target, content, tempId } = data;
      const room = target.type === "lobby" ? `lobby:${target.id}` : `channel:${target.id}`;
      
      const msg = await prisma.message.create({
        data: {
          content,
          senderId: userId,
          channelId: target.id 
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

  // Notify Namespace
  notifyNs.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    socket.join(`user:${userId}`);
  });

  console.log("WebSocket namespaces initialized");
}
