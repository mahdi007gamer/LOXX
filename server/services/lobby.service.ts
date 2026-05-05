import prisma from "../utils/prisma.js";

export class LobbyService {
  static async createLobby(userId: string, data: any) {
    return prisma.lobby.create({
      data: {
        gameId: data.game_id,
        title: data.title,
        hostId: userId,
        maxPlayers: data.max_players,
        password: data.password,
        region: data.region,
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
        members: { include: { user: { include: { profile: true } } } }
      }
    });
  }

  static async getLobbies(gameId?: string, region?: string) {
    return prisma.lobby.findMany({
      where: {
        gameId,
        region,
        status: "WAITING"
      },
      include: {
        members: true,
        game: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  static async joinLobby(userId: string, lobbyId: string, password?: string) {
    const lobby = await prisma.lobby.findUnique({
      where: { id: lobbyId },
      include: { members: true }
    });

    if (!lobby) throw new Error("Lobby not found");
    if (lobby.password && lobby.password !== password) throw new Error("Invalid password");
    if (lobby.members.length >= lobby.maxPlayers) throw new Error("Lobby full");

    return prisma.lobbyMember.create({
      data: {
        lobbyId,
        userId,
        role: "PLAYER",
        isReady: false
      }
    });
  }

  static async toggleReady(userId: string, lobbyId: string, ready: boolean) {
    return prisma.lobbyMember.update({
      where: { lobbyId_userId: { lobbyId, userId } },
      data: { isReady: ready }
    });
  }
}
