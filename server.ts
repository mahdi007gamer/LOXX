import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { execSync } from "child_process";
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
import chatRoutes from "./server/routes/chat.routes.ts";
import reportRoutes from "./server/routes/report.routes.ts";
import webhookRoutes from "./server/routes/webhook.routes.ts";
import streamerRoutes from "./server/routes/streamer.routes.ts";
import emailRoutes from "./server/routes/email.routes.ts";
import musicbotRoutes from "./server/routes/musicbot.routes.ts";
import { BaleService } from "./server/services/bale.service.ts";
import { setupWebSockets } from "./server/sockets/index.ts";
import { setIO } from "./server/utils/socket.ts";
import prisma from "./server/utils/prisma.ts";
import { errorHandler } from "./server/middleware/error.middleware.ts";
import { generalLimiter } from "./server/middleware/rateLimit.middleware.ts";

dotenv.config();

// Debug & Clean Proxy Settings to prevent ECONNREFUSED (e.g. from GitHub update SSH tunnel proxy 127.0.0.1:2080)
const proxyVars = ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy'];
console.log("[DEBUG] Checking & cleaning system proxy variables to run cleanly without ECONNREFUSED:");
proxyVars.forEach(v => {
  if (process.env[v]) {
    console.log(`  Removing active proxy env var: ${v} = ${process.env[v]}`);
    delete process.env[v];
  }
});

import axios from "axios";
axios.defaults.proxy = false;

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  // Programmatic DB schema sync for production/Cloud Run fallback
  if (process.env.NODE_ENV === "production") {
    try {
      console.log("[DATABASE-SYNC] Ensuring database schema is synced with PostgreSQL...");
      execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
      console.log("[DATABASE-SYNC] Database schema synced successfully!");
    } catch (dbError) {
      console.error("[DATABASE-SYNC] Schema synchronization failed:", dbError);
    }
  }

  // Socket.io initialization
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: "/api/v1/socket.io",
    pingInterval: 10000,
    pingTimeout: 5000
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
  // Serve public directory both at /public and at root to ensure compatibility with Vite/Production
  const publicPath = path.join(process.cwd(), "public");
  app.use("/public", express.static(publicPath));
  app.use(express.static(publicPath));

  // Explicitly serve fonts with correct MIME types to fix decoding errors
  app.use("/fonts", express.static(path.join(publicPath, "fonts"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".woff2")) res.setHeader("Content-Type", "font/woff2");
      if (path.endsWith(".woff")) res.setHeader("Content-Type", "font/woff");
      if (path.endsWith(".ttf")) res.setHeader("Content-Type", "font/ttf");
    }
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
  app.use("/api/v1/payments", paymentRoutes);
  app.use("/api/v1/upload", uploadRoutes);
  app.use("/api/v1/elite", eliteRoutes);
  app.use("/api/v1/badges", badgeRoutes);
  app.use("/api/v1/chat", chatRoutes);
  app.use("/api/v1/reports", reportRoutes);
  app.use("/api/v1/webhooks", webhookRoutes);
  app.use("/api/v1/streamers", streamerRoutes);
  app.use("/api/v1/email", emailRoutes);
  app.use("/api/v1/musicbot", musicbotRoutes);
  
  // Audio Proxy Route
  app.get("/api/v1/proxy/audio", async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl) return res.status(400).json({ error: "No url provided" });
      
      const { default: axios } = await import("axios");
      const headersToForward: Record<string, string> = { "User-Agent": "Mozilla/5.0" };
      if (req.headers.range) {
        headersToForward["Range"] = req.headers.range as string;
      }
      
      const proxyRes = await axios.get(targetUrl, {
        responseType: "stream",
        headers: headersToForward,
        proxy: false,
        validateStatus: (status) => status >= 200 && status < 300 // Accept 200 and 206
      });
      
      res.status(proxyRes.status);
      res.setHeader("Content-Type", String(proxyRes.headers["content-type"] || "audio/mpeg"));
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=86400");
      if (proxyRes.headers["content-range"]) res.setHeader("Content-Range", String(proxyRes.headers["content-range"]));
      if (proxyRes.headers["accept-ranges"]) res.setHeader("Accept-Ranges", String(proxyRes.headers["accept-ranges"]));
      if (proxyRes.headers["content-length"]) res.setHeader("Content-Length", String(proxyRes.headers["content-length"]));
      
      proxyRes.data.pipe(res);
    } catch (e: any) {
      res.status(502).json({ error: "Failed to proxy audio: " + e.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "LOXX Backend is running in Persian mode (UTF-8)" });
  });

  app.use(errorHandler);

  // Elite messages cleanup job (every 12 hours)
  setInterval(async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const eliteChannels = await prisma.channel.findMany({ where: { type: "ELITE" }, select: { id: true } });
      const eliteChannelIds = eliteChannels.map(c => c.id);
      
      await prisma.message.deleteMany({
        where: {
          channelId: { in: eliteChannelIds },
          createdAt: { lt: sevenDaysAgo }
        }
      });
      console.log("[CRON] Cleaned up older Elite group messages");
    } catch(err) {
      console.error("[CRON] Elite cleanup error", err);
    }
  }, 12 * 60 * 60 * 1000);

  // Weekly Ranking Rewards Job (every hour)
  setInterval(async () => {
    try {
      const { RankingService } = await import("./server/services/ranking.service.ts");
      await RankingService.distributeWeeklyRewards();
    } catch(err) {
      console.error("[CRON] Weekly rewards job error:", err);
    }
  }, 60 * 60 * 1000);

  // Support Enamad dynamic root verification files (.txt)
  app.get("/:filename.txt", async (req, res, next) => {
    const { filename } = req.params;
    const fullName = `${filename}.txt`;
    try {
      const file = await prisma.verificationFile.findUnique({
        where: { filename: fullName }
      });
      if (file) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        return res.send(file.content);
      }
    } catch (err) {
      console.error("Error serving verification file:", err);
    }
    next();
  });

  // Intercept the root path to dynamically inject Enamad Meta tag and page Title from DB
  app.get("/", async (req, res, next) => {
    try {
      const fs = await import("fs");
      const isProd = process.env.NODE_ENV === "production";
      const filePath = isProd 
        ? path.join(process.cwd(), "dist", "index.html")
        : path.join(process.cwd(), "index.html");
        
      if (fs.existsSync(filePath)) {
        let html = fs.readFileSync(filePath, "utf8");
        
        // Fetch dynamic settings
        let config = await prisma.enamadConfig.findUnique({
          where: { id: "default" }
        });
        
        if (!config) {
          config = await prisma.enamadConfig.create({
            data: {
              id: "default",
              siteTitle: "لوکس | پلتفرم بازی های آنلاین",
              enamadMetaCode: "46418638"
            }
          });
        }
        
        const title = config.siteTitle || "LOXX - پیشرفته‌ترین پلتفرم گیمینگ فارسی";
        const metaCode = config.enamadMetaCode || "46418638";
        
        // Replace Title element
        html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
        
        // Inject Enamad meta tag
        const metaTag = `<meta name="enamad" content="${metaCode}" />`;
        if (html.includes("</head>")) {
          html = html.replace("</head>", `  ${metaTag}\n  </head>`);
        }
        
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.send(html);
      }
    } catch (err) {
      console.error("Error rendering dynamically injected index.html:", err);
    }
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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

  // Initialize Bale Webhook
  if (process.env.APP_URL) {
    BaleService.setWebhook(process.env.APP_URL);
  }
}

startServer();
