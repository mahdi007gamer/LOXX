import prisma from "../utils/prisma.js";

export class LobbyService {
  static async createLobby(userId: string, data: any) {
    return prisma.lobby.create({
      data: {
        gameId: data.game_id || data.gameId,
        title: data.title,
        hostId: userId,
        maxPlayers: data.max_players || data.maxPlayers || 5,
        password: data.password,
        region: data.region || "IR",
        status: "WAITING",
        members: {
          create: {
            userId,
            role: "HOST",
            isReady: true
          }
        }
      },
      include: {
        members: { include: { user: { include: { profile: true } } } },
        game: true
      }
    });
  }

  static async getLobbies(filters: { gameId?: string; region?: string; status?: string } = {}) {
    return prisma.lobby.findMany({
      where: {
        gameId: filters.gameId,
        region: filters.region,
        status: filters.status || "WAITING"
      },
      include: {
        _count: { select: { members: true } },
        game: true,
        members: {
          include: { user: { select: { username: true } } }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  static async getLobbyById(lobbyId: string) {
    return prisma.lobby.findUnique({
      where: { id: lobbyId },
      include: {
        game: true,
        members: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        }
      }
    });
  }

  static async joinLobby(userId: string, lobbyId: string, password?: string) {
    const lobby = await prisma.lobby.findUnique({
      where: { id: lobbyId },
      include: { members: true }
    });

    if (!lobby) throw new Error("RESOURCE_NOT_FOUND");
    if (lobby.password && lobby.password !== password) throw new Error("INVALID_PASSWORD");
    if (lobby.members.length >= lobby.maxPlayers) throw new Error("LOBBY_FULL");

    // Check if already a member
    const existing = await prisma.lobbyMember.findUnique({
      where: { lobbyId_userId: { lobbyId, userId } }
    });

    if (existing) return existing;

    return prisma.lobbyMember.create({
      data: {
        lobbyId,
        userId,
        role: "PLAYER",
        isReady: false
      }
    });
  }

  static async leaveLobby(userId: string, lobbyId: string) {
    const lobby = await prisma.lobby.findUnique({
      where: { id: lobbyId },
      include: { members: true }
    });

    if (!lobby) return;

    await prisma.lobbyMember.delete({
      where: { lobbyId_userId: { lobbyId, userId } }
    }).catch(() => {});

    // If host leaves, transfer host or delete lobby
    if (lobby.hostId === userId) {
      const remainingMembers = lobby.members.filter(m => m.userId !== userId);
      if (remainingMembers.length > 0) {
        await prisma.lobby.update({
          where: { id: lobbyId },
          data: { hostId: remainingMembers[0].userId }
        });
        await prisma.lobbyMember.update({
          where: { lobbyId_userId: { lobbyId, userId: remainingMembers[0].userId } },
          data: { role: "HOST" }
        });
      } else {
        await prisma.lobby.delete({ where: { id: lobbyId } });
      }
    }
  }

  static async toggleReady(userId: string, lobbyId: string, ready: boolean = true) {
    return prisma.lobbyMember.update({
      where: { lobbyId_userId: { lobbyId, userId } },
      data: { isReady: ready }
    });
  }

  static async updateMicStatus(userId: string, lobbyId: string, muted: boolean) {
    return prisma.lobbyMember.update({
      where: { lobbyId_userId: { lobbyId, userId } },
      data: { micStatus: !muted } // DB uses micStatus (true = on)
    });
  }
}
