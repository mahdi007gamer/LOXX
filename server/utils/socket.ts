import { Server } from "socket.io";

let io: Server;

export const setIO = (instance: Server) => {
  io = instance;
};

export const getIO = () => io;

export const emitLobbyUpdate = () => {
    if (io) {
        io.of("/lobby").emit("lobby.list_updated");
    }
};

export const emitRankingUpdate = async () => {
    if (io) {
        // Since getLeaderboard is static and async, we need a way to call it here or just notify clients to refetch
        // LeaderboardPage expects the data in the event, so we fetch it
        // To avoid circular dependency, we might just emit a signal for now or pass the data
        io.of("/ranking").emit("ranking.tick_signal");
    }
};
