import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { authenticate, authorizeAdmin, AuthenticatedRequest } from "../middleware/auth.middleware.ts";
import prisma from "../utils/prisma.ts";

const musicBotDir = path.join(process.cwd(), "public", "musicbot");

// Ensure base dir exists
if (!fs.existsSync(musicBotDir)) {
  fs.mkdirSync(musicBotDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.params.category || "dynamic";
    const dest = path.join(musicBotDir, category);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_"));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/") || /\.(mp3|wav|ogg|m4a)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files (mp3, wav, ogg, m4a) are allowed."));
    }
  }
});

const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { lobbyId } = req.params;
    const dest = path.join(musicBotDir, `temp-${lobbyId}`);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_"));
  }
});

const uploadTemp = multer({
  storage: tempStorage,
  limits: { fileSize: 30 * 1024 * 1024 }
});

const router = Router();

// Helper to recursively scan folders for music bot structure with banner images
function getFolderTree(dirPath: string): any {
  if (!fs.existsSync(dirPath)) return null;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const subfolders: any[] = [];
  const tracks: any[] = [];
  let bannerUrl = "";

  const bannerPath = path.join(dirPath, "banner.png");
  if (fs.existsSync(bannerPath)) {
    const rel = path.relative(path.join(process.cwd(), "public"), bannerPath);
    bannerUrl = `/public/${rel.replace(/\\/g, "/")}`;
  } else {
    bannerUrl = "/public/logo.png";
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const sub = getFolderTree(fullPath);
      if (sub) {
        subfolders.push({
          name: entry.name,
          ...sub
        });
      }
    } else if (entry.isFile()) {
      if (/\.(mp3|wav|ogg|m4a)$/i.test(entry.name)) {
        if (entry.name === "banner.png") continue;
        const fileRelPath = path.relative(path.join(process.cwd(), "public"), fullPath);
        tracks.push({
          id: entry.name,
          title: entry.name.replace(/\.[^/.]+$/, ""),
          url: `/public/${fileRelPath.replace(/\\/g, "/")}`,
          category: path.basename(dirPath)
        });
      }
    }
  }

  return {
    bannerUrl,
    tracks,
    subfolders: subfolders.length > 0 ? subfolders : undefined
  };
}

// Get all tracks flat recursively underneath a path
function getAllTracksFlat(dirPath: string, parentCategoryName: string = ""): any[] {
  let list: any[] = [];
  if (!fs.existsSync(dirPath)) return list;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      list = list.concat(getAllTracksFlat(fullPath, entry.name));
    } else if (entry.isFile()) {
      if (/\.(mp3|wav|ogg|m4a)$/i.test(entry.name)) {
        if (entry.name === "banner.png") continue;
        const fileRelPath = path.relative(path.join(process.cwd(), "public"), fullPath);
        list.push({
          id: entry.name,
          title: entry.name.replace(/\.[^/.]+$/, ""),
          url: `/public/${fileRelPath.replace(/\\/g, "/")}`,
          category: parentCategoryName || path.basename(dirPath)
        });
      }
    }
  }
  return list;
}

// GET TRACKS GROUPED BY CATEGORIES (Fully DB-driven)
router.get("/tracks", authenticate, async (req: Request, res: Response) => {
  try {
    const dbPlaylists = await prisma.playlist.findMany({
      include: {
        tracks: {
          include: {
            artists: true
          }
        }
      },
      orderBy: { name: "asc" }
    });

    const result: { [key: string]: any[] } = {};

    dbPlaylists.forEach(playlist => {
      const formattedTracks = playlist.tracks.map(t => {
        const artistNames = t.artists.map(a => a.name).join(" & ");
        return {
          id: t.id,
          title: artistNames ? `${t.title} - ${artistNames}` : t.title,
          url: t.url,
          category: playlist.name
        };
      });

      if (formattedTracks.length > 0) {
        result[playlist.name] = formattedTracks;
      }
    });

    // Also include tracks that are NOT on any playlist as a general "تک آهنگ‌ها" category
    const unlistedTracks = await prisma.track.findMany({
      where: {
        playlists: {
          none: {}
        }
      },
      include: {
        artists: true
      }
    });

    if (unlistedTracks.length > 0) {
      const formattedUnlisted = unlistedTracks.map(t => {
        const artistNames = t.artists.map(a => a.name).join(" & ");
        return {
          id: t.id,
          title: artistNames ? `${t.title} - ${artistNames}` : t.title,
          url: t.url,
          category: "تک آهنگ‌ها"
        };
      });
      result["تک آهنگ‌ها"] = formattedUnlisted;
    }

    res.json({ status: "success", data: result });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET SEEDED LIBRARIAN CATEGORIES (Fully DB-playlists driven)
router.get("/loxx-library", authenticate, async (req: Request, res: Response) => {
  try {
    // Fetch dynamic database playlists with tracks & artists
    const dbPlaylists = await prisma.playlist.findMany({
      include: {
        tracks: {
          include: {
            artists: true
          }
        }
      },
      orderBy: { name: "asc" }
    });

    // Prepare unified subfolders structure from database playlists
    const subfolders = dbPlaylists.map(playlist => {
      const formattedTracks = playlist.tracks.map(t => {
        const artistNames = t.artists.map(a => a.name).join(" & ");
        return {
          id: t.id,
          title: artistNames ? `${t.title} - ${artistNames}` : t.title,
          url: t.url,
          category: playlist.name
        };
      });

      return {
        name: playlist.name,
        bannerUrl: playlist.bannerUrl || "/public/logo.png",
        tracks: formattedTracks
      };
    });

    // Also include unlisted tracks as a pseudo category so they don't get lost
    const unlistedTracks = await prisma.track.findMany({
      where: {
        playlists: {
          none: {}
        }
      },
      include: {
        artists: true
      }
    });

    if (unlistedTracks.length > 0) {
      const formattedUnlisted = unlistedTracks.map(t => {
        const artistNames = t.artists.map(a => a.name).join(" & ");
        return {
          id: t.id,
          title: artistNames ? `${t.title} - ${artistNames}` : t.title,
          url: t.url,
          category: "تک آهنگ‌ها"
        };
      });

      subfolders.push({
        name: "تک آهنگ‌ها",
        bannerUrl: "/public/logo.png",
        tracks: formattedUnlisted
      });
    }

    // For backward compatibility, in case frontend still expects { irani, kharegi } container:
    // We will return a root structure with both keys populated with the full DB-driven playlists library!
    // This maintains immediate fallback while fully switching to DB source!
    res.json({
      status: "success",
      data: {
        irani: {
          bannerUrl: "/public/logo.png",
          tracks: [],
          subfolders: subfolders
        },
        kharegi: {
          bannerUrl: "/public/logo.png",
          tracks: [],
          subfolders: subfolders
        },
        subfolders
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// LIST ALL CATEGORIES & TRACKS
router.get("/categories", authenticate, async (req: Request, res: Response) => {
  try {
    const entries = fs.readdirSync(musicBotDir, { withFileTypes: true });
    const categoriesList = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const folderName = entry.name;
        const folderPath = path.join(musicBotDir, folderName);
        const files = fs.readdirSync(folderPath);

        const tracks = files
          .filter(f => /\.(mp3|wav|ogg|m4a)$/i.test(f))
          .map(f => ({
            name: f.substring(f.indexOf("_") + 1 || 0), // Strip prefixed timestamp if exists
            filename: f,
            url: `/public/musicbot/${folderName}/${f}`
          }));

        categoriesList.push({
          category: folderName,
          tracks
        });
      }
    }

    res.json({ status: "success", data: categoriesList });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// CREATE CATEGORY (Admin Only)
router.post("/category", authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ status: "error", message: "نام دسته‌بندی الزامی است" });
    }

    const folderName = name.replace(/[^a-zA-Z0-9\-_]/g, "_").toLowerCase();
    const folderPath = path.join(musicBotDir, folderName);

    if (fs.existsSync(folderPath)) {
      return res.status(400).json({ status: "error", message: "این دسته‌بندی از قبل وجود دارد" });
    }

    fs.mkdirSync(folderPath, { recursive: true });
    res.json({ status: "success", message: "دسته‌بندی جدید با موفقیت ساخته شد", data: { name: folderName } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// RENAME CATEGORY (Admin Only)
router.put("/category/:name", authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { newName } = req.body;

    if (!newName || newName.trim() === "") {
      return res.status(400).json({ status: "error", message: "نام جدید الزامی است" });
    }

    const oldPath = path.join(musicBotDir, name);
    const safeNewName = newName.replace(/[^a-zA-Z0-9\-_]/g, "_").toLowerCase();
    const newPath = path.join(musicBotDir, safeNewName);

    if (!fs.existsSync(oldPath)) {
      return res.status(404).json({ status: "error", message: "دسته‌بندی یافت نشد" });
    }

    if (fs.existsSync(newPath)) {
      return res.status(400).json({ status: "error", message: "نام جدید قبلا استفاده شده است" });
    }

    fs.renameSync(oldPath, newPath);
    res.json({ status: "success", message: "تغییر نام با موفقیت انجام شد", data: { name: safeNewName } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// DELETE CATEGORY (Admin Only)
router.delete("/category/:name", authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const folderPath = path.join(musicBotDir, name);

    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ status: "error", message: "دسته‌بندی یافت نشد" });
    }

    fs.rmSync(folderPath, { recursive: true, force: true });
    res.json({ status: "success", message: "دسته‌بندی با موفقیت حذف شد" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// UPLOAD TRACK TO CATEGORY (Admin Only)
router.post("/track/:category", authenticate, authorizeAdmin, upload.single("file"), async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "هیچ فایلی آپلود نشد" });
    }

    const filename = req.file.filename;
    res.json({
      status: "success",
      message: "موزیک مایل با موفقیت در دسته‌بندی بارگذاری شد",
      data: {
        name: filename.substring(filename.indexOf("_") + 1),
        filename,
        url: `/public/musicbot/${category}/${filename}`
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// DELETE TRACK (Admin Only)
router.delete("/track/:category/:filename", authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { category, filename } = req.params;
    const filePath = path.join(musicBotDir, category, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ status: "error", message: "فایل یافت نشد" });
    }

    fs.unlinkSync(filePath);
    res.json({ status: "success", message: "فایل موسیقی با موفقیت حذف شد" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// LOBBY USER UPLOAD TEMP MUSIC (Only for their current lobby session)
router.post("/lobby-temp-upload/:lobbyId", authenticate, uploadTemp.single("file"), async (req: Request, res: Response) => {
  try {
    const { lobbyId } = req.params;
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "هیچ فایلی برای آپلود یافت نشد" });
    }

    const filename = req.file.filename;
    res.json({
      status: "success",
      data: {
        name: filename.substring(filename.indexOf("_") + 1),
        filename,
        url: `/public/musicbot/temp-${lobbyId}/${filename}`
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET TEMP LOBBY MUSICS LIST
router.get("/lobby-temp-list/:lobbyId", authenticate, async (req: Request, res: Response) => {
  try {
    const { lobbyId } = req.params;
    const tempFolderPath = path.join(musicBotDir, `temp-${lobbyId}`);
    
    if (!fs.existsSync(tempFolderPath)) {
      return res.json({ status: "success", data: [] });
    }

    const files = fs.readdirSync(tempFolderPath);
    const tracks = files
      .filter(f => /\.(mp3|wav|ogg|m4a)$/i.test(f))
      .map(f => ({
        name: f.substring(f.indexOf("_") + 1),
        filename: f,
        url: `/public/musicbot/temp-${lobbyId}/${f}`
      }));

    res.json({ status: "success", data: tracks });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// --- ADMIN DYNAMIC MUSIC DATABASE API ENDPOINTS ---

// 1. GET ALL ARTISTS
router.get("/artists", authenticate, async (req: Request, res: Response) => {
  try {
    const artists = await prisma.artist.findMany({
      include: {
        _count: {
          select: { tracks: true }
        }
      },
      orderBy: { name: "asc" }
    });
    res.json({ status: "success", data: artists });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 2. CREATE A NEW ARTIST
router.post("/artist", authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { name, avatarUrl, bio } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ status: "error", message: "نام خواننده الزامی است" });
    }

    const trimmed = name.trim();
    let artist = await prisma.artist.findFirst({
      where: { name: trimmed }
    });

    if (artist) {
      return res.json({ status: "success", message: "این خواننده از قبل وجود دارد", data: artist });
    }

    artist = await prisma.artist.create({
      data: { name: trimmed, avatarUrl, bio }
    });

    res.json({ status: "success", message: "خواننده جدید با موفقیت اضافه شد", data: artist });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 2.5 UPDATE AN EXISTING ARTIST
router.put("/artist/:id", authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, avatarUrl, bio } = req.body;

    const artist = await prisma.artist.findUnique({ where: { id } });
    if (!artist) {
      return res.status(404).json({ status: "error", message: "خواننده مورد نظر یافت نشد" });
    }

    const updated = await prisma.artist.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        bio: bio !== undefined ? bio : undefined
      }
    });

    res.json({ status: "success", message: "اطلاعات خواننده با موفقیت بروزرسانی شد", data: updated });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 2.6 DELETE AN ARTIST
router.delete("/artist/:id", authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const artist = await prisma.artist.findUnique({ where: { id } });
    if (!artist) {
      return res.status(404).json({ status: "error", message: "خواننده مورد نظر یافت نشد" });
    }

    await prisma.artist.delete({ where: { id } });
    res.json({ status: "success", message: "خواننده با موفقیت از سیستم حذف شد" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 3. GET ALL PLAYLISTS
router.get("/db-playlists", authenticate, async (req: Request, res: Response) => {
  try {
    const playlists = await prisma.playlist.findMany({
      include: {
        _count: {
          select: { tracks: true }
        }
      },
      orderBy: { name: "asc" }
    });
    res.json({ status: "success", data: playlists });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 4. CREATE A NEW PLAYLIST
router.post("/db-playlist", authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { name, bannerUrl } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ status: "error", message: "نام پلی‌لیست الزامی است" });
    }

    const trimmed = name.trim();
    let playlist = await prisma.playlist.findFirst({
      where: { name: trimmed }
    });

    if (playlist) {
      return res.status(400).json({ status: "error", message: "این پلی‌لیست از قبل وجود دارد" });
    }

    playlist = await prisma.playlist.create({
      data: { name: trimmed, bannerUrl }
    });

    res.json({ status: "success", message: "پلی‌لیست جدید با موفقیت ساخته شد", data: playlist });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 5. DELETE A PLAYLIST
router.delete("/db-playlist/:id", authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.playlist.delete({ where: { id } });
    res.json({ status: "success", message: "پلی‌لیست با موفقیت حذف شد" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 5.5 UPDATE A PLAYLIST
router.put("/db-playlist/:id", authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, bannerUrl } = req.body;

    const playlist = await prisma.playlist.findUnique({ where: { id } });
    if (!playlist) {
      return res.status(404).json({ status: "error", message: "سبک/پلی‌لیست مورد نظر یافت نشد" });
    }

    const updated = await prisma.playlist.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        bannerUrl: bannerUrl !== undefined ? bannerUrl : undefined
      }
    });

    res.json({ status: "success", message: "سبک/پلی‌لیست با موفقیت بروزرسانی شد", data: updated });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Safe audio compression and metadata analyzer tool details
import { exec } from "child_process";

function tryCompressAudio(inputPath: string, outputPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`ffmpeg -i "${inputPath}" -b:a 128k "${outputPath}" -y`, (error) => {
      if (error) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

function getLocalPathFromUrl(url: string): string | null {
  if (url.startsWith("/api/v1/upload/file/")) {
    const filename = url.replace("/api/v1/upload/file/", "");
    return path.join(process.cwd(), "uploads", filename);
  }
  if (url.startsWith("/public/")) {
    return path.join(process.cwd(), url.substring(1));
  }
  return null;
}

// 6. GET ALL DB TRACKS WITH THEIR RELATIONSHIPS
router.get("/db-tracks", authenticate, async (req: Request, res: Response) => {
  try {
    const tracks = await prisma.track.findMany({
      include: {
        artists: true,
        playlists: true
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ status: "success", data: tracks });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 7. MULTIPART FILE UPLOAD OR URL REGISTRATION FOR DYNAMIC TRACK WITH AUTO-EXTRACTION & CREATION
router.post("/db-track/upload", authenticate, authorizeAdmin, upload.single("file"), async (req: Request, res: Response) => {
  try {
    const { manualTitle, url: bodyUrl, coverUrl: customCoverUrl } = req.body;
    const category = req.body.category || "dynamic";
    
    let url = bodyUrl || "";
    let originalName = "";

    if (req.file) {
      url = `/public/musicbot/${category}/${req.file.filename}`;
      originalName = req.file.originalname;
    } else if (bodyUrl) {
      originalName = bodyUrl.split("/").pop() || "track.mp3";
    } else {
      return res.status(400).json({ status: "error", message: "لطفا فایل صوتی را آپلود کنید یا آدرس آن را ارسال بفرمایید" });
    }

    // Extract title & artists from original name
    const orgName = originalName.replace(/\.[^/.]+$/, ""); // Strip file extension
    let detectedTitle = manualTitle || orgName;
    let detectedArtists: string[] = [];

    // Parse: split by dash
    const dashIdx = orgName.indexOf("-");
    if (!manualTitle && dashIdx !== -1) {
      const part1 = orgName.substring(0, dashIdx).trim();
      const part2 = orgName.substring(dashIdx + 1).trim();

      const match1 = await prisma.artist.findFirst({ where: { name: part1 } });
      const match2 = await prisma.artist.findFirst({ where: { name: part2 } });

      if (match2) {
        detectedTitle = part1;
        detectedArtists.push(part2);
      } else if (match1) {
        detectedTitle = part2;
        detectedArtists.push(part1);
      } else {
        detectedTitle = part2;
        detectedArtists.push(part1);
      }
    }

    // Read local file coordinates for cover and duration retrieval + audio 128k optimization
    const localFilePath = getLocalPathFromUrl(url);
    let duration = 0;
    let coverUrl = customCoverUrl || "";

    if (localFilePath && fs.existsSync(localFilePath)) {
      try {
        // Try audio compression first to guarantee file is lightweight without losing quality
        const compPath = localFilePath + "_128k";
        const didCompress = await tryCompressAudio(localFilePath, compPath);
        if (didCompress && fs.existsSync(compPath)) {
          fs.unlinkSync(localFilePath);
          fs.renameSync(compPath, localFilePath);
          console.log("[MUSICBOT] Combined audio stream optimized to 128kbps!");
        }

        // Parse meta markers via music-metadata
        const { parseFile } = await import("music-metadata");
        const metadata = await parseFile(localFilePath);

        if (metadata.format && metadata.format.duration) {
          duration = Math.round(metadata.format.duration);
        }

        if (!manualTitle && metadata.common && metadata.common.title) {
          detectedTitle = metadata.common.title;
        }

        // Auto extract embedded artwork if no custom cover of track is passed
        if (!coverUrl && metadata.common && metadata.common.picture && metadata.common.picture.length > 0) {
          const pic = metadata.common.picture[0];
          const ext = pic.format === "image/png" ? ".png" : ".jpg";
          const coverFilename = `cover_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
          const coversDir = path.join(process.cwd(), "public", "musicbot", "covers");
          if (!fs.existsSync(coversDir)) {
            fs.mkdirSync(coversDir, { recursive: true });
          }
          const coverPath = path.join(coversDir, coverFilename);
          fs.writeFileSync(coverPath, pic.data);

          // Apply Sharp image compression to keeping covers exceptionally small
          let sharpModule: any;
          try {
            sharpModule = require("sharp");
          } catch(e) {}

          if (sharpModule) {
            const tempCover = coverPath + "_tmp";
            try {
              await sharpModule(coverPath)
                .resize(256, 256, { fit: "cover", withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toFile(tempCover);

              fs.unlinkSync(coverPath);
              fs.renameSync(tempCover, coverPath);
            } catch (se) {
              console.error("[MUSICBOT] Sharp thumbnail resizing error:", se);
            }
          }

          coverUrl = `/public/musicbot/covers/${coverFilename}`;
        }
      } catch (metaError) {
        console.error("[MUSICBOT] Failed to parse tags from audio file:", metaError);
      }
    }

    // Resolve artist selection (manual or parsed input)
    let artistIdsList: string[] = [];
    if (req.body.artistIds) {
      try {
        artistIdsList = Array.isArray(req.body.artistIds) ? req.body.artistIds : JSON.parse(req.body.artistIds);
      } catch (e) {
        if (typeof req.body.artistIds === "string") {
          artistIdsList = req.body.artistIds.split(",").map((s: string) => s.trim());
        }
      }
    }

    // Process auto-extracted artists
    for (const artistName of detectedArtists) {
      const segments = artistName.split(/\s*[\,\&\+]\s*|\s+and\s+|\s+یا\s+/i);
      for (const seg of segments) {
        const cleanedName = seg.trim();
        if (!cleanedName) continue;

        let artist = await prisma.artist.findFirst({ where: { name: cleanedName } });
        if (!artist) {
          artist = await prisma.artist.create({ data: { name: cleanedName } });
        }
        if (!artistIdsList.includes(artist.id)) {
          artistIdsList.push(artist.id);
        }
      }
    }

    // Resolve playlist IDs
    let playlistIdsList: string[] = [];
    if (req.body.playlistIds) {
      try {
        playlistIdsList = Array.isArray(req.body.playlistIds) ? req.body.playlistIds : JSON.parse(req.body.playlistIds);
      } catch (e) {
        if (typeof req.body.playlistIds === "string") {
          playlistIdsList = req.body.playlistIds.split(",").map((s: string) => s.trim());
        }
      }
    }

    // Create track database record with duration & coverUrl
    const track = await prisma.track.create({
      data: {
        title: detectedTitle,
        url,
        duration,
        coverUrl: coverUrl || null,
        artists: {
          connect: artistIdsList.map(id => ({ id }))
        },
        playlists: {
          connect: playlistIdsList.map(id => ({ id }))
        }
      },
      include: {
        artists: true,
        playlists: true
      }
    });

    res.json({
      status: "success",
      message: "موزیک فایل با موفقیت در بانک اطلاعاتی ادمین آپلود و ثبت گردید",
      data: track
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 7.5 UPDATE A DB TRACK METADATA (Edit title, artists, playlists, coverUrl)
router.put("/db-track/:id", authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, artistIds, playlistIds, coverUrl } = req.body;

    const track = await prisma.track.findUnique({ where: { id } });
    if (!track) {
      return res.status(404).json({ status: "error", message: "آهنگ مورد نظر یافت نشد" });
    }

    const updated = await prisma.track.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        coverUrl: coverUrl !== undefined ? coverUrl : undefined,
        artists: artistIds ? {
          set: artistIds.map((aid: string) => ({ id: aid }))
        } : undefined,
        playlists: playlistIds ? {
          set: playlistIds.map((pid: string) => ({ id: pid }))
        } : undefined,
      },
      include: {
        artists: true,
        playlists: true
      }
    });

    res.json({ status: "success", data: updated });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 8. DELETE A DB TRACK (And physically unlink actual file)
router.delete("/db-track/:id", authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Find prior relation
    const track = await prisma.track.findUnique({ where: { id } });
    if (!track) {
      return res.status(404).json({ status: "error", message: "آهنگ مورد نظر یافت نشد" });
    }

    // Try unlinking local file if it is served from public folder
    if (track.url.startsWith("/public/")) {
      const physicalPath = path.join(process.cwd(), track.url);
      if (fs.existsSync(physicalPath)) {
        try {
          fs.unlinkSync(physicalPath);
        } catch (e) {
          console.error("[Track Deletion] Failed to physically unlink file:", e);
        }
      }
    }

    await prisma.track.delete({ where: { id } });
    res.json({ status: "success", message: "آهنگ با موفقیت از سیستم حذف گردید" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /profile - Get Loxx Music Bot dynamic visual characteristics
router.get("/profile", async (req: Request, res: Response) => {
  try {
    const defaultBotProfile = {
      avatarUrl: "/public/logo.png",
      bannerUrl: "/public/bg-hero.jpg",
      miniProfileBg: "linear-gradient(to bottom, #001220, #001f3f, #0a0a0f)",
      bio: "ربات هوشمند پخش موسیقی باکیفیت و زنده لابی‌های لوکس LOXX. دارای بالاترین عمق فرکانس پخش صوتی استریو."
    };
    const botProfilePath = path.join(musicBotDir, "profile.json");
    if (!fs.existsSync(botProfilePath)) {
      fs.writeFileSync(botProfilePath, JSON.stringify(defaultBotProfile, null, 2));
      return res.json({ status: "success", data: defaultBotProfile });
    }
    const data = JSON.parse(fs.readFileSync(botProfilePath, "utf-8"));
    res.json({ status: "success", data });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// POST /profile - Update Loxx Music Bot characteristics (Admin Only)
router.post("/profile", authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { avatarUrl, bannerUrl, miniProfileBg, bio } = req.body;
    const botProfilePath = path.join(musicBotDir, "profile.json");
    const defaultBotProfile = {
      avatarUrl: "/public/logo.png",
      bannerUrl: "/public/bg-hero.jpg",
      miniProfileBg: "linear-gradient(to bottom, #001220, #001f3f, #0a0a0f)",
      bio: "ربات هوشمند پخش موسیقی باکیفیت و زنده لابی‌های لوکس LOXX. دارای بالاترین عمق فرکانس پخش صوتی استریو."
    };
    let current = { ...defaultBotProfile };
    if (fs.existsSync(botProfilePath)) {
      try {
        current = JSON.parse(fs.readFileSync(botProfilePath, "utf-8"));
      } catch (e) {}
    }
    const updated = {
      avatarUrl: avatarUrl !== undefined ? avatarUrl : current.avatarUrl,
      bannerUrl: bannerUrl !== undefined ? bannerUrl : current.bannerUrl,
      miniProfileBg: miniProfileBg !== undefined ? miniProfileBg : current.miniProfileBg,
      bio: bio !== undefined ? bio : current.bio
    };
    fs.writeFileSync(botProfilePath, JSON.stringify(updated, null, 2));
    res.json({ status: "success", message: "پروفایل ربات موسیقی با موفقیت بروزرسانی شد", data: updated });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;
