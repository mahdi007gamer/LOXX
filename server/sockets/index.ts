import { Server, Socket } from "socket.io";
import { AuthService } from "../services/auth.service.js";
import { RankingService } from "../services/ranking.service.js";
import prisma from "../utils/prisma.js";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function setupWebSockets(io: Server) {
  const authMiddleware = (socket: AuthenticatedSocket, next: any) => {
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
  };

  // Middleware for Auth
  io.use(authMiddleware);

  const userConnections = new Map<string, Set<string>>(); // userId -> Set of socketIds

  // Namespaces
  const presenceNs = io.of("/presence");
  const lobbyNs = io.of("/lobby");
  const chatNs = io.of("/chat");
  const notifyNs = io.of("/notify");
  const voiceNs = io.of("/voice");

  // Helper to handle user connection tracking and global presence broadcasting
  const updatePresence = async (userId: string, status: "online" | "offline") => {
    try {
      // Update DB if needed (optional, for persistency)
      await prisma.profile.update({
        where: { userId },
        data: { lastActivity: status === "online" ? new Date() : undefined }
      }).catch(() => {});

      // Broadcast to presence namespace
      presenceNs.emit("presence.changed", { userId, status });
    } catch (e) {}
  };

  const trackUser = (userId: string, socketId: string) => {
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId)!.add(socketId);
    
    if (userConnections.get(userId)!.size === 1) {
      updatePresence(userId, "online");
      return true;
    }
    return false;
  };

  const untrackUser = (userId: string, socketId: string) => {
    const connections = userConnections.get(userId);
    if (connections) {
      connections.delete(socketId);
      if (connections.size === 0) {
        userConnections.delete(userId);
        updatePresence(userId, "offline");
        return true;
      }
    }
    return false;
  };

  presenceNs.use(authMiddleware);
  lobbyNs.use(authMiddleware);
  chatNs.use(authMiddleware);
  notifyNs.use(authMiddleware);
  voiceNs.use(authMiddleware);

  // Voice Namespace (WebRTC Signaling)
  voiceNs.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    socket.join(`user:${userId}`);
    trackUser(userId, socket.id);

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

    socket.on("disconnect", () => {
      untrackUser(userId, socket.id);
    });
  });

  // Presence Namespace
  presenceNs.on("connection", async (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    if (!userId) return;

    socket.join(`user:${userId}`);

    const isFirst = trackUser(userId, socket.id);

    // Initial state: Send online status of current user connections
    try {
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: userId, status: "ACCEPTED" },
            { targetId: userId, status: "ACCEPTED" }
          ]
        }
      });
      
      const friendIds = friendships.map(f => f.requesterId === userId ? f.targetId : f.requesterId);
      const onlineFriends = friendIds.filter(id => userConnections.has(id));
      
      socket.emit("presence.snapshot", { 
        users: onlineFriends.map(id => ({ userId: id, status: "online" })) 
      });
    } catch (e) {}

    socket.on("presence.update", async (data: { status: string, activity?: string }) => {
      // Update profile last activity
      await prisma.profile.update({
        where: { userId },
        data: { lastActivity: new Date() }
      }).catch(() => {});

      presenceNs.emit("presence.changed", { userId, ...data });
    });

    socket.on("disconnect", () => {
      untrackUser(userId, socket.id);
    });
  });

  // Lobby Namespace
  lobbyNs.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    if (!userId) return;
    
    trackUser(userId, socket.id);

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
      if (!userId) return ack?.({ status: "error", error: { message: "Unauthorized" } });
      
      try {
        const lobby = await prisma.lobby.findUnique({
          where: { id: lobbyId },
          include: { members: true }
        });

        if (!lobby) throw new Error("RESOURCE_NOT_FOUND");
        if (lobby.status === "STARTING" || lobby.status === "IN_PROGRESS") throw new Error("LOBBY_STARTED");
        if (lobby.password && lobby.password !== password) throw new Error("INVALID_PASSWORD");
        const existingMember = lobby.members.find(m => m.userId === userId);
        if (!existingMember && lobby.members.length >= lobby.maxPlayers) throw new Error("LOBBY_FULL");

        // Check if already a member before upserting to know if we should increment
        const existingMemberRecord = await prisma.lobbyMember.findUnique({
          where: { lobbyId_userId: { lobbyId, userId } }
        });

        // Join DB
        const member = await prisma.lobbyMember.upsert({
          where: { lobbyId_userId: { lobbyId, userId } },
          update: {},
          create: { lobbyId, userId, role: "PLAYER", isReady: false }
        });

        // Increment total joined ONLY if it's a new join
        if (!existingMemberRecord) {
          await prisma.profile.update({
            where: { userId },
            data: { totalLobbiesJoined: { increment: 1 } }
          }).catch(() => {});
        }

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

        const remainingLobby = await prisma.lobby.findUnique({ 
          where: { id: lobbyId }, 
          include: { members: true } 
        });

        // If host leaves or no members left, delete lobby
        if (!remainingLobby || remainingLobby.hostId === userId || remainingLobby.members.length === 0) {
          await prisma.lobby.delete({ where: { id: lobbyId } }).catch(() => {});
          lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.closed", { lobbyId });
        } else {
          lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.member_left", { 
            userId, 
            membersCount: remainingLobby.members.length
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

    socket.on("lobby.update_settings", async (data: { lobbyId: string, isPrivate?: boolean, micRequired?: boolean }, ack) => {
      const { lobbyId, isPrivate, micRequired } = data;
      try {
        const lobby = await prisma.lobby.findUnique({ where: { id: lobbyId } });
        if (lobby?.hostId !== userId) {
          if (ack) ack({ status: "error", error: { message: "Only host can update settings" } });
          return;
        }
        await prisma.lobby.update({
          where: { id: lobbyId },
          data: {
            ...(isPrivate !== undefined && { isPrivate }),
            ...(micRequired !== undefined && { micRequired })
          }
        });
        
        lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.settings_updated", { lobbyId, isPrivate, micRequired });
        if (ack) ack({ status: "ok" });
      } catch (err) {
        if (ack) ack({ status: "error", error: { message: "Failed to update settings" } });
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

    socket.on("invite_player", async (data: { lobbyId: string, targetUserId: string }) => {
      try {
         const { lobbyId, targetUserId } = data;
         const lobby = await prisma.lobby.findUnique({ 
            where: { id: lobbyId },
            include: { game: true }
         });
         const fromUser = await prisma.user.findUnique({ where: { id: userId } });
         
         if (lobby && fromUser) {
             const payload = {
                lobbyId,
                fromId: userId,
                fromUsername: fromUser.username,
                gameTitle: lobby.game ? lobby.game.title : lobby.title
             };
             // Send to the target user via notify namespace
             notifyNs.to(`user:${targetUserId}`).emit("lobby.invite", payload);
         }
      } catch(e) {}
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

    socket.on("disconnect", async () => {
      const isLast = untrackUser(userId, socket.id);
      if (isLast) {
        // Find all lobbies the user is in and remove them
        const memberships = await prisma.lobbyMember.findMany({
          where: { userId },
          include: { lobby: { include: { members: true } } }
        });

        for (const m of memberships) {
          const lobbyId = m.lobbyId;
          const lobby = m.lobby;

          // Delete membership
          await prisma.lobbyMember.delete({
            where: { lobbyId_userId: { lobbyId, userId } }
          }).catch(() => {});

          const remainingMembers = lobby.members.filter(member => member.userId !== userId);

          // If host leaves or no members left, delete lobby
          if (!remainingMembers.length || lobby.hostId === userId) {
            await prisma.lobby.delete({ where: { id: lobbyId } }).catch(() => {});
            lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.closed", { lobbyId });
          } else {
            lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.member_left", { 
              userId, 
              membersCount: remainingMembers.length
            });
          }
        }
      }
    });
  });

  // Chat Namespace
  chatNs.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    if (!userId) return;
    trackUser(userId, socket.id);

    socket.on("chat.join", (data: { type: "channel" | "lobby", id: string }) => {
      const room = data.type === "lobby" ? `lobby:${data.id}` : `channel:${data.id}`;
      socket.join(room);
    });

    socket.on("disconnect", () => {
      untrackUser(userId, socket.id);
    });

    socket.on("chat.send", async (data: { target: { type: "channel" | "lobby" | "user", id: string }, content: string, tempId: string, replyToId?: string }, ack) => {
      const { target, content, tempId, replyToId } = data;
      
      try {
        const user = await prisma.user.findUnique({ 
          where: { id: userId },
          include: { profile: true }
        });

        if (target.type === "lobby") {
          const msgPayload = {
            id: tempId || Date.now().toString(),
            from: { 
              userId, 
              username: user?.username, 
              membership: user?.profile?.membershipType || "NONE" 
            },
            targetType: "lobby",
            targetId: target.id,
            content,
            createdAt: Date.now()
          };
          chatNs.to(`lobby:${target.id}`).emit("chat.message", msgPayload);
          if (ack) ack({ status: "ok", data: { tempId, messageId: msgPayload.id, createdAt: msgPayload.createdAt } });
          return;
        }
        
        if (target.type === "user") {
          const msgPayload = {
            id: tempId || Date.now().toString(),
            from: { 
              userId, 
              username: user?.username, 
              membership: user?.profile?.membershipType || "NONE" 
            },
            targetType: "user",
            targetId: target.id,
            content,
            createdAt: Date.now()
          };
          // Send to the other user and to self (for multi-device sync, if we had it, but here we just send to both)
          chatNs.to(`user:${target.id}`).emit("chat.message", msgPayload);
          chatNs.to(`user:${userId}`).emit("chat.message", msgPayload);
          if (ack) ack({ status: "ok", data: { tempId, messageId: msgPayload.id, createdAt: msgPayload.createdAt } });
          return;
        }

        const room = `channel:${target.id}`;

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
          targetType: "channel",
          targetId: target.id,
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
    trackUser(userId, socket.id);

    socket.on("disconnect", () => {
      untrackUser(userId, socket.id);
    });
  });

  console.log("WebSocket namespaces initialized");
}
