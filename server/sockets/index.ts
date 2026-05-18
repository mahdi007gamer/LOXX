import { Server, Socket } from "socket.io";
import { AuthService } from "../services/auth.service.ts";
import { RankingService } from "../services/ranking.service.ts";
import { emitLobbyUpdate } from "../utils/socket.ts";
import prisma from "../utils/prisma.ts";

import DOMPurify from "isomorphic-dompurify";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function setupWebSockets(io: Server) {
  const sanitizeMessage = (text: string) => {
    return DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [], // No tags allowed
      ALLOWED_ATTR: [],
    });
  };

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

  const formatUserForSocket = (user: any) => ({
    userId: user.id,
    username: user.username,
    membership: user.profile?.membershipType || "NONE",
    level: user.profile?.level || 1,
    avatar: user.profile?.avatarUrl,
    bannerUrl: user.profile?.bannerUrl,
    vipMetadata: user.profile?.vipMetadata,
    badges: user.badges?.map((ub: any) => ({ ...ub.badge, isPinned: ub.isPinned })) || []
  });

  // Namespaces
  const presenceNs = io.of("/presence");
  const lobbyNs = io.of("/lobby");
  const chatNs = io.of("/chat");
  const notifyNs = io.of("/notify");
  const voiceNs = io.of("/voice");

  // Periodically update lastActivity for all connected users (every 2 minutes)
  // This keeps them "online" in FriendshipService which checks for lastActivity < 5 mins
  setInterval(async () => {
    const activeUserIds = Array.from(userConnections.keys());
    if (activeUserIds.length > 0) {
      await prisma.profile.updateMany({
        where: { userId: { in: activeUserIds } },
        data: { lastActivity: new Date() }
      }).catch(() => {});
    }
  }, 2 * 60 * 1000);

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

      if (status === "offline") {
        // User fully disconnected from all tabs/namespaces
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
            emitLobbyUpdate();
          } else {
            lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.member_left", { 
              userId, 
              membersCount: remainingMembers.length
            });
            emitLobbyUpdate();
          }
        }
      }
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
          members: { 
            include: { 
              user: { 
                include: { 
                  profile: true,
                  badges: { include: { badge: true } }
                } 
              } 
            } 
          },
          messages: {
            take: 50,
            orderBy: { createdAt: "desc" },
            include: { 
              sender: { 
                include: { 
                  profile: true,
                  badges: { include: { badge: true } }
                } 
              } 
            }
          }
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

        // Award XP if first time join
        if (!existingMemberRecord) {
           await RankingService.addXP(userId, 10, "LOBBY_JOIN");
        }

        // Increment total joined ONLY if it's a new join
        if (!existingMemberRecord) {
          await prisma.profile.update({
            where: { userId },
            data: { totalLobbiesJoined: { increment: 1 } }
          }).catch(() => {});
        }

        socket.join(`lobby:${lobbyId}`);
        
        const user = await prisma.user.findUnique({ 
          where: { id: userId },
          include: { 
            profile: true,
            badges: { include: { badge: true } }
          } 
        });
        
        // Broadcast joined event
        lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.member_joined", {
          user: { 
            id: userId, 
            username: user?.username, 
            role: member.role,
            avatarUrl: user?.profile?.avatarUrl || (user as any)?.avatarUrl,
            bannerUrl: user?.profile?.bannerUrl || (user as any)?.avatarUrl,
            level: user?.profile?.level || 1,
            membership: user?.profile?.membershipType || "NONE",
            isVerified: user?.isVerified,
            vipMetadata: user?.profile?.vipMetadata ? JSON.parse(user.profile.vipMetadata.toString()) : undefined,
            badges: user?.badges?.map(ub => ({ ...ub.badge, isPinned: ub.isPinned })) || []
          },
          membersCount: lobby.members.length + 1
        });

        emitLobbyUpdate();

        // Check if lobby is now full
        if (lobby.members.length + 1 === lobby.maxPlayers) {
           // Award XP to host for full lobby
           await RankingService.addXP(lobby.hostId, 150, "LOBBY_FULL");
        }

        if (ack) {
          const updatedLobby = await getLobbyFullData(lobbyId) as any;

          if (!updatedLobby) {
            return ack({ status: "error", error: { code: "NOT_FOUND", message: "Lobby not found" } });
          }

          ack({ 
            status: "ok", 
            data: { 
              id: lobbyId,
              title: updatedLobby.title,
              gameId: updatedLobby.gameId,
              gameTitle: updatedLobby.game?.title,
              maxPlayers: updatedLobby.maxPlayers,
              hostId: updatedLobby.hostId,
              status: updatedLobby.status,
              mode: updatedLobby.mode,
              selectedMaps: updatedLobby.selectedMaps,
              description: updatedLobby.description,
              micRequired: updatedLobby.micRequired,
              isPrivate: updatedLobby.isPrivate,
              players: updatedLobby.members?.map((m: any) => ({
                userId: m.userId,
                username: m.user.username,
                role: m.role,
                isReady: m.isReady,
                micMuted: !m.micStatus,
                avatarUrl: m.user.profile?.avatarUrl || (m.user as any).avatarUrl,
                bannerUrl: m.user.profile?.bannerUrl || (m.user as any).avatarUrl,
                level: m.user.profile?.level || 1,
                membership: m.user.profile?.membershipType || "NONE",
                isVerified: m.user.isVerified,
                vipMetadata: m.user.profile?.vipMetadata ? JSON.parse(m.user.profile.vipMetadata.toString()) : undefined,
                badges: m.user.badges?.map((ub: any) => ({ ...ub.badge, isPinned: ub.isPinned })) || []
              })) || [],
              messages: updatedLobby.messages?.map((m: any) => ({
                id: m.id.toString(),
                from: {
                  userId: m.senderId,
                  username: m.sender.username,
                  membership: m.sender.profile?.membershipType || "NONE",
                  badges: m.sender.badges?.map((ub: any) => ({ ...ub.badge, isPinned: ub.isPinned })) || []
                },
                content: m.content,
                createdAt: m.createdAt.getTime(),
                targetType: "lobby",
                targetId: lobbyId
              })).reverse() || [],
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
          emitLobbyUpdate();
        } else {
          lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.member_left", { 
            userId, 
            membersCount: remainingLobby.members.length
          });
          emitLobbyUpdate();
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
        emitLobbyUpdate();
        if (ack) ack({ status: "ok" });
      } catch (err) {
        if (ack) ack({ status: "error", error: { message: "Failed to update settings" } });
      }
    });

    socket.on("lobby.kick", async (data: { lobbyId: string, targetUserId: string }, ack) => {
      const { lobbyId, targetUserId } = data;
      try {
        const lobby = await prisma.lobby.findUnique({ where: { id: lobbyId } });
        if (lobby?.hostId !== userId) {
          if (ack) ack({ status: "error", error: { message: "Only host can kick" } });
          return;
        }
        await prisma.lobbyMember.delete({
          where: { lobbyId_userId: { lobbyId, userId: targetUserId } }
        });
        
        lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.member_left", { userId: targetUserId, reason: "kicked" });
        
        // Disconnect the target user from the room
        const targetConnections = userConnections.get(targetUserId);
        if (targetConnections) {
          targetConnections.forEach(socketId => {
            const s = lobbyNs.sockets.get(socketId);
            if (s) s.leave(`lobby:${lobbyId}`);
          });
        }
        emitLobbyUpdate();
        if (ack) ack({ status: "ok" });
      } catch (err) {
        if (ack) ack({ status: "error", error: { message: "Failed to kick player" } });
      }
    });

    socket.on("lobby.ban", async (data: { lobbyId: string, targetUserId: string }, ack) => {
      const { lobbyId, targetUserId } = data;
      try {
        const lobby = await prisma.lobby.findUnique({ where: { id: lobbyId } });
        if (lobby?.hostId !== userId) {
          if (ack) ack({ status: "error", error: { message: "Only host can ban" } });
          return;
        }
        await prisma.lobbyMember.delete({
          where: { lobbyId_userId: { lobbyId, userId: targetUserId } }
        });
        
        // Add user to the ban list for this lobby
        await prisma.lobbyBan.create({
          data: { lobbyId, userId: targetUserId }
        }).catch(() => {});
        
        lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.member_left", { userId: targetUserId, reason: "banned" });
        
        // Disconnect the target user
        const targetConnections = userConnections.get(targetUserId);
        if (targetConnections) {
          targetConnections.forEach(socketId => {
            const s = lobbyNs.sockets.get(socketId);
            if (s) s.leave(`lobby:${lobbyId}`);
          });
        }
        emitLobbyUpdate();
        if (ack) ack({ status: "ok" });
      } catch (err) {
        if (ack) ack({ status: "error", error: { message: "Failed to ban player" } });
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
        emitLobbyUpdate();
        
        // Award XP for starting match
        await RankingService.addXP(userId, 20, "MATCH_START");
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
             if (lobby.hostId === userId) {
                // If it's the host inviting, delete any ban for this user
                await prisma.lobbyBan.deleteMany({
                   where: { lobbyId: lobbyId, userId: targetUserId }
                });
             }

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

    socket.on("lobby.chat.send", async (data: { content: string, tempId: string, target: any }, ack) => {
      const { content, tempId, target } = data;
      try {
        if (!target?.id) throw new Error("Missing lobby id");
        const lobbyId = target.id;

        const user = await prisma.user.findUnique({ 
          where: { id: userId }, 
          include: { 
            profile: true,
            badges: { include: { badge: true } }
          } 
        });

        if (!user) return;

        if (!user.isVerified && user.role !== "ADMIN") {
           if (ack) ack({ status: "error", error: { code: "NOT_VERIFIED", message: "لطفا ابتدا ایمیل خود را تایید کنید." } });
           return;
        }
        
        const member = await prisma.lobbyMember.findFirst({
           where: { userId, lobbyId }
        });
        if (!member) {
           if (ack) ack({ status: "error", error: { message: "Not in this lobby" } });
           return;
        }

        const safeContent = sanitizeMessage(filterProfanity(content));

        const msg = await prisma.message.create({
          data: {
            content: safeContent,
            senderId: userId,
            lobbyId,
          }
        }) as any;

        const msgPayload = {
          id: msg.id.toString(),
          tempId,
          from: { 
            userId, 
            username: user?.username, 
            membership: user?.profile?.membershipType || "NONE",
            level: user?.profile?.level || 1,
            avatar: user?.profile?.avatarUrl,
            bannerUrl: user?.profile?.bannerUrl,
            vipMetadata: user?.profile?.vipMetadata,
            badges: user?.badges?.map(ub => ({ ...ub.badge, isPinned: ub.isPinned })) || []
          },
          targetType: "lobby",
          targetId: lobbyId,
          content: safeContent,
          createdAt: msg.createdAt.getTime()
        };
        
        // Award XP for chat message
        await RankingService.addXP(userId, 10, "CHAT_MESSAGE");
        
        console.log(`[LOBBY CHAT] ${user?.username} sent message to ${lobbyId}`);
        lobbyNs.to(`lobby:${lobbyId}`).emit("chat.message", msgPayload);

        if (ack) ack({ status: "ok", data: { tempId, messageId: msg.id.toString(), createdAt: msg.createdAt.getTime() } });
      } catch (err: any) {
        console.error("Lobby Chat Error:", err);
        if (ack) ack({ status: "error", error: { message: "Failed to send message: " + err.message } });
      }
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
        emitLobbyUpdate();
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
        emitLobbyUpdate();
      } catch (err) {}
    });

    socket.on("disconnect", async () => {
      untrackUser(userId, socket.id);
    });
  });

  const userRatings = new Map<string, number[]>();
  const RATE_LIMIT_COUNT = 5;
  const RATE_LIMIT_WINDOW_MS = 10000;
  
  const PROFANITY_WORDS = ["fuck", "shit", "bitch", "asshole", "کیر", "کون", "کس", "عن", "جنده", "دیوث", "بیشعور"];
  function filterProfanity(text: string): string {
    let filtered = text;
    for (const word of PROFANITY_WORDS) {
      const regex = new RegExp(word, "gi");
      filtered = filtered.replace(regex, "***");
    }
    return filtered;
  }

  // Chat Namespace
  chatNs.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    if (!userId) return;
    socket.join(`user:${userId}`);
    trackUser(userId, socket.id);

    socket.on("chat.typing", async (typingData: { target: { type: "channel" | "lobby" | "user", id: string }, isTyping: boolean }) => {
      const typingRoom = typingData.target.type === "lobby" ? `lobby:${typingData.target.id}` : typingData.target.type === "user" ? `user:${typingData.target.id}` : `channel:${typingData.target.id}`;
      const typingUser = await prisma.user.findUnique({ where: { id: userId } });
      socket.to(typingRoom).emit("chat.typing", { 
         targetId: typingData.target.id,
         userId, 
         username: typingUser?.username, 
         isTyping: typingData.isTyping 
      });
    });

    socket.on("chat.reaction", async (data: { messageId: string, emoji: string }) => {
      try {
        const messageId = parseInt(data.messageId);
        if (isNaN(messageId)) return;

        const message = await prisma.message.findUnique({
          where: { id: messageId }
        });
        if (!message) return;

        let reactions = message.reactions ? JSON.parse(message.reactions) : [];
        const reactionIndex = reactions.findIndex((r: any) => r.emoji === data.emoji);

        if (reactionIndex > -1) {
          const userIndex = reactions[reactionIndex].users.indexOf(userId);
          if (userIndex > -1) {
            reactions[reactionIndex].users.splice(userIndex, 1);
            reactions[reactionIndex].count--;
          } else {
            reactions[reactionIndex].users.push(userId);
            reactions[reactionIndex].count++;
          }
          if (reactions[reactionIndex].count <= 0) {
            reactions.splice(reactionIndex, 1);
          }
        } else {
          reactions.push({ emoji: data.emoji, count: 1, users: [userId] });
        }

        await prisma.message.update({
          where: { id: messageId },
          data: { reactions: JSON.stringify(reactions) }
        });

        const room = message.channelId ? `channel:${message.channelId}` : message.lobbyId ? `lobby:${message.lobbyId}` : `user:${message.receiverId || message.senderId}`;
        chatNs.to(room).emit("chat.reaction", { 
           messageId: data.messageId, 
           reactions 
        });
      } catch (err) {
        console.error("Reaction error:", err);
      }
    });

    socket.on("chat.delete", async (data: { messageId: string }) => {
      try {
        const messageId = parseInt(data.messageId);
        if (isNaN(messageId)) return;

        const message = await prisma.message.findUnique({
          where: { id: messageId }
        });

        if (!message) return;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        const canDelete = message.senderId === userId || user?.role === "ADMIN";

        if (!canDelete) return;

        if (message.channelId === "news") {
          await prisma.message.delete({ where: { id: messageId } });
          chatNs.to(`channel:${message.channelId}`).emit("chat.message_removed", { messageId: data.messageId });
          return;
        }

        await prisma.message.update({
          where: { id: messageId },
          data: { isDeleted: true, content: "این پیام حذف شده است." }
        });

        const room = message.channelId ? `channel:${message.channelId}` : message.lobbyId ? `lobby:${message.lobbyId}` : `user:${message.receiverId || message.senderId}`;
        chatNs.to(room).emit("chat.delete", { messageId: data.messageId });
      } catch (err) {
        console.error("Delete error:", err);
      }
    });

    socket.on("chat.join", async (data: { type: "channel" | "lobby" | "user", id: string }, ack) => {
      const room = data.type === "lobby" ? `lobby:${data.id}` : data.type === "user" ? `user:${data.id}` : `channel:${data.id}`;
      socket.join(room);
      console.log(`[CHAT] User ${userId} joined room ${room}`);

      // Fetch history for channel
      try {
        let memberCount = await prisma.user.count();
        if (data.type === "channel") {
           // If it's a game channel, count users who have this game in myGames
           if (data.id !== "news" && data.id !== "general" && data.id !== "lfg") {
             memberCount = await prisma.userGame.count({
               where: { gameId: data.id }
             });
           }

           const messages = await prisma.message.findMany({
             where: { channelId: data.id },
             take: 50,
             orderBy: { createdAt: "desc" },
             include: { sender: { include: { profile: true } } }
           });

           const formatted = messages.map(msg => ({
              id: msg.id.toString(),
              from: {
                userId: msg.senderId,
                username: msg.sender.username,
                membership: msg.sender.profile?.membershipType || "NONE",
                level: msg.sender.profile?.level || 1,
                avatar: msg.sender.profile?.avatarUrl,
                bannerUrl: msg.sender.profile?.bannerUrl,
                vipMetadata: msg.sender.profile?.vipMetadata,
                isOnline: userConnections.has(msg.senderId)
              },
              targetType: "channel",
              targetId: data.id,
              content: msg.content,
              createdAt: msg.createdAt.getTime(),
              replyToId: msg.replyToId,
              reactions: msg.reactions ? JSON.parse(msg.reactions) : []
           })).reverse();
           
           if (ack) ack({ status: "ok", data: { messages: formatted, memberCount } });
        } else if (data.type === "user") {
           const messages = await prisma.message.findMany({
             where: { 
                OR: [
                  { senderId: userId, receiverId: data.id },
                  { senderId: data.id, receiverId: userId }
                ]
             },
             take: 50,
             orderBy: { createdAt: "desc" },
             include: { sender: { include: { profile: true } } }
           });

           const formatted = messages.map(msg => ({
              id: msg.id.toString(),
              from: {
                userId: msg.senderId,
                username: msg.sender.username,
                membership: msg.sender.profile?.membershipType || "NONE",
                level: msg.sender.profile?.level || 1,
                avatar: msg.sender.profile?.avatarUrl,
                bannerUrl: msg.sender.profile?.bannerUrl,
                vipMetadata: msg.sender.profile?.vipMetadata,
                isOnline: userConnections.has(msg.senderId)
              },
              targetType: "user",
              targetId: data.id,
              content: msg.content,
              createdAt: msg.createdAt.getTime(),
              replyToId: msg.replyToId,
              reactions: msg.reactions ? JSON.parse(msg.reactions) : []
           })).reverse();
           
           if (ack) ack({ status: "ok", data: { messages: formatted, memberCount: 2 } });
        } else if (data.type === "lobby") {
           const messages = await prisma.message.findMany({
             where: { lobbyId: data.id },
             take: 50,
             orderBy: { createdAt: "desc" },
             include: { sender: { include: { profile: true } } }
           });

           const formatted = messages.map(msg => ({
              id: msg.id.toString(),
              from: {
                userId: msg.senderId,
                username: msg.sender.username,
                membership: msg.sender.profile?.membershipType || "NONE",
                level: msg.sender.profile?.level || 1,
                avatar: msg.sender.profile?.avatarUrl,
                bannerUrl: msg.sender.profile?.bannerUrl,
                vipMetadata: msg.sender.profile?.vipMetadata,
                isOnline: userConnections.has(msg.senderId)
              },
              targetType: "lobby",
              targetId: data.id,
              content: msg.content,
              createdAt: msg.createdAt.getTime(),
              replyToId: msg.replyToId,
              reactions: msg.reactions ? JSON.parse(msg.reactions) : []
           })).reverse();
           
           if (ack) ack({ status: "ok", data: { messages: formatted, memberCount: 0 } });
        } else {
           if (ack) ack({ status: "ok", data: { messages: [], memberCount } });
        }
      } catch(e) {
         if (ack) ack({ status: "error" });
      }
    });

    socket.on("disconnect", () => {
      untrackUser(userId, socket.id);
    });

    socket.on("chat.send", async (data: { target: { type: "channel" | "lobby" | "user", id: string }, content: string, tempId: string, replyToId?: string }, ack) => {
      const { target, content, tempId, replyToId } = data;
      
      // Rate limiter
      const now = Date.now();
      const userTimestamps = userRatings.get(userId) || [];
      const recentTimestamps = userTimestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
      if (recentTimestamps.length >= RATE_LIMIT_COUNT) {
         if (ack) ack({ status: "error", error: { code: "RATE_LIMIT", message: "تعداد پیام‌ها بیش از حد مجاز است. کمی صبر کنید." } });
         return;
      }
      recentTimestamps.push(now);
      userRatings.set(userId, recentTimestamps);

      const user = await prisma.user.findUnique({ 
        where: { id: userId },
        include: { 
          profile: true,
          badges: {
            include: { badge: true }
          }
        }
      });

      if (!user) return;

      if (!user.isVerified && user.role !== "ADMIN") {
        if (ack) ack({ status: "error", error: { code: "NOT_VERIFIED", message: "لطفا ابتدا ایمیل خود را تایید کنید." } });
        return;
      }

      // News channel admin check
      if (target.type === "channel" && target.id === "news") {
        if (user.role !== "ADMIN") {
          if (ack) ack({ status: "error", error: { code: "FORBIDDEN", message: "فقط ادمین‌ها می‌توانند در این کانال پیام ارسال کنند." } });
          return;
        }
      }

      // Max length and image detection
      const isImageMessage = content.includes("[IMAGE]:");
      const maxLength = (user.role === "ADMIN" || isImageMessage) ? 1000000 : 300; 

      if (content.length > maxLength) {
        if (ack) ack({ status: "error", error: { code: "TOO_LONG", message: "طول پیام بیش از حد مجاز است." } });
        return;
      }

      // Check for Admin only channels
      const isAdminOnlyChannel = target.id === "news";
      if (isAdminOnlyChannel) {
         const requestingUser = await prisma.user.findUnique({ where: { id: userId } });
         if (requestingUser?.role !== "ADMIN") {
            if (ack) ack({ status: "error", error: { code: "PERMISSION_DENIED", message: "فقط ادمین‌ها می‌توانند در این کانال پیام ارسال کنند." } });
            return;
         }
      }

      // Profanity Filter
      let safeContent;
      if (isImageMessage) {
        const parts = content.split("[IMAGE]:");
        const filteredText = sanitizeMessage(filterProfanity(parts[0]));
        // Reconstruct with the untainted image data
        safeContent = filteredText + "[IMAGE]:" + parts.slice(1).join("[IMAGE]:");
      } else {
        safeContent = sanitizeMessage(filterProfanity(content));
      }

      console.log(`[CHAT] send target=${target.type}:${target.id} from=${userId} content="${safeContent}"`);
      
      try {
        const user = await prisma.user.findUnique({ 
          where: { id: userId },
          include: { 
            profile: true,
            badges: { include: { badge: true } }
          }
        });

        if (target.type === "lobby") {
          // Verify membership
          const membership = await prisma.lobbyMember.findUnique({
             where: { lobbyId_userId: { lobbyId: target.id, userId } }
          });
          if (!membership) throw new Error("NOT_MEMBER");

          const msg = await prisma.message.create({
            data: {
              content: safeContent,
              senderId: userId,
              lobbyId: target.id,
              replyToId: replyToId ? (typeof replyToId === 'string' ? parseInt(replyToId) : replyToId) : undefined
            },
            include: {
              replyTo: {
                include: {
                  sender: true
                }
              }
            }
          });

          const replyToData = msg.replyTo ? {
            id: msg.replyTo.id,
            user: msg.replyTo.sender.username,
            text: msg.replyTo.content
          } : undefined;

          const msgPayload = {
            id: msg.id.toString(),
            tempId,
            from: formatUserForSocket(user),
            targetType: "lobby",
            targetId: target.id,
            content: safeContent,
            createdAt: msg.createdAt.getTime(),
            replyToId: replyToId,
            replyTo: replyToData
          };
          
          chatNs.to(`lobby:${target.id}`).emit("chat.message", msgPayload);
          lobbyNs.to(`lobby:${target.id}`).emit("chat.message", msgPayload);
          
          if (ack) ack({ status: "ok", data: { tempId, messageId: msg.id.toString(), createdAt: msg.createdAt.getTime() } });
          return;
        }
        
        if (target.type === "user") {
          const msg = await prisma.message.create({
            data: {
              content: safeContent,
              senderId: userId,
              receiverId: target.id,
              replyToId: replyToId ? (typeof replyToId === 'string' ? parseInt(replyToId) : replyToId) : undefined
            },
            include: {
              replyTo: {
                include: {
                  sender: true
                }
              }
            }
          });

          const replyToData = msg.replyTo ? {
            id: msg.replyTo.id,
            user: msg.replyTo.sender.username,
            text: msg.replyTo.content
          } : undefined;

          const msgPayload = {
            id: msg.id.toString(),
            tempId,
            from: formatUserForSocket(user),
            targetType: "user",
            targetId: target.id,
            content: safeContent,
            createdAt: msg.createdAt.getTime(),
            replyToId: replyToId,
            replyTo: replyToData
          };
          chatNs.to(`user:${target.id}`).emit("chat.message", msgPayload);
          chatNs.to(`user:${userId}`).emit("chat.message", msgPayload);
          if (ack) ack({ status: "ok", data: { tempId, messageId: msg.id.toString(), createdAt: msg.createdAt.getTime() } });
          return;
        }

        const room = `channel:${target.id}`;

        // Ensure Channel exists
        await prisma.channel.upsert({
           where: { id: target.id },
           update: {},
           create: {
             id: target.id,
             title: target.id // or a mapped title
           }
        });

        const msg = await prisma.message.create({
          data: {
            content: safeContent,
            senderId: userId,
            channelId: target.id, 
            replyToId: replyToId ? (typeof replyToId === 'string' ? parseInt(replyToId) : replyToId) : undefined
          },
          include: {
            replyTo: {
              include: {
                sender: true
              }
            }
          }
        });

        const replyToData = msg.replyTo ? {
          id: msg.replyTo.id,
          user: msg.replyTo.sender.username,
          text: msg.replyTo.content
        } : undefined;

        chatNs.to(room).emit("chat.message", {
          id: msg.id.toString(),
          tempId: tempId,
          from: formatUserForSocket(user),
          targetType: "channel",
          targetId: target.id,
          content: safeContent,
          createdAt: msg.createdAt.getTime(),
          replyToId: replyToId,
          replyTo: replyToData
        });

        if (ack) ack({ status: "ok", data: { tempId, messageId: msg.id.toString(), createdAt: msg.createdAt.getTime() } });
      } catch (err) {
        console.error("[CHAT SEND ERROR]", err);
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
