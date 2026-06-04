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

// 7. MULTIPART FILE UPLOAD FOR DYNAMIC TRACK WITH AUTO-EXTRACTION & CREATION
router.post("/db-track/upload", authenticate, authorizeAdmin, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "هیچ فایلی آپلود نشد" });
    }

    const { manualTitle } = req.body;
    const category = req.body.category || "dynamic";
    const filename = req.file.filename;
    
    // Save locally or use public link
    const url = `/public/musicbot/${category}/${filename}`;

    // Extract title & artists from name
    const orgName = req.file.originalname.replace(/\.[^/.]+$/, ""); // Strip file extension
    let detectedTitle = manualTitle || orgName;
    let detectedArtists: string[] = [];

    // Parse: split by dash
    const dashIdx = orgName.indexOf("-");
    if (!manualTitle && dashIdx !== -1) {
      const part1 = orgName.substring(0, dashIdx).trim();
      const part2 = orgName.substring(dashIdx + 1).trim();

      // Check if either part 1 or part 2 corresponds to a known artist
      const match1 = await prisma.artist.findFirst({ where: { name: part1 } });
      const match2 = await prisma.artist.findFirst({ where: { name: part2 } });

      if (match2) {
        // e.g. "Bad Bash - Sami Beigi" -> Part 2 is the artist
        detectedTitle = part1;
        detectedArtists.push(part2);
      } else if (match1) {
        // e.g. "Sami Beigi - Bad Bash" -> Part 1 is the artist
        detectedTitle = part2;
        detectedArtists.push(part1);
      } else {
        // Default separator assumption: Part 1 is Artist, Part 2 is Title
        detectedTitle = part2;
        detectedArtists.push(part1);
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
      // Split by common separators if multiple featuring artists exist
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

    // Create track database record
    const track = await prisma.track.create({
      data: {
        title: detectedTitle,
        url,
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

// 7.5 UPDATE A DB TRACK METADATA (Edit title, artists, playlists)
router.put("/db-track/:id", authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, artistIds, playlistIds } = req.body;

    const track = await prisma.track.findUnique({ where: { id } });
    if (!track) {
      return res.status(404).json({ status: "error", message: "آهنگ مورد نظر یافت نشد" });
    }

    const updated = await prisma.track.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
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

export default router;
