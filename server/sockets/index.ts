import { Server, Socket } from "socket.io";
import { AuthService } from "../services/auth.service.js";
import { RankingService } from "../services/ranking.service.js";
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
  const voiceNs = io.of("/voice");

  // Voice Namespace (WebRTC Signaling)
  voiceNs.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    socket.on("voice.join", (data: { roomId: string }) => {
      socket.join(`voice:${data.roomId}`);
      // Notify others in the room
      socket.to(`voice:${data.roomId}`).emit("voice.user_joined", { userId });
    });

    socket.on("voice.signal", (data: { targetUserId: string, signal: any }) => {
      // Direct signal to specific peer
      voiceNs.to(`user:${data.targetUserId}`).emit("voice.signal", { 
        fromUserId: userId, 
        signal: data.signal 
      });
    });

    socket.on("voice.leave", (data: { roomId: string }) => {
      socket.leave(`voice:${data.roomId}`);
      voiceNs.to(`voice:${data.roomId}`).emit("voice.user_left", { userId });
    });

    socket.on("voice.talking", (data: { roomId: string, isTalking: boolean }) => {
      voiceNs.to(`voice:${data.roomId}`).emit("voice.talking", { userId, isTalking: data.isTalking });
    });
  });

  // Presence Namespace
  presenceNs.on("connection", async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    socket.join(`user:${userId}`);

    // Initial state: Send online friends to the user
    // In a real app, we would query the user's friends and their online status
    socket.emit("presence.snapshot", { users: [] });

    socket.on("presence.update", async (data: { status: string, activity?: string }) => {
      // Update profile last activity
      await prisma.profile.update({
        where: { userId },
        data: { lastActivity: new Date() }
      }).catch(() => {});

      // Broadcast to all "ACCEPTED" friends
      // For simplicity, we broadcast to everyone for now, but in production, 
      // you would filter by a friendship room or individual user rooms.
      presenceNs.emit("presence.changed", { userId, ...data });
    });
  });

  // Lobby Namespace
  lobbyNs.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    const getLobbyFullData = async (lobbyId: string) => {
      const lobby = await prisma.lobby.findUnique({
        where: { id: lobbyId },
        include: { 
          game: true,
          members: { include: { user: { include: { profile: true } } } } 
        }
      });
      return lobby;
    };

    socket.on("lobby.join", async (data: { lobbyId: string, password?: string }, ack) => {
      const { lobbyId, password } = data;
      
      try {
        const lobby = await prisma.lobby.findUnique({
          where: { id: lobbyId },
          include: { members: true }
        });

        if (!lobby) throw new Error("RESOURCE_NOT_FOUND");
        if (lobby.password && lobby.password !== password) throw new Error("INVALID_PASSWORD");
        const existingMember = lobby.members.find(m => m.userId === userId);
        if (!existingMember && lobby.members.length >= lobby.maxPlayers) throw new Error("LOBBY_FULL");

        // Join DB
        const member = await prisma.lobbyMember.upsert({
          where: { lobbyId_userId: { lobbyId, userId } },
          update: {},
          create: { lobbyId, userId, role: "PLAYER", isReady: false }
        });

        socket.join(`lobby:${lobbyId}`);
        
        const user = await prisma.user.findUnique({ where: { id: userId } });
        
        // Broadcast joined event
        lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.member_joined", {
          user: { id: userId, username: user?.username, role: member.role },
          membersCount: lobby.members.length + 1
        });

        // Award XP for joining
        await RankingService.addXP(userId, 10, "LOBBY_JOIN");

        if (ack) {
          const updatedLobby = await getLobbyFullData(lobbyId);

          if (!updatedLobby) {
            return ack({ status: "error", error: { code: "NOT_FOUND", message: "Lobby not found" } });
          }

          ack({ 
            status: "ok", 
            data: { 
              id: lobbyId,
              title: updatedLobby.title,
              gameTitle: updatedLobby.game?.title,
              maxPlayers: updatedLobby.maxPlayers,
              hostId: updatedLobby.hostId,
              status: updatedLobby.status,
              mode: updatedLobby.mode,
              selectedMaps: updatedLobby.selectedMaps,
              description: updatedLobby.description,
              micRequired: updatedLobby.micRequired,
              isPrivate: updatedLobby.isPrivate,
              players: updatedLobby.members?.map(m => ({
                userId: m.userId,
                username: m.user.username,
                role: m.role,
                isReady: m.isReady,
                micMuted: !m.micStatus
              })) || [],
              you: { role: member.role, isReady: member.isReady, micMuted: !member.micStatus }
            } 
          });
        }
      } catch (err: any) {
        console.error("[Lobby Join Critical Error]", err);
        if (ack) ack({ status: "error", error: { code: err.code || "JOIN_FAILED", message: err.message || "Could not join lobby", details: err.stack } });
      }
    });

    socket.on("lobby.leave", async (data: { lobbyId: string }, ack) => {
      const { lobbyId } = data;
      socket.leave(`lobby:${lobbyId}`);
      
      try {
        const lobby = await prisma.lobby.findUnique({ where: { id: lobbyId } });
        
        await prisma.lobbyMember.delete({
          where: { lobbyId_userId: { lobbyId, userId } }
        }).catch(() => {});

        // If host leaves, delete lobby or transfer ownership
        if (lobby?.hostId === userId) {
          // For now, let's delete the lobby if the host leaves
          await prisma.lobby.delete({ where: { id: lobbyId } }).catch(() => {});
          lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.closed", { lobbyId });
        } else {
          const remainingLobby = await prisma.lobby.findUnique({ where: { id: lobbyId }, include: { members: true } });
          lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.member_left", { 
            userId, 
            membersCount: remainingLobby?.members.length || 0
          });
        }

        if (ack) ack({ status: "ok" });
      } catch (err) {
        if (ack) ack({ status: "error", error: { message: "Could not leave lobby" } });
      }
    });

    socket.on("lobby.ready", async (data: { lobbyId: string, ready: boolean }, ack) => {
      const { lobbyId, ready } = data;
      try {
        await prisma.lobbyMember.update({
          where: { lobbyId_userId: { lobbyId, userId } },
          data: { isReady: ready }
        });

        lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.member_updated", { 
          userId, 
          isReady: ready 
        });

        if (ack) ack({ status: "ok" });
      } catch (err) {
        if (ack) ack({ status: "error", error: { message: "Failed to ready up" } });
      }
    });

    socket.on("lobby.mic", async (data: { lobbyId: string, muted: boolean }, ack) => {
      const { lobbyId, muted } = data;
      try {
        await prisma.lobbyMember.update({
          where: { lobbyId_userId: { lobbyId, userId } },
          data: { micStatus: !muted }
        });

        lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.member_updated", { 
          userId, 
          micMuted: muted 
        });

        if (ack) ack({ status: "ok" });
      } catch (err) {
        if (ack) ack({ status: "error", error: { message: "Failed to update mic" } });
      }
    });

    socket.on("lobby.start", async (data: { lobbyId: string }) => {
      const { lobbyId } = data;
      try {
        const lobby = await prisma.lobby.findUnique({ where: { id: lobbyId } });
        if (lobby?.hostId !== userId) return;

        await prisma.lobby.update({
          where: { id: lobbyId },
          data: { status: "STARTING" }
        });

        lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.status_changed", { status: "STARTING" });
      } catch (err) {}
    });

    socket.on("start_match_confirm", async (data: { lobbyId: string }) => {
      const { lobbyId } = data;
      try {
        const lobby = await prisma.lobby.findUnique({ where: { id: lobbyId } });
        if (lobby?.hostId !== userId) return;

        await prisma.lobby.update({
          where: { id: lobbyId },
          data: { status: "IN_PROGRESS" }
        });

        lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.status_changed", { status: "IN_PROGRESS" });
      } catch (err) {}
    });

    socket.on("cancel_match", async (data: { lobbyId: string }) => {
      const { lobbyId } = data;
      try {
        const lobby = await prisma.lobby.findUnique({ where: { id: lobbyId } });
        if (lobby?.hostId !== userId) return;

        await prisma.lobby.update({
          where: { id: lobbyId },
          data: { status: "READY" }
        });

        lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.status_changed", { status: "READY" });
      } catch (err) {}
    });

    socket.on("reopen_lobby", async (data: { lobbyId: string }) => {
      const { lobbyId } = data;
      try {
        const lobby = await prisma.lobby.findUnique({ where: { id: lobbyId } });
        if (lobby?.hostId !== userId) return;

        await prisma.lobby.update({
          where: { id: lobbyId },
          data: { status: "WAITING" }
        });

        lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.status_changed", { status: "WAITING" });
      } catch (err) {}
    });
  });

  // Chat Namespace
  chatNs.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    socket.on("chat.join", (data: { type: "channel" | "lobby", id: string }) => {
      const room = data.type === "lobby" ? `lobby:${data.id}` : `channel:${data.id}`;
      socket.join(room);
    });

    socket.on("chat.send", async (data: { target: { type: "channel" | "lobby", id: string }, content: string, tempId: string, replyToId?: string }, ack) => {
      const { target, content, tempId, replyToId } = data;
      const room = target.type === "lobby" ? `lobby:${target.id}` : `channel:${target.id}`;
      
      try {
        const user = await prisma.user.findUnique({ 
          where: { id: userId },
          include: { profile: true }
        });

        if (target.type === "lobby") {
          // Do not save to DB for lobbies as they are ephemeral
          const msgPayload = {
            id: tempId || Date.now().toString(),
            from: { 
              userId, 
              username: user?.username, 
              membership: user?.profile?.membershipType || "NONE" 
            },
            content,
            createdAt: Date.now()
          };
          
          chatNs.to(room).emit("chat.message", msgPayload);
          if (ack) ack({ status: "ok", data: { tempId, messageId: msgPayload.id, createdAt: msgPayload.createdAt } });
          return;
        }

        const msg = await prisma.message.create({
          data: {
            content,
            senderId: userId,
            channelId: target.id, 
            replyToId: replyToId ? parseInt(replyToId) : undefined
          }
        });

        chatNs.to(room).emit("chat.message", {
          id: msg.id.toString(), // Use id consistently
          from: { 
            userId, 
            username: user?.username, 
            membership: user?.profile?.membershipType || "NONE" 
          },
          content,
          createdAt: Date.now()
        });

        if (ack) ack({ status: "ok", data: { tempId, messageId: msg.id.toString(), createdAt: Date.now() } });
      } catch (err) {
        if (ack) ack({ status: "error", error: { code: "INTERNAL_ERROR", message: "Failed to send message" } });
      }
    });
  });

  // Ranking Tick (Broadcasting every 15s as per contract)
  setInterval(async () => {
    const ranking = await RankingService.getLeaderboard("weekly");
    io.of("/ranking").emit("ranking.tick", ranking);
  }, 15000);

  // Notify Namespace
  notifyNs.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    socket.join(`user:${userId}`);
  });

  console.log("WebSocket namespaces initialized");
}
