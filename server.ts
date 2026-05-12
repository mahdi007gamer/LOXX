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
import paymentRoutes from "./server/routes/payment.routes.ts";
import uploadRoutes from "./server/routes/upload.routes.ts";
import eliteRoutes from "./server/routes/elite.routes.ts";
import badgeRoutes from "./server/routes/badge.routes.ts";
import { setupWebSockets } from "./server/sockets/index.ts";
import { setIO } from "./server/utils/socket.ts";
import prisma from "./server/utils/prisma.ts";
import { errorHandler } from "./server/middleware/error.middleware.ts";
import { generalLimiter } from "./server/middleware/rateLimit.middleware.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  // Socket.io initialization
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  setIO(io);
  app.set("io", io);
  app.set("trust proxy", 1);

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

  // Rate Limiting - Apply only to API routes
  app.use("/api", generalLimiter);

  // Serve uploads directory
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  app.use("/public", express.static(path.join(process.cwd(), "public")));

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
  app.use("/api/v1/payments", paymentRoutes);
  app.use("/api/v1/upload", uploadRoutes);
  app.use("/api/v1/elite", eliteRoutes);
  app.use("/api/v1/badges", badgeRoutes);
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "LOXX Backend is running in Persian mode (UTF-8)" });
  });

  app.use(errorHandler);

  // Elite messages cleanup job (every 12 hours)
  setInterval(async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      await prisma.message.deleteMany({
        where: {
          channel: {
            type: "ELITE"
          },
          createdAt: {
            lt: sevenDaysAgo
          }
        }
      });
      console.log("[CRON] Cleaned up older Elite group messages");
    } catch(err) {
      console.error("[CRON] Elite cleanup error", err);
    }
  }, 12 * 60 * 60 * 1000);

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
