import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { authenticate, authorizeAdmin, AuthenticatedRequest } from "../middleware/auth.middleware.ts";

const musicBotDir = path.join(process.cwd(), "public", "musicbot");

// Ensure base dir exists
if (!fs.existsSync(musicBotDir)) {
  fs.mkdirSync(musicBotDir, { recursive: true });
}

// Seed helper
function seedFolders() {
  const dirs = ["chill", "gaming", "lofi", "electronic"];
  dirs.forEach(d => {
    const p = path.join(musicBotDir, d);
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p, { recursive: true });
    }
  });

  const srcDummy = path.join(process.cwd(), "public", "Rest_in_Peace.mp3");
  if (fs.existsSync(srcDummy)) {
    dirs.forEach(d => {
      const destFile = path.join(musicBotDir, d, "Ambient Track.mp3");
      if (!fs.existsSync(destFile)) {
        try {
          fs.copyFileSync(srcDummy, destFile);
        } catch (e) {
          console.error(`[MusicBot Seed] Failed to copy dummy track to ${d}:`, e);
        }
      }
    });
  }
}
seedFolders();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { category } = req.params;
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

export default router;
