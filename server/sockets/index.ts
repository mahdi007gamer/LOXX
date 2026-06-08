import { Server, Socket } from "socket.io";
import path from "path";
import axios from "axios";
axios.defaults.proxy = false;
import { AuthService } from "../services/auth.service.ts";
import { RankingService } from "../services/ranking.service.ts";
import { PenaltyService } from "../services/penalty.service.ts";
import { emitLobbyUpdate } from "../utils/socket.ts";
import prisma from "../utils/prisma.ts";

import DOMPurify from "isomorphic-dompurify";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

// Global reference for emitting
let globalIo: Server;
export let globalNotifyNs: any = null;
export const lobbyMusicBots = new Map<string, any>();

export function sendRealtimeWarning(userId: string, message: string) {
  if (globalNotifyNs) {
    globalNotifyNs.to(`user:${userId}`).emit("moderation.warning", { message });
  }
}

function isMessageMediaIncomplete(content: string | null | undefined): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  if (trimmed === "") return true;

  if (trimmed.includes("[IMAGE]:")) {
    const parts = trimmed.split("[IMAGE]:");
    const mediaUrl = parts[parts.length - 1]?.trim();
    if (!mediaUrl || mediaUrl.length < 5) {
      return true;
    }
  }

  if (trimmed.includes("[GIF]:")) {
    const parts = trimmed.split("[GIF]:");
    const mediaUrl = parts[parts.length - 1]?.trim();
    if (!mediaUrl || mediaUrl.length < 5) {
      return true;
    }
  }
  return false;
}

export function setupWebSockets(io: Server) {
  globalIo = io;
  
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
  const pendingOfflineTimeouts = new Map<string, NodeJS.Timeout>(); // userId -> setTimeout ref

  const formatUserForSocket = (user: any) => ({
    userId: user.id,
    username: user.username,
    membership: user.profile?.membershipType || "NONE",
    level: user.profile?.level || 1,
    role: user.role,
    avatar: user.profile?.avatarUrl,
    bannerUrl: user.profile?.bannerUrl,
    vipMetadata: user.profile?.vipMetadata,
    badges: user.badges?.map((ub: any) => ({ ...ub.badge, isPinned: ub.isPinned })) || [],
    isOnline: userConnections.has(user.id)
  });

  // Namespaces
  const publicNs = io.of("/public");
  const presenceNs = io.of("/presence");
  const lobbyNs = io.of("/lobby");
  const chatNs = io.of("/chat");
  const notifyNs = io.of("/notify");
  const voiceNs = io.of("/voice");

  globalNotifyNs = notifyNs;

  presenceNs.use(authMiddleware);
  lobbyNs.use(authMiddleware);
  chatNs.use(authMiddleware);
  notifyNs.use(authMiddleware);
  voiceNs.use(authMiddleware);

  // We export a helper to broadcast public activities
  const broadcastPublicActivity = (user: string, action: string, type: 'LOBBY_CREATE' | 'LOBBY_JOIN' | 'CHAT_MESSAGE' | 'LEVEL_UP') => {
    publicNs.emit("public.activity", {
      id: Date.now().toString() + Math.random(),
      user,
      action,
      type
    });
  };
  global.broadcastPublicActivity = broadcastPublicActivity;

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
            lobbyMusicBots.delete(lobbyId);
            await prisma.message.deleteMany({ where: { lobbyId } }).catch(() => {});
            await prisma.lobby.delete({ where: { id: lobbyId } }).catch((err) => { console.error("Error deleting lobby on host exit:", err); });
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
    // Clear any pending offline timeout first
    if (pendingOfflineTimeouts.has(userId)) {
      clearTimeout(pendingOfflineTimeouts.get(userId)!);
      pendingOfflineTimeouts.delete(userId);
    }

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
        
        // Delay offline status & lobby expulsion to prevent immediate drop on network jitter/reconnects
        if (pendingOfflineTimeouts.has(userId)) {
          clearTimeout(pendingOfflineTimeouts.get(userId)!);
        }
        const timeout = setTimeout(() => {
          pendingOfflineTimeouts.delete(userId);
          updatePresence(userId, "offline");
        }, 7000); // 7-second grace period
        pendingOfflineTimeouts.set(userId, timeout);
        
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

      socket.on("voice.join", async (data: { roomId: string }, ack?: any) => {
      socket.join(`voice:${data.roomId}`);
      // Notify others in the room
      socket.to(`voice:${data.roomId}`).emit("voice.user_joined", { userId });
      
      // Get existing sockets in this voice room
      try {
         const sockets = await voiceNs.in(`voice:${data.roomId}`).fetchSockets();
         const existingUserIds = sockets
           .map((s: any) => s.userId)
           .filter((id: string) => id && id !== userId);
         
         // Inject Music Bot as an active voice user if it's active in this lobby
         const botSession = lobbyMusicBots.get(data.roomId);
         if (botSession && botSession.active) {
           existingUserIds.push(`music-bot-${data.roomId}`);
         }
         
         // Remove duplicates
         const uniqueUsers = Array.from(new Set(existingUserIds));
         if (ack) {
           ack({ users: uniqueUsers });
         } else {
           socket.emit("voice.existing_users", { users: uniqueUsers });
         }
      } catch(e) {}
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

    socket.on("voice.audio_chunk", (data: { roomId: string, chunk: any, userId?: string }) => {
      // SFU Media Server Relay: Broadcast the media chunk to all other players in the room (supports Bot spoofing by host)
      const senderUserId = data.userId || userId;
      socket.to(`voice:${data.roomId}`).emit("voice.audio_chunk", { userId: senderUserId, chunk: data.chunk });
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

  const SEARCH_MESSAGES = [
    "چشم، دارم دنبالش میگردم… 🔍",
    "حتماً، الان پیداش میکنم براتون 🫡",
    "ببینم سلیقت چطوریه، رفتم واسه سرچ… 🎧",
    "اوکی، رفتم که داشته باشیمش 🚀",
    "یکم صبر کن، الان از زیر سنگم شده درش میارم 💎",
    "ملودی لوکس در خدمت شماست، دارم میگردم… ✨",
    "چه انتخابی! بذار ببینم کجاست… 🎵",
    "الان برات ردیفش میکنم، یه لحظه… 🛠",
    "در حال دریافت اطلاعات از سرورهای موسیقی… 📡",
    "سلیقهت لایک داره! رفتم واسه شکار موزیک 🏹"
  ];

  const SUCCESS_MESSAGES = [
    "پیداش کردم برات، الان پخش میکنم 💃",
    "پیدا شد! رفت توی لیست پخش، حالشو ببرید 🎶",
    "موزیک آمادهست! بریم واسه پخش… 🎧🔥",
    "مأموریت انجام شد، موزیک به صف اضافه شد ✅"
  ];

  const NOT_FOUND_MESSAGES = [
    "هرچی گشتم پیدا نشد که نشد! ❌ اگه لینکش رو داری بفرست: /p Link",
    "شرمنده، این یکی رو توی آرشیوم نداشتم 😔 با لینک امتحان کن.",
    "انگار این موزیک خیلی خاصه، پیدا نشد! 🤷‍♂️ لینکشو داری؟",
    "ای بابا! پیدا نکردم. مطمئنی اسمش رو درست نوشتی؟ 🧐",
    "شکست خوردم! نتونستم پیداش کنم. لینک مستقیم بده تا پخش کنم 🔗"
  ];

  const WELCOME_MELODY = `🎧 سـلام! من ملودی لوکس هستم، دیجی اختصاصی لابی شما! 🌟

ممنون که من رو به جمعتون اضافه کردید. من اینجام تا اتمسفر لابی رو با بهترین موزیک‌ها منفجر کنم! 🚀

🎵 چطور آهنگ پخش کنم؟
کافیه دستور /p رو بنویسی تا بلافاصله برات پیداش کنم:
🔹 /p [اسم موزیک / فیلم / خواننده]

💡 مثلاً:
/p گل سرخ
/p https://example.com/music.mp3

📌 هر تعداد که آهنگ بخوای می‌تونی اضافه کنی تا برن توی لیست پخش! در ضمن، این نسخه طلایی هست و همه بچه‌های لابی می‌تونن پلیر رو کنترل کنن! 😎

🛠 دستورات سریع چت:
⏹ /stop : توقف پخش موزیک
⏭ /skip : رفتن به آهنگ بعدی
📜 /queue : مشاهده لیست انتظار`;

  // Helper to send a chat message inside the lobby using the bot's identity
  const sendBotLobbyMessage = async (lobbyId: string, botType: "music" | "melody", content: string) => {
    try {
      const lobby = await prisma.lobby.findUnique({ where: { id: lobbyId } });
      if (!lobby) return;
      const senderId = lobby.hostId; // Satisfies Prisma foreign key to User table

      const msg = await prisma.message.create({
        data: {
          content: content,
          senderId: senderId,
          lobbyId,
        }
      });

      const msgPayload = {
        id: msg.id.toString(),
        tempId: "bot-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        from: { 
          userId: botType === "melody" ? "melody-bot" : "music-bot", 
          username: botType === "melody" ? "ملودی لوکس (آنلاین) 🌟" : "ربات هوشمند موسیقی لوکس 🎵", 
          membership: botType === "melody" ? "GOLD" : "VIP",
          level: 99,
          avatar: botType === "melody" ? "/badges/musicbot-gold.jpeg" : "/badges/musicbot.jpeg",
          bannerUrl: "/bg-hero.jpg",
          vipMetadata: { borderNeonColor: botType === "melody" ? "#FFD700" : "#00e5ff" },
          badges: [
            { name: botType === "melody" ? "Melody Lox" : "Music Lox", icon: "/badges/unnamed.png", isPinned: true }
          ],
          isBot: true
        },
        targetType: "lobby",
        targetId: lobbyId,
        content: content,
        createdAt: msg.createdAt.getTime()
      };

      lobbyNs.to(`lobby:${lobbyId}`).emit("chat.message", msgPayload);
    } catch (err) {
      console.error("Error sending bot lobby message:", err);
    }
  };

  // Helper to search a specific music website domain
  const searchSite = async (site: { name: string, domain: string }, query: string, lobbyId?: string): Promise<string[]> => {
    const links: string[] = [];
    
    // Try 1: WP REST API
    try {
      const wpUrl = `${site.domain}/wp-json/wp/v2/posts?search=${encodeURIComponent(query)}&_fields=id,title,link&per_page=3`;
      const res = await axios.get(wpUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
        timeout: 5000,
        proxy: false
      });
      if (res.data && Array.isArray(res.data)) {
        for (const post of res.data) {
          if (post.link && !links.includes(post.link)) {
            links.push(post.link);
          }
        }
      }
    } catch (apiErr: any) {
      console.log(`⚠️ [${site.name}] خطای جستجوی وب‌سرویس: ${apiErr.message}`);
    }

    // Try 2: HTML Search (Only if WP API returned nothing or had an error)
    if (links.length === 0) {
      try {
        const searchUrl = `${site.domain}/?s=${encodeURIComponent(query)}`;
        const res = await axios.get(searchUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
          timeout: 5000,
          proxy: false
        });
        const html = res.data || "";
        const domainEscaped = site.domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // We will match links belonging to the domain
        const regex = new RegExp(`href=["'](${domainEscaped}/[^"'/]+/?(?:\\.html)?)["']`, "gi");
        const matches = html.matchAll(regex);
        for (const m of matches) {
          const u = m[1];
          if (!u.includes("/wp-") && !u.includes("/category/") && !u.includes("/page/") && !u.includes("/tag/") && u !== site.domain && u !== site.domain + "/") {
            if (!links.includes(u)) {
              links.push(u);
            }
          }
        }
      } catch (htmlErr: any) {
        console.log(`⚠️ [${site.name}] خطای جستجوی وب‌پیج: ${htmlErr.message}`);
      }
    }

    return links;
  };

  // Convert/Extract MP3 download link from ANY Persian music post webpage
  const extractMp3FromWebPage = async (pageUrl: string, lobbyId?: string): Promise<{ title: string; url: string; coverUrl: string; duration: number } | null> => {
    try {
      console.log(`[MusicBot Scraper] Scraping page: "${pageUrl}"`);
      const res = await axios.get(pageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        timeout: 5000,
        proxy: false
      });
      const html = res.data || "";
      
      const mp3Matches: string[] = [];
      const matches = html.matchAll(/(?:href|src)=["'](https?:\/\/[^"']+\.mp3[^"']*)["']/gi);
      for (const m of matches) {
        if (m[1]) {
          const l = m[1].trim();
          if (!mp3Matches.includes(l)) mp3Matches.push(l);
        }
      }

      const validMp3s = mp3Matches.filter(link => {
        const l = link.toLowerCase();
        return !l.includes("ads") && !l.includes("tabligh") && !l.includes("intro") && !l.includes("advertis");
      });

      if (validMp3s.length === 0) {
        console.log(`[MusicBot Scraper] No valid MP3s on page: ${pageUrl}`);
        return null;
      }

      // Prioritize 320kbps over 128kbps
      let bestMp3 = validMp3s.find(link => link.includes("320")) || 
                     validMp3s.find(link => link.toLowerCase().includes("320")) ||
                     validMp3s.find(link => link.includes("128")) ||
                     validMp3s.find(link => link.toLowerCase().includes("128")) ||
                     validMp3s[0];

      // Title detection
      let pTitle = "";
      const htmlTitleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (htmlTitleMatch) {
        pTitle = htmlTitleMatch[1]
          .replace(" - پاپ موزیک", "")
          .replace(" - نکس وان موزیک", "")
          .replace(" - موزیک فا", "")
          .replace(" - آپ موزیک", "")
          .replace("دانلود آهنگ جدید", "")
          .replace("دانلود آهنگ", "")
          .replace("دانلود آهنگ جدید", "")
          .replace("پخش آنلاین", "")
          .trim();
      } else {
        pTitle = path.basename(decodeURIComponent(bestMp3)).replace(/\.[^/.]+$/, "");
      }

      // Cover image detection
      let coverUrl = "/badges/musicbot-gold.jpeg";
      const imgm = html.matchAll(/src="([^"']+\.(jpe?g|png))"/gi);
      const imgMatches: string[] = [];
      for (const m of imgm) {
        if (m[1] && !m[1].includes("ads") && !m[1].includes("banner")) {
          imgMatches.push(m[1].trim());
        }
      }
      const validCover = imgMatches.find(img => img.includes("wp-content/uploads/"));
      if (validCover) {
        coverUrl = validCover;
      }

      return {
        title: pTitle || "موزیک پیدا شده",
        url: bestMp3,
        coverUrl,
        duration: 240
      };
    } catch (err: any) {
      console.error(`[MusicBot Scraper] Failed to scrape ${pageUrl}:`, err.message || err);
      return null;
    }
  };

  // Symmetric Fingilish-Persian mapped dictionary for artist & song titles search reinforcement
  const FINGILISH_MAP: Record<string, string> = {
    // Fingilish to Persian
    "mehrad": "مهراد",
    "hidden": "هیدن",
    "mar": "مار",
    "maaar": "مار",
    "saman": "سامان",
    "wilson": "ویلسون",
    "arash": "آرش",
    "shayea": "شایع",
    "yas": "یاس",
    "hichkas": "هیچکس",
    "pishro": "پیشرو",
    "reza": "رضا",
    "sadegh": "صادق",
    "hosein": "حصین",
    "hassan": "حسن",
    "shajarian": "شجریان",
    "homayoun": "همایون",
    "behzad": "بهزاد",
    "leito": "لیتو",
    "alireza": "علیرضا",
    "jj": "جی جی",
    "sijal": "سیجل",
    "sohrab": "سهراب",
    "mj": "ام جی",
    "zedbazi": "زدبازی",
    "tataloo": "تتلو",
    "amirtataloo": "تتلو",
    "khashayar": "خشایار",
    "erfan": "عرفان",
    "gdaal": "جی دال",
    "taham": "تهم",
    "paya": "پایا",
    "wantons": "وانتونز",
    "sami": "sami",
    "lowghab": "لوکاب",
    "behim": "بهیم",
    "bahram": "بهرام",
    "noura": "نورا",
    "sorena": "سورنا",
    "ali": "علی",
    "fadaei": "فدائی",
    "dariush": "داریوش",
    "ghadr": "قدر",
    "mohalek": "مهلک",
    "farzad": "فرزاد",
    "farzin": "فرزین",
    "mohsen": "محسن",
    "yeganeh": "یگانه",
    "chavoshi": "چاوشی",
    "shadmehr": "شادمهر",
    "aghili": "عقیلی",
    "samanjalili": "سامان جلیلی",
    "ehsan": "احسان",
    "khajeamiri": "خواجه امیری",
    "sirvan": "سیروان",
    "khosravi": "خسروی",
    "xaniar": "زانیار",
    "macan": "ماکان",
    "puzzle": "پازل",
    "hamid": "حمید",
    "hiraad": "هیراد",
    "hirad": "هیراد",
    "behnambani": "بهنام بانی",
    "bani": "بانی",
    "behnam": "بهنام",

    // Persian to Fingilish
    "مهراد": "mehrad",
    "هیدن": "hidden",
    "مار": "mar",
    "سامان": "saman",
    "ویلسون": "wilson",
    "آرش": "arash",
    "شایع": "shayea",
    "یاس": "yas",
    "هیچکس": "hichkas",
    "پیشرو": "pishro",
    "رضا": "reza",
    "صادق": "sadegh",
    "حصین": "hosein",
    "حسن": "hassan",
    "شجریان": "shajarian",
    "همایون": "homayoun",
    "بهزاد": "behzad",
    "لیتو": "leito",
    "علیرضا": "alireza",
    "جی جی": "jj",
    "سیجل": "sijal",
    "سهراب": "sohrab",
    "ام جی": "mj",
    "تتلو": "tataloo",
    "خشایار": "khashayar",
    "عرفان": "erfan",
    "بهرام": "bahram",
    "سورنا": "sorena",
    "علی": "ali",
    "فدائی": "fadaei",
    "فرزاد": "farzad",
    "فرزین": "farzin",
    "محسن": "mohsen",
    "یگانه": "yeganeh",
    "چاوشی": "chavoshi",
    "شادمهر": "shadmehr",
    "عقیلی": "aghili",
    "احسان": "ehsan",
    "خواجه امیری": "khajeamiri",
    "سیروان": "sirvan",
    "خسروی": "khosravi",
    "زانیار": "xaniar",
    "حمید": "hamid",
    "هیراد": "hirad",
    "بهنام": "behnam",
    "بانی": "bani"
  };

  const calculateScore = (title: string, url: string, query: string): number => {
    const normTitle = title.toLowerCase()
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/[\u200B-\u200D\uFEFF]/g, " ");
    const normUrl = decodeURIComponent(url).toLowerCase();
    const normQuery = query.toLowerCase()
      .replace(/ي/g, "y")
      .replace(/ك/g, "k")
      .replace(/[\u200B-\u200D\uFEFF]/g, " ");

    const simplifyWord = (w: string) => {
      return w.replace(/([a-zA-Z])\1+/g, "$1"); // Collapses duplicate consecutive letters (e.g., maaar -> maar)
    };

    const queryWords = normQuery.split(/\s+/).filter(w => w.length > 1);
    if (queryWords.length === 0) return 0;

    let matchedCount = 0;
    for (const qw of queryWords) {
      const simplifiedQw = simplifyWord(qw);
      
      const directMatch = normTitle.includes(qw) || normUrl.includes(qw);
      const simplifiedMatch = simplifyWord(normTitle).includes(simplifiedQw) || simplifyWord(normUrl).includes(simplifiedQw);
      
      let translationMatch = false;
      if (FINGILISH_MAP[qw]) {
        const trans = FINGILISH_MAP[qw];
        translationMatch = normTitle.includes(trans) || normUrl.includes(trans);
      }

      if (directMatch || simplifiedMatch || translationMatch) {
         matchedCount += 1;
      }
    }

    if (normTitle.includes(normQuery) || normUrl.includes(normQuery)) {
      matchedCount += 1.5; // Phrase bonus
    }

    return matchedCount / queryWords.length;
  };

  // Search online track from web or itunes API as fallback
  const searchOnlineTrack = async (query: string, lobbyId?: string): Promise<{ title: string; url: string; coverUrl: string; duration: number } | null> => {
    console.log(`[MusicBot Search] Searching for query: "${query}"`);
    if (lobbyId) {
      await sendBotLobbyMessage(lobbyId, "melody", `🔍 در حال جستجوی آنلاین آهنگ «${query}»...`);
    }

    const sites = [
      { name: "PopMusic (پاپ موزیک)", domain: "https://pop-music.ir" },
      { name: "MusicFa (موزیک فا)", domain: "https://music-fa.com" },
      { name: "GolsarMusic (گلسار موزیک)", domain: "https://golsarmusic.ir" },
      { name: "MokhtalefMusic (مختلف موزیک)", domain: "https://mokhtalefmusic.com" },
      { name: "RozMusic (رز موزیک)", domain: "https://rozmusic.com" }
    ];

    const resultsMap = new Map<string, string[]>();

    // Query all sites in parallel
    await Promise.all(sites.map(async (site) => {
      try {
        const siteLinks = await searchSite(site, query, lobbyId);
        resultsMap.set(site.domain, siteLinks);
      } catch (e: any) {
        console.error(`⚠️ خطای جستجوی ${site.name}: ${e.message}`);
      }
    }));

    // Collect all links in round-robin fashion
    const validPosts: string[] = [];
    let added = true;
    let index = 0;
    while (added) {
      added = false;
      for (const site of sites) {
        const list = resultsMap.get(site.domain) || [];
        if (index < list.length) {
          const url = list[index];
          if (!validPosts.includes(url)) {
            validPosts.push(url);
          }
          added = true;
        }
      }
      index++;
    }

    console.log(`[MusicBot Search] Found ${validPosts.length} potential posts across the 5 sites.`);

    // Scrape top candidates in parallel to optimize speed and choose the best matched track
    const candidatesToScrape = validPosts.slice(0, 8);
    const scrapedResults: { score: number; result: any }[] = [];

    await Promise.all(candidatesToScrape.map(async (url) => {
      try {
        const resObj = await extractMp3FromWebPage(url, lobbyId);
        if (resObj && resObj.url) {
          const score = calculateScore(resObj.title, url, query);
          scrapedResults.push({ score, result: resObj });
        }
      } catch (scrapErr) {
        // Safe skip failed page scrapings
      }
    }));

    // Sort candidates by score descending
    scrapedResults.sort((a, b) => b.score - a.score);

    // If we have a candidate with a reasonable matching score, pick the best one
    // Threshold set to 0.2 to ensure at least some keyword is present
    if (scrapedResults.length > 0 && scrapedResults[0].score >= 0.20) {
      const bestCandidate = scrapedResults[0].result;
      console.log(`[MusicBot Search] Selected best match: "${bestCandidate.title}" with score ${scrapedResults[0].score}`);
      if (lobbyId) {
        await sendBotLobbyMessage(lobbyId, "melody", `✅ موزیک با موفقیت پیدا و به صف لابی متصل گردید:\n🎵 «${bestCandidate.title}»`);
      }
      return bestCandidate;
    }

    // 2. Fallback to iTunes Search API
    try {
      console.log(`[MusicBot Search] Querying iTunes for: "${query}"`);
      const searchUrl = `https://itunes.apple.com/search?media=music&term=${encodeURIComponent(query)}&limit=1`;
      const res = await axios.get(searchUrl, { timeout: 4000, proxy: false });
      if (res.data?.results && res.data.results.length > 0) {
        const match = res.data.results[0];
        console.log(`[MusicBot Search] Successfully extracted track from iTunes: "${match.trackName}"`);
        if (lobbyId) {
          await sendBotLobbyMessage(lobbyId, "melody", `✅ موزیک جایگزین خارجی پیدا شد:\n🎵 «${match.artistName} - ${match.trackName}»`);
        }
        return {
          title: `${match.artistName} - ${match.trackName}`,
          url: match.previewUrl,            // 30 second preview URL (.m4a)
          coverUrl: match.artworkUrl100 || "/badges/musicbot-gold.jpeg",
          duration: 30
        };
      }
    } catch (itunesErr: any) {
      console.error(`⚠️ خطای جستجوی iTunes: ${itunesErr.message}`);
    }

    return null;
  };

  const refreshMusicBotTime = (bot: any) => {
    if (bot && bot.isPlaying && bot.updatedAt) {
      const elapsed = (Date.now() - bot.updatedAt) / 1000;
      bot.currentTime = (bot.currentTime || 0) + elapsed;
      if (bot.duration && bot.currentTime > bot.duration) {
        bot.currentTime = bot.duration;
      }
      bot.updatedAt = Date.now();
    }
  };

  const handleMelodyCommand = async (lobbyId: string, cmd: "p" | "stop" | "skip" | "queue", arg: string) => {
    try {
      let bot = lobbyMusicBots.get(lobbyId);
      if (!bot || !bot.active || bot.botType !== "melody") return;
      refreshMusicBotTime(bot);

      if (cmd === "p") {
        const query = arg.trim();
        if (!query) {
          await sendBotLobbyMessage(lobbyId, "melody", "⚠️ لطفا نام آهنگ یا لینک مستقیم آن را بعد از /p بنویسید.");
          return;
        }

        // Send Search Start message at random
        const rNum = Math.floor(Math.random() * SEARCH_MESSAGES.length);
        await sendBotLobbyMessage(lobbyId, "melody", SEARCH_MESSAGES[rNum]);

        // Lookup query
        let matchedTrack: any = null;
        const isUrl = /^(https?:\/\/)/i.test(query);

        if (isUrl) {
          const isDirectAudio = /\.(mp3|wav|ogg|m4a|aac|flac|mp4|webm|opus)(\?.*)?$/i.test(query) || query.toLowerCase().includes(".mp3") || query.toLowerCase().includes(".wav");
          
          if (isDirectAudio) {
            let urlName = path.basename(decodeURIComponent(query)).split("?")[0] || "Custom Audio";
            if (urlName === "file" || urlName.length < 3) {
              urlName = "آهنگ سفارشی از لینک مستقیم";
            } else {
              urlName = urlName.replace(/\.[^/.]+$/, "");
            }

            matchedTrack = {
              title: urlName,
              url: query,
              coverUrl: "/badges/musicbot-gold.jpeg",
              duration: 300 // default 5 mins
            };
          } else {
            // It's a webpage! Let's extract the MP3 from it.
            await sendBotLobbyMessage(lobbyId, "melody", "🔍 در حال استخراج لینک موسیقی از صفحه وب ارسالی شما...");
            const scraped = await extractMp3FromWebPage(query, lobbyId);
            if (scraped) {
              matchedTrack = scraped;
            } else {
              await sendBotLobbyMessage(lobbyId, "melody", "🚫 متأسفانه هیچ فایل صوتی مستقیمی (.mp3) در این صفحه وب پیدا نشد.");
              return;
            }
          }
        } else {
          // Normalized Persian character search
          const normalizePersian = (str: string) => {
            return str
              .toLowerCase()
              .replace(/ي/g, "ی")
              .replace(/ك/g, "ک")
              .replace(/[\u200B-\u200D\uFEFF]/g, " ")
              .trim();
          };

          const searchNormalized = normalizePersian(query);
          const tracks = await prisma.track.findMany({
            include: {
              artists: true
            }
          }).catch(() => prisma.track.findMany()); // safe fallback if relational includes fail

          // 1. Exact match on title
          let matched = tracks.find(t => normalizePersian(t.title) === searchNormalized);

          // 2. Substring match on title
          if (!matched) {
            matched = tracks.find(t => normalizePersian(t.title).includes(searchNormalized));
          }

          // 3. Substring match on artist name
          if (!matched) {
            matched = tracks.find(t => 
              (t as any).artists && (t as any).artists.some((artist: any) => normalizePersian(artist.name).includes(searchNormalized))
            );
          }

          // 4. Token-based matching (all query words exist in title + artist name combined)
          if (!matched) {
            const tokens = searchNormalized.split(/\s+/).filter(t => t.length > 0);
            if (tokens.length > 0) {
              matched = tracks.find(t => {
                const titleNorm = normalizePersian(t.title);
                const artistsNorm = ((t as any).artists?.map((a: any) => normalizePersian(a.name)).join(" ") || "");
                const combined = titleNorm + " " + artistsNorm;
                return tokens.every(token => combined.includes(token));
              });
            }
          }

          if (matched) {
            matchedTrack = {
              title: matched.title,
              url: matched.url,
              coverUrl: matched.coverUrl || "/badges/musicbot-gold.jpeg",
              duration: matched.duration || 0
            };
          }

          if (!matchedTrack) {
            const onlineResult = await searchOnlineTrack(query, lobbyId);
            if (onlineResult) {
              matchedTrack = onlineResult;
            }
          }
        }

        if (!matchedTrack) {
          const rIndex = Math.floor(Math.random() * NOT_FOUND_MESSAGES.length);
          await sendBotLobbyMessage(lobbyId, "melody", NOT_FOUND_MESSAGES[rIndex]);
          return;
        }

        // Check 13 mins limit
        if (matchedTrack.duration && matchedTrack.duration > 780) {
          await sendBotLobbyMessage(lobbyId, "melody", "⚠️ موزیک مورد نظر شما بیشتر از ۱۳ دقیقه (۷۸۰ ثانیه) است. لطفاً قطعه کوتاهتری انتخاب کنید.");
          return;
        }

        // Add to queue
        bot.queue = bot.queue || [];
        const newTrack = {
          name: matchedTrack.title,
          url: matchedTrack.url,
          coverUrl: matchedTrack.coverUrl || "/badges/musicbot-gold.jpeg",
          duration: matchedTrack.duration || 0
        };
        
        bot.queue.push(newTrack);

        if (!bot.isPlaying) {
          bot.queueIndex = bot.queue.length - 1;
          bot.currentTrackName = newTrack.name;
          bot.currentTrackUrl = newTrack.url;
          bot.currentTrackCover = newTrack.coverUrl;
          bot.isPlaying = true;
          bot.currentTime = 0;
          bot.duration = newTrack.duration;
        }

        bot.updatedAt = Date.now();
        lobbyMusicBots.set(lobbyId, bot);

        // Success Message
        const rSuccess = Math.floor(Math.random() * SUCCESS_MESSAGES.length);
        await sendBotLobbyMessage(lobbyId, "melody", SUCCESS_MESSAGES[rSuccess]);

        // Broadcast state update
        lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.musicbot.state", bot);
        voiceNs.to(`voice:${lobbyId}`).emit("voice.talking", { 
          userId: `music-bot-${lobbyId}`, 
          isTalking: bot.isPlaying 
        });

      } else if (cmd === "stop") {
        bot.isPlaying = false;
        bot.updatedAt = Date.now();
        lobbyMusicBots.set(lobbyId, bot);
        lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.musicbot.state", bot);
        voiceNs.to(`voice:${lobbyId}`).emit("voice.talking", { 
          userId: `music-bot-${lobbyId}`, 
          isTalking: false 
        });
        await sendBotLobbyMessage(lobbyId, "melody", "⏹ پخش موسیقی متوقف شد.");

      } else if (cmd === "skip") {
        if (bot.queue && bot.queue.length > 0) {
          const nextIdx = (bot.queueIndex + 1) % bot.queue.length;
          bot.queueIndex = nextIdx;
          const nextTrack = bot.queue[nextIdx];
          bot.currentTrackName = nextTrack.name;
          bot.currentTrackUrl = nextTrack.url;
          bot.currentTrackCover = nextTrack.coverUrl || "";
          bot.currentTime = 0;
          bot.duration = nextTrack.duration || 0;
          bot.isPlaying = true;
          bot.updatedAt = Date.now();
          lobbyMusicBots.set(lobbyId, bot);
          lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.musicbot.state", bot);
          voiceNs.to(`voice:${lobbyId}`).emit("voice.talking", { 
            userId: `music-bot-${lobbyId}`, 
            isTalking: true 
          });
          await sendBotLobbyMessage(lobbyId, "melody", "⏭ رفتیم واسه آهنگ بعدی!");
        } else {
          await sendBotLobbyMessage(lobbyId, "melody", "❌ لیستی برای رفتن به آهنگ بعدی وجود ندارد.");
        }

      } else if (cmd === "queue") {
        if (bot.queue && bot.queue.length > 0) {
          let listMsg = "📜 **لیست انتظار ملودی لوکس:**\n\n";
          bot.queue.forEach((track: any, idx: number) => {
            const activeMarker = idx === bot.queueIndex ? "▶️ " : "🔹 ";
            listMsg += `${activeMarker}${idx + 1}. ${track.name}\n`;
          });
          await sendBotLobbyMessage(lobbyId, "melody", listMsg);
        } else {
          await sendBotLobbyMessage(lobbyId, "melody", "📜 لیست انتظار خالی است.");
        }
      }
    } catch (err) {
      console.error("Error running melody command:", err);
    }
  };

  // Lobby Namespace
  lobbyNs.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    if (!userId) return;
    
    trackUser(userId, socket.id);

    // Real-time precise ping measurement and reporting
    socket.on("lobby.ping", (data: { timestamp: number }) => {
      socket.emit("lobby.pong", { timestamp: data.timestamp });
    });

    socket.on("lobby.publish_ping", (data: { lobbyId: string, ping: number }) => {
      // broadcast user's ping update to everyone in the lobby room
      lobbyNs.to(`lobby:${data.lobbyId}`).emit("lobby.ping_updated", {
        userId,
        ping: data.ping
      });
    });

    // Dynamic Music Bot Sockets handlers
    socket.on("lobby.musicbot.get_state", (data: { lobbyId: string }, ack?: any) => {
      const { lobbyId } = data;
      const bot = lobbyMusicBots.get(lobbyId);
      if (bot) {
        refreshMusicBotTime(bot);
      }
      const returnedBot = bot || {
        active: false,
        isPlaying: false,
        botType: "music",
        currentTrackName: "",
        currentTrackUrl: "",
        currentTrackCover: "",
        currentCategory: "",
        queue: [],
        queueIndex: 0,
        currentTime: 0,
        updatedAt: Date.now()
      };
      if (ack) {
        ack({ status: "success", data: returnedBot });
      } else {
        socket.emit("lobby.musicbot.state", returnedBot);
      }
    });

    socket.on("lobby.musicbot.toggle", async (data: { lobbyId: string, active: boolean, botType?: "music" | "melody" }, ack?: any) => {
      const { lobbyId, active } = data;
      const botType = data.botType || "music";
      try {
        const lobby = await prisma.lobby.findUnique({ where: { id: lobbyId } });
        if (!lobby || lobby.hostId !== userId) {
          return ack?.({ status: "error", message: "تادسترسی ندارید، فقط سازنده لابی می‌تواند بات موسیقی را تغییر دهد." });
        }

        let bot = lobbyMusicBots.get(lobbyId);

        // Check conflict with previous bot
        if (active && bot && bot.active && bot.botType !== botType) {
          // Send old bot leaving voice & chat
          voiceNs.to(`voice:${lobbyId}`).emit("voice.user_left", { userId: `music-bot-${lobbyId}` });
          const oldBotName = bot.botType === "melody" ? "ملودی لوکس (آنلاین) 🌟" : "ربات هوشمند موسیقی لوکس 🎵";
          await sendBotLobbyMessage(lobbyId, bot.botType, `👋 ${oldBotName} لابی را ترک کرد تا ربات جدید مستقر شود.`);

          // Reset playing details
          bot.isPlaying = false;
          bot.queue = [];
          bot.queueIndex = 0;
          bot.currentTrackName = "";
          bot.currentTrackUrl = "";
          bot.currentTrackCover = "";
        }

        if (!bot) {
          bot = {
            active: false,
            isPlaying: false,
            botType: botType,
            currentTrackName: "",
            currentTrackUrl: "",
            currentTrackCover: "",
            currentCategory: "",
            queue: [],
            queueIndex: 0,
            currentTime: 0,
            updatedAt: Date.now()
          };
          lobbyMusicBots.set(lobbyId, bot);
        }

        bot.botType = botType;
        bot.active = active;
        if (!active) {
          bot.isPlaying = false;
        }
        
        bot.updatedAt = Date.now();

        // Broadcast current state to lobby
        lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.musicbot.state", bot);

        if (active) {
          try {
            voiceNs.to(`voice:${lobbyId}`).emit("voice.user_joined", { userId: `music-bot-${lobbyId}` });
            if (bot.isPlaying) {
              voiceNs.to(`voice:${lobbyId}`).emit("voice.talking", { userId: `music-bot-${lobbyId}`, isTalking: true });
            }
          } catch (voiceErr) {
            console.error("Voice join exception for music bot:", voiceErr);
            await sendBotLobbyMessage(lobbyId, botType, "❌ مشکلی در اتصال به وویس دارم، لطفاً دوباره من رو اضافه کنید.");
          }

          if (botType === "melody") {
            await sendBotLobbyMessage(lobbyId, "melody", WELCOME_MELODY);
          } else {
            await sendBotLobbyMessage(lobbyId, "music", "🎵 ربات موسیقی لوکس وارد لابی شد. برای پخش بر روی دکمه‌های کنترل کلیک کنید یا آهنگ اضافه کنید!");
          }
        } else {
          voiceNs.to(`voice:${lobbyId}`).emit("voice.user_left", { userId: `music-bot-${lobbyId}` });
          const leaveBotName = botType === "melody" ? "ملودی لوکس (آنلاین) 🌟" : "ربات هوشمند موسیقی لوکس 🎵";
          await sendBotLobbyMessage(lobbyId, botType, `👋 ${leaveBotName} لابی را ترک کرد.`);
        }

        if (ack) ack({ status: "success", data: bot });
      } catch (err: any) {
        if (ack) ack({ status: "error", message: err.message });
      }
    });

    socket.on("lobby.musicbot.control", async (data: {
      lobbyId: string;
      action: "play" | "pause" | "update-queue" | "seek";
      category?: string;
      trackUrl?: string;
      trackName?: string;
      coverUrl?: string;
      tracks?: any[];
      queue?: { name: string, url: string, coverUrl?: string }[];
      queueIndex?: number;
      isPlaying?: boolean;
      currentTime?: number;
      duration?: number;
    }, ack?: any) => {
      const { lobbyId, action, category, trackUrl, trackName, coverUrl, tracks, queue, queueIndex, isPlaying, currentTime, duration } = data;
      try {
        const lobby = await prisma.lobby.findUnique({ where: { id: lobbyId } });
        if (!lobby) {
          return ack?.({ status: "error", message: "لابی یافت نشد." });
        }

        let bot = lobbyMusicBots.get(lobbyId);
        if (bot) {
          refreshMusicBotTime(bot);
        }
        const isMelody = bot && bot.botType === "melody";

        // Check control permissions
        if (!isMelody && lobby.hostId !== userId) {
          return ack?.({ status: "error", message: "تادسترسی ندارید، شما سازنده لابی نیستید." });
        }

        if (isMelody) {
          const isMember = await prisma.lobbyMember.findFirst({
            where: { lobbyId, userId }
          });
          if (!isMember && lobby.hostId !== userId) {
            return ack?.({ status: "error", message: "تادسترسی ندارید، شما عضو این لابی نیستید." });
          }
        }

        if (!bot) {
          bot = {
            active: true,
            isPlaying: false,
            botType: isMelody ? "melody" : "music",
            currentTrackName: "",
            currentTrackUrl: "",
            currentTrackCover: "",
            currentCategory: "",
            queue: [],
            queueIndex: 0,
            currentTime: 0,
            duration: 0,
            updatedAt: Date.now()
          };
          lobbyMusicBots.set(lobbyId, bot);
        }

        bot.updatedAt = Date.now();
        if (currentTime !== undefined) {
          bot.currentTime = currentTime;
        }
        if (duration !== undefined) {
          bot.duration = duration;
        }

        // Limit check for melody bot
        if (isMelody && duration && duration > 780) {
          return ack?.({ status: "error", message: "⚠️ موزیک مورد نظر شما بیشتر از ۱۳ دقیقه است. لطفاً قطعه کوتاهتری انتخاب کنید." });
        }

        if (action === "play") {
          bot.isPlaying = true;
          if (trackUrl) bot.currentTrackUrl = trackUrl;
          if (trackName) bot.currentTrackName = trackName;
          if (category) bot.currentCategory = category;
          if (coverUrl !== undefined) bot.currentTrackCover = coverUrl;
        } else if (action === "pause") {
          bot.isPlaying = false;
        } else if (action === "seek") {
          // currentTime has been updated above
        } else if (action === "update-queue") {
          let resolvedQueue = queue;
          if (tracks && Array.isArray(tracks)) {
            resolvedQueue = tracks.map((t: any) => ({
              name: t.title || t.name,
              url: t.url,
              coverUrl: t.coverUrl || t.cover || "",
              duration: t.duration || t.durationSeconds || 0
            }));
          }
          
          const oldTrackUrl = bot.currentTrackUrl;
          if (resolvedQueue !== undefined) bot.queue = resolvedQueue;
          if (queueIndex !== undefined) bot.queueIndex = queueIndex;

          const activeIdx = queueIndex !== undefined ? queueIndex : bot.queueIndex;
          if (bot.queue && bot.queue[activeIdx]) {
            // Check 13 mins limit for melody bot
            if (isMelody && bot.queue[activeIdx].duration && bot.queue[activeIdx].duration > 780) {
              return ack?.({ status: "error", message: "⚠️ موزیک مورد نظر شما بیشتر از ۱۳ دقیقه است. لطفاً قطعه کوتاهتری انتخاب کنید." });
            }

            const newTrackUrl = bot.queue[activeIdx].url;
            if (queueIndex !== undefined || newTrackUrl !== oldTrackUrl) {
              bot.currentTrackUrl = bot.queue[activeIdx].url;
              bot.currentTrackName = bot.queue[activeIdx].name;
              bot.currentTrackCover = bot.queue[activeIdx].coverUrl || "";
              bot.currentTime = 0;
              bot.duration = bot.queue[activeIdx].duration || 0;
              bot.updatedAt = Date.now();
            }
          }

          if (trackUrl) bot.currentTrackUrl = trackUrl;
          if (trackName) bot.currentTrackName = trackName;
          if (category) bot.currentCategory = category;
          if (coverUrl !== undefined) bot.currentTrackCover = coverUrl;
          if (isPlaying !== undefined) bot.isPlaying = isPlaying;
        }
        
        bot.updatedAt = Date.now();

        // Broadcast updated state to lobby
        lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.musicbot.state", bot);

        // Map music play state to active voice speaking status
        voiceNs.to(`voice:${lobbyId}`).emit("voice.talking", { 
          userId: `music-bot-${lobbyId}`, 
          isTalking: bot.isPlaying 
        });

        if (ack) ack({ status: "success", data: bot });
      } catch (err: any) {
        if (ack) ack({ status: "error", message: err.message });
      }
    });

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
        const penalty = await PenaltyService.checkPenalty(userId, ["LOBBY_BAN"]);
        if (penalty.isBanned) {
          throw new Error("شما از ساخت و ورود به لابی محروم هستید.");
        }

        const lobby = await prisma.lobby.findUnique({
          where: { id: lobbyId },
          include: { members: true }
        });

        if (!lobby) throw new Error("لابی پیدا نشد یا منقضی شده است.");
        if (lobby.status === "STARTING" || lobby.status === "IN_PROGRESS") throw new Error("بازی این لابی قبلا شروع شده است.");
        const existingMember = lobby.members.find(m => m.userId === userId);
        if (!existingMember) {
          if (lobby.password && lobby.password !== password) throw new Error("INVALID_PASSWORD");
          if (lobby.members.length >= lobby.maxPlayers) throw new Error("ظرفیت لابی پر است.");
        }

        // Check if already a member before upserting to know if we should increment
        const existingMemberRecord = await prisma.lobbyMember.findUnique({
          where: { lobbyId_userId: { lobbyId, userId } }
        });

        // Join DB
        const member = await prisma.lobbyMember.upsert({
          where: { lobbyId_userId: { lobbyId, userId } },
          update: {},
          create: { lobbyId, userId, role: "PLAYER", isReady: false, micStatus: true }
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
          lobbyMusicBots.delete(lobbyId);
          await prisma.message.deleteMany({ where: { lobbyId } }).catch(() => {});
          await prisma.lobby.delete({ where: { id: lobbyId } }).catch((err) => { console.error("Error deleting lobby leave:", err); });
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

        // Spam Check: Any continuous word > 15 characters
        if (user.role !== "ADMIN") {
          const cleanText = content.replace(/@\w+/g, '').trim();
          const hasSpamWord = cleanText.length > 0 && cleanText.split(/\s+/).some(word => word.length > 15);
          if (hasSpamWord) {
             if (ack) ack({ status: "error", error: { code: "SPAM", message: "پیام شما به عنوان اسپم شناسایی شد." } });
             return;
          }
        }

        // Media Integrity Check
        if (isMessageMediaIncomplete(content)) {
          if (ack) ack({ status: "error", error: { code: "INCOMPLETE_MEDIA", message: "رسانه به طور کامل لود نشده یا آدرس آن نامعتبر است." } });
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

        // Parse command triggers for Melody Lox Bot (Melody Edition)
        const trimmedContent = content.trim();
        if (trimmedContent.startsWith("/")) {
          const parts = trimmedContent.split(/\s+/);
          const cmd = parts[0].toLowerCase();
          const arg = parts.slice(1).join(" ");
          
          let bot = lobbyMusicBots.get(lobbyId);
          if (bot && bot.active && bot.botType === "melody") {
            if (cmd === "/p" && arg) {
              handleMelodyCommand(lobbyId, "p", arg);
            } else if (cmd === "/stop") {
              handleMelodyCommand(lobbyId, "stop", "");
            } else if (cmd === "/skip") {
              handleMelodyCommand(lobbyId, "skip", "");
            } else if (cmd === "/queue") {
              handleMelodyCommand(lobbyId, "queue", "");
            }
          }
        }

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

    socket.on("lobby.lan.relay", (data: { lobbyId: string, event: string, payload: any }) => {
      if (!data?.lobbyId || !data?.event) return;
      socket.to(`lobby:${data.lobbyId}`).emit("lobby.lan.event", {
        senderUserId: userId,
        event: data.event,
        payload: data.payload
      });
    });

    socket.on("disconnect", async () => {
      untrackUser(userId, socket.id);

      if (socket.handshake.query?.isElectron === "true") {
        console.log(`[LOBBY ELECTRON CLEANUP] Host/user with Electron disconnected: ${userId}`);
        
        // Find any lobby they host and close it
        const hostedLobbies = await prisma.lobby.findMany({
          where: { hostId: userId }
        });
        
        for (const l of hostedLobbies) {
          const lobbyId = l.id;
          await prisma.message.deleteMany({ where: { lobbyId } }).catch(() => {});
          await prisma.lobby.delete({ where: { id: lobbyId } }).catch((err) => { 
            console.error("[LOBBY ELECTRON CLEANUP] Error deleting lobby:", err); 
          });
          lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.closed", { lobbyId });
          console.log(`[LOBBY ELECTRON CLEANUP] Closed lobby ${lobbyId} hosted by ${userId}`);
        }
        
        // Remove memberships from any active lobbies
        const memberships = await prisma.lobbyMember.findMany({
          where: { userId }
        });
        
        for (const m of memberships) {
          const lobbyId = m.lobbyId;
          const remainingMembers = await prisma.lobbyMember.findMany({
            where: { lobbyId, NOT: { userId } }
          });
          
          await prisma.lobbyMember.delete({
            where: { lobbyId_userId: { lobbyId, userId } }
          }).catch(() => {});
          
          lobbyNs.to(`lobby:${lobbyId}`).emit("lobby.member_left", { 
            userId, 
            membersCount: remainingMembers.length
          });
        }
        
        emitLobbyUpdate();
      }
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
        const canDelete = message.senderId === userId || user?.role === "ADMIN" || user?.role === "HELPER";

        if (!canDelete) return;

        if (message.channelId === "news") {
          await prisma.message.delete({ where: { id: messageId } });
          chatNs.to(`channel:${message.channelId}`).emit("chat.message_removed", { messageId: data.messageId });
          return;
        }

        const isUserHelperOrAdmin = user?.role === "ADMIN" || user?.role === "HELPER";
        const content = (isUserHelperOrAdmin && message.senderId !== userId)
          ? "این پیام توسط Helper پاک شد"
          : "این پیام حذف شده است.";

        await prisma.message.update({
          where: { id: messageId },
          data: { isDeleted: true, content }
        });

        const room = message.channelId ? `channel:${message.channelId}` : message.lobbyId ? `lobby:${message.lobbyId}` : `user:${message.receiverId || message.senderId}`;
        chatNs.to(room).emit("chat.delete", { messageId: data.messageId, content });
      } catch (err) {
        console.error("Delete error:", err);
      }
    });

    socket.on("chat.warn_user", async (data: { targetUserId: string }, ack) => {
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const isHelperOrAdmin = user?.role === "ADMIN" || user?.role === "HELPER";
        if (!isHelperOrAdmin) {
          return ack?.({ status: "error", error: { message: "شما دسترسی به این بخش را ندارید." } });
        }

        const targetUser = await prisma.user.findUnique({ where: { id: data.targetUserId } });
        if (!targetUser) {
          return ack?.({ status: "error", error: { message: "کاربر مورد نظر یافت نشد." } });
        }

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Record warning
        await prisma.chatWarning.create({
          data: {
            userId: data.targetUserId,
            warnedById: userId
          }
        });

        const warningsToday = await prisma.chatWarning.count({
          where: {
            userId: data.targetUserId,
            createdAt: { gte: startOfToday }
          }
        });

        // Notify client in real-time
        chatNs.to(`user:${data.targetUserId}`).emit("chat.warning_received", {
          warningsToday,
          message: `شما یک اخطار چت دریافت کردید! تعداد اخطارهای امروز شما: ${warningsToday} از ۲.`
        });

        if (ack) {
          ack({ status: "ok", data: { warningsToday } });
        }
      } catch (err: any) {
        console.error("Warn error:", err);
        if (ack) ack({ status: "error", error: { message: err.message } });
      }
    });

    socket.on("chat.mute_user", async (data: { targetUserId: string, durationMinutes: number }, ack) => {
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const isHelperOrAdmin = user?.role === "ADMIN" || user?.role === "HELPER";
        if (!isHelperOrAdmin) {
          return ack?.({ status: "error", error: { message: "شما دسترسی به این بخش را ندارید." } });
        }

        const targetUser = await prisma.user.findUnique({ where: { id: data.targetUserId } });
        if (!targetUser) {
          return ack?.({ status: "error", error: { message: "کاربر مورد نظر یافت نشد." } });
        }

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const warningsCount = await prisma.chatWarning.count({
          where: {
            userId: data.targetUserId,
            createdAt: { gte: startOfToday }
          }
        });

        if (warningsCount < 2) {
          return ack?.({ status: "error", error: { message: `کاربر باید حداقل ۲ اخطار امروز داشته باشد تابتوانید او را ساکت (Mute) کنید. (اخطارهای امروز: ${warningsCount})` } });
        }

        const duration = Math.min(10, Math.max(2, data.durationMinutes || 2));
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + duration);

        await prisma.penalty.create({
          data: {
            userId: data.targetUserId,
            type: "CHAT_BAN",
            reason: `سکوت توسط مدیر به دلیل دریافت اخطارهای متعدد`,
            expiresAt
          }
        });

        chatNs.to(`user:${data.targetUserId}`).emit("chat.muted", {
          until: expiresAt.getTime(),
          message: `شما ساکت (Mute) شدید و تا ${duration} دقیقه آینده نمی‌توانید در چت‌ها پیام ارسال کنید.`
        });

        if (ack) {
          ack({ status: "ok", data: { duration, until: expiresAt.getTime() } });
        }
      } catch (err: any) {
        console.error("Mute error:", err);
        if (ack) ack({ status: "error", error: { message: err.message } });
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
             include: { 
               sender: { 
                 include: { 
                   profile: true,
                   badges: { include: { badge: true } }
                 } 
               },
               replyTo: {
                 include: { sender: true }
               }
             }
           });

           // Filter and delete corrupt messages
           const corruptIds: number[] = [];
           const validMessages = messages.filter(msg => {
             if (isMessageMediaIncomplete(msg.content)) {
               corruptIds.push(msg.id);
               return false;
             }
             return true;
           });

           if (corruptIds.length > 0) {
             prisma.message.deleteMany({
               where: { id: { in: corruptIds } }
             }).catch(err => console.error("Failed to delete corrupt channel messages:", err));
           }

           const formatted = validMessages.map(msg => ({
              id: msg.id.toString(),
              from: formatUserForSocket(msg.sender),
              targetType: "channel",
              targetId: data.id,
              content: msg.isDeleted ? "این پیام حذف شده است." : msg.content,
              isDeleted: msg.isDeleted,
              createdAt: msg.createdAt.getTime(),
              replyToId: msg.replyToId,
              replyTo: msg.replyTo ? {
                id: msg.replyTo.id.toString(),
                user: msg.replyTo.sender.username,
                text: msg.replyTo.isDeleted ? "این پیام حذف شده است." : msg.replyTo.content
              } : undefined,
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
             include: { 
               sender: { 
                 include: { 
                   profile: true,
                   badges: { include: { badge: true } }
                 } 
               },
               replyTo: {
                 include: { sender: true }
               }
             }
           });

           // Filter and delete corrupt messages
           const corruptIds: number[] = [];
           const validMessages = messages.filter(msg => {
             if (isMessageMediaIncomplete(msg.content)) {
               corruptIds.push(msg.id);
               return false;
             }
             return true;
           });

           if (corruptIds.length > 0) {
             prisma.message.deleteMany({
               where: { id: { in: corruptIds } }
             }).catch(err => console.error("Failed to delete corrupt user messages:", err));
           }

           const formatted = validMessages.map(msg => ({
              id: msg.id.toString(),
              from: formatUserForSocket(msg.sender),
              targetType: "user",
              targetId: data.id,
              content: msg.isDeleted ? "این پیام حذف شده است." : msg.content,
              isDeleted: msg.isDeleted,
              createdAt: msg.createdAt.getTime(),
              replyToId: msg.replyToId,
              replyTo: msg.replyTo ? {
                id: msg.replyTo.id.toString(),
                user: msg.replyTo.sender.username,
                text: msg.replyTo.isDeleted ? "این پیام حذف شده است." : msg.replyTo.content
              } : undefined,
              reactions: msg.reactions ? JSON.parse(msg.reactions) : []
           })).reverse();
           
           if (ack) ack({ status: "ok", data: { messages: formatted, memberCount: 2 } });
        } else if (data.type === "lobby") {
           const messages = await prisma.message.findMany({
             where: { lobbyId: data.id },
             take: 50,
             orderBy: { createdAt: "desc" },
             include: { 
               sender: { 
                 include: { 
                   profile: true,
                   badges: { include: { badge: true } }
                 } 
               },
               replyTo: {
                 include: { sender: true }
               }
             }
           });

           // Filter and delete corrupt messages
           const corruptIds: number[] = [];
           const validMessages = messages.filter(msg => {
             if (isMessageMediaIncomplete(msg.content)) {
               corruptIds.push(msg.id);
               return false;
             }
             return true;
           });

           if (corruptIds.length > 0) {
             prisma.message.deleteMany({
               where: { id: { in: corruptIds } }
             }).catch(err => console.error("Failed to delete corrupt lobby messages:", err));
           }

           const formatted = validMessages.map(msg => ({
              id: msg.id.toString(),
              from: formatUserForSocket(msg.sender),
              targetType: "lobby",
              targetId: data.id,
              content: msg.isDeleted ? "این پیام حذف شده است." : msg.content,
              isDeleted: msg.isDeleted,
              createdAt: msg.createdAt.getTime(),
              replyToId: msg.replyToId,
              replyTo: msg.replyTo ? {
                id: msg.replyTo.id.toString(),
                user: msg.replyTo.sender.username,
                text: msg.replyTo.isDeleted ? "این پیام حذف شده است." : msg.replyTo.content
              } : undefined,
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

      const penalty = await PenaltyService.checkPenalty(userId, ["CHAT_BAN"]);
      if (penalty.isBanned) {
        if (ack) ack({ status: "error", error: { code: "BANNED", message: penalty.message } });
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

      // Spam Check: Any continuous word > 15 characters
      const textToValidate = isImageMessage ? content.split("[IMAGE]:")[0] : content;
      if (user.role !== "ADMIN") {
        const cleanText = textToValidate.replace(/\[LOBBY_INVITE\]:[\w-]+/g, '').replace(/@\w+/g, '').trim();
        const hasSpamWord = cleanText.length > 0 && cleanText.split(/\s+/).some(word => word.length > 15);
        if (hasSpamWord) {
           if (ack) ack({ status: "error", error: { code: "SPAM", message: "پیام شما به عنوان اسپم شناسایی شد (استفاده از کلمات طولانی یا تکراری بیش از ۱۵ حرف)." } });
           return;
        }
      }

      // Media Integrity Check
      if (isMessageMediaIncomplete(content)) {
        if (ack) ack({ status: "error", error: { code: "INCOMPLETE_MEDIA", message: "رسانه به طور کامل لود نشده یا آدرس آن نامعتبر است." } });
        return;
      }

      // Profanity & Link Filter
      const hasLink = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i.test(content);
      const isGifOrImage = content.includes("[GIF]:") || content.includes("[IMAGE]:");
      const isVip = user.profile?.membershipType === "VIP";
      if (hasLink && user.role !== "ADMIN" && !isGifOrImage && !isVip) {
         if (ack) ack({ status: "error", error: { code: "FORBIDDEN_LINK", message: "ارسال لینک در چت عمومی ممنوع است." } });
         return;
      }

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

        if (!user) {
          console.error(`[CHAT SEND] User not found: ${userId}`);
          if (ack) ack({ status: "error", error: { code: "AUTH_EXPIRED", message: "User not found" } });
          return;
        }

        // Safe replyToId parsing
        let finalReplyToId: number | undefined = undefined;
        if (replyToId) {
          try {
            const parsed = parseInt(String(replyToId));
            if (!isNaN(parsed)) finalReplyToId = parsed;
          } catch (e) {
            console.warn(`[CHAT SEND] Invalid replyToId: ${replyToId}`);
          }
        }

        if (target.type === "lobby") {
          // Verify membership
          const membership = await prisma.lobbyMember.findUnique({
             where: { lobbyId_userId: { lobbyId: target.id, userId } }
          });
          if (!membership) {
            if (ack) ack({ status: "error", error: { code: "FORBIDDEN", message: "تراکنش لابی نامعتبر است." } });
            return;
          }

          const msg = await prisma.message.create({
            data: {
              content: safeContent,
              senderId: userId,
              lobbyId: target.id,
              replyToId: finalReplyToId
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
            id: msg.replyTo.id.toString(),
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
            replyToId: finalReplyToId ? String(finalReplyToId) : undefined,
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
              replyToId: finalReplyToId
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
            id: msg.replyTo.id.toString(),
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
            replyToId: finalReplyToId ? String(finalReplyToId) : undefined,
            replyTo: replyToData
          };
          chatNs.to(`user:${target.id}`).emit("chat.message", msgPayload);
          chatNs.to(`user:${userId}`).emit("chat.message", msgPayload);

          // Emit notification for the DM
          const { emitNotification } = await import("../utils/socket");
          emitNotification(target.id, "MESSAGE_RECEIVED", {
             senderId: userId,
             username: user.username,
             message: safeContent.substring(0, 50) + (safeContent.length > 50 ? "..." : "")
          });

          if (ack) ack({ status: "ok", data: { tempId, messageId: msg.id.toString(), createdAt: msg.createdAt.getTime() } });
          return;
        }

        const room = `channel:${target.id}`;

        // Ensure Channel exists
        const channelObj = await prisma.channel.upsert({
           where: { id: target.id },
           update: {},
           create: {
             id: target.id,
             title: target.id 
           }
        });

        // Timeout check for Elite groups
        if (channelObj && channelObj.type === "ELITE") {
           const metadata = channelObj.metadata ? JSON.parse(channelObj.metadata) : {};
           if (metadata.timeouts && metadata.timeouts[userId]) {
              if (Date.now() < metadata.timeouts[userId]) {
                 const remaining = Math.ceil((metadata.timeouts[userId] - Date.now()) / 60000);
                 if (ack) ack({ status: "error", error: { message: `شما به مدت ${remaining} دقیقه در گروه معلق هستید` }});
                 return;
              }
           }
        }

        const msg = await prisma.message.create({
          data: {
            content: safeContent,
            senderId: userId,
            channelId: target.id, 
            replyToId: finalReplyToId
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
          id: msg.replyTo.id.toString(),
          user: msg.replyTo.sender.username,
          text: msg.replyTo.content
        } : undefined;

        const msgPayload = {
          id: msg.id.toString(),
          tempId: tempId,
          from: formatUserForSocket(user),
          targetType: "channel",
          targetId: target.id,
          content: safeContent,
          createdAt: msg.createdAt.getTime(),
          replyToId: finalReplyToId ? String(finalReplyToId) : undefined,
          replyTo: replyToData
        };

        chatNs.to(room).emit("chat.message", msgPayload);

        if (ack) ack({ status: "ok", data: { tempId, messageId: msg.id.toString(), createdAt: msg.createdAt.getTime() } });
      } catch (err) {
        console.error("[CHAT SEND ERROR]", err);
        if (ack) ack({ status: "error", error: { code: "INTERNAL_ERROR", message: "خطا در ارسال پیام. دوباره تلاش کنید." } });
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
