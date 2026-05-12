import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { UploadController } from "../controllers/upload.controller.ts";
import { authenticate } from "../middleware/auth.middleware.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(process.cwd(), "uploads");
const privateUploadDir = path.join(process.cwd(), "uploads_private", "receipts");

// Ensure upload directories exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
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
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("فقط تصاویر jpg و png مجاز هستند (حداکثر ۱ مگابایت)"));
  }
});

const router = Router();

router.post("/", authenticate, upload.single("file"), UploadController.uploadFile);
router.post("/banner", authenticate, bannerUpload.single("file"), UploadController.uploadFile);
router.post("/receipt", authenticate, receiptUpload.single("file"), UploadController.uploadReceipt);
router.get("/file/:filename", UploadController.getFile);
router.get("/receipt/:filename", authenticate, UploadController.getReceipt);

export default router;
