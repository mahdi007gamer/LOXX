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
import authRoutes from "./server/routes/auth.routes.ts";
import userRoutes from "./server/routes/user.routes.ts";
import friendshipRoutes from "./server/routes/friendship.routes.ts";
import lobbyRoutes from "./server/routes/lobby.routes.ts";
import rankingRoutes from "./server/routes/ranking.routes.ts";
import gameRoutes from "./server/routes/game.routes.ts";
import notificationRoutes from "./server/routes/notification.routes.ts";
import adminRoutes from "./server/routes/admin.routes.ts";
import settingsRoutes from "./server/routes/settings.routes.ts";
import { setupWebSockets } from "./server/sockets/index.ts";
import { setIO } from "./server/utils/socket.ts";
import prisma from "./server/utils/prisma.ts";
import { errorHandler } from "./server/middleware/error.middleware.ts";

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

  setIO(io);
  app.set("io", io);

  // Basic Middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
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
  app.use("/api/v1/settings", settingsRoutes);
  
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
