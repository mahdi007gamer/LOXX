import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { UploadController } from "../controllers/upload.controller.ts";
import { authenticate } from "../middleware/auth.middleware.ts";

const uploadDir = path.join(process.cwd(), "uploads");
const gifsDir = path.join(process.cwd(), "uploads", "gifs");
const privateUploadDir = path.join(process.cwd(), "uploads_private", "receipts");

// Ensure upload directories exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(gifsDir)) {
  fs.mkdirSync(gifsDir, { recursive: true });
}
if (!fs.existsSync(privateUploadDir)) {
  fs.mkdirSync(privateUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const privateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, privateUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "receipt-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit (matched with Express limit)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === "image/svg+xml";

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("فقط تصاویر (jpg, png, gif, webp, svg) مجاز هستند"));
  }
});

const receiptUpload = multer({
  storage: privateStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("فقط تصاویر رسید (jpg, png, webp) مجاز هستند"));
  }
});

const bannerUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("فقط تصاویر jpg, png و gif مجاز هستند"));
  }
});

const audioUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|ogg|m4a/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.startsWith('audio/');

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("فقط فایل‌های صوتی مجاز هستند (mp3, wav, ogg, m4a)"));
  }
});

const router = Router();

router.post("/", authenticate, upload.single("file"), UploadController.uploadFile);
router.post("/audio", authenticate, audioUpload.single("file"), UploadController.uploadFile);
router.post("/gif", authenticate, upload.single("file"), UploadController.uploadGif);
router.post("/banner", authenticate, bannerUpload.single("file"), UploadController.uploadFile);
router.post("/receipt", authenticate, receiptUpload.single("file"), UploadController.uploadReceipt);
router.get("/file/gifs/:filename", UploadController.getGifFile);
router.get("/file/:filename", UploadController.getFile);
router.get("/receipt/:filename", authenticate, UploadController.getReceipt);

// Dynamic GIFs Gallery endpoints
router.get("/gifs", authenticate, UploadController.listGifs);
router.put("/gifs/:id", authenticate, UploadController.updateGif);
router.delete("/gifs/:id", authenticate, UploadController.deleteGif);
router.post("/gifs/store", authenticate, upload.single("file"), UploadController.adminUploadGif);

export default router;
