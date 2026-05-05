import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./server/routes/auth.routes.js";
import userRoutes from "./server/routes/user.routes.js";
import friendshipRoutes from "./server/routes/friendship.routes.js";
import lobbyRoutes from "./server/routes/lobby.routes.js";
import rankingRoutes from "./server/routes/ranking.routes.js";
import gameRoutes from "./server/routes/game.routes.js";
import notificationRoutes from "./server/routes/notification.routes.js";
import adminRoutes from "./server/routes/admin.routes.js";
import { setupWebSockets } from "./server/sockets/index.js";
import prisma from "./server/utils/prisma.js";
import { errorHandler } from "./server/middleware/error.middleware.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Socket.io initialization
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.set("io", io);

  // Basic Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors({
    origin: true, // Reflect request origin
    credentials: true
  }));
  app.use(cookieParser());
  app.use(helmet({
    contentSecurityPolicy: false, // For development with Vite
  }));

  // API Routes (to be implemented)
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/user", userRoutes);
  app.use("/api/v1/profile", userRoutes); // Keep for compatibility if used elsewhere
  app.use("/api/v1/friends", friendshipRoutes);
  app.use("/api/v1/lobbies", lobbyRoutes);
  app.use("/api/v1/lobby", lobbyRoutes); // Alias for singular join
  app.use("/api/v1/games", gameRoutes);
  app.use("/api/v1/ranking", rankingRoutes);
  app.use("/api/v1/notifications", notificationRoutes);
  app.use("/api/v1/admin", adminRoutes);
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "LOXX Backend is running in Persian mode (UTF-8)" });
  });

  app.use(errorHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`LOXX Backend running on http://localhost:${PORT}`);
  });

  // WebSocket Handlers
  setupWebSockets(io);
}

startServer();
