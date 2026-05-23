import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import prisma from "../utils/prisma.ts";

let sharp: any;
try {
  sharp = require("sharp");
} catch (e) {
  console.warn("Sharp module not found or incompatible (might be unsupported CPU). Image compression disabled.");
}

export class UploadController {
  private static async compressImage(filePath: string, target: string) {
    if (!sharp) {
      console.warn(`Skipping compression for ${filePath} because sharp is not available.`);
      return;
    }
    
    try {
      const ext = path.extname(filePath).toLowerCase();
      if (![".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
        return;
      }

      const tempPath = filePath + "_tmp";
      let width = 1000;

      switch (target) {
        case "profile": width = 256; break;
        case "cover": width = 800; break; // Increased from 300 to 800 for better wide screen support
        case "elite_bg": width = 600; break;
        case "badge": width = 200; break;
        case "game_profile": width = 200; break;
        case "game_banner": width = 450; break; // Increased as requested for 16:9 quality
        case "chat": width = 1000; break;
      }

      const isGif = ext === ".gif";
      const isWebp = ext === ".webp";
      const isPng = ext === ".png";

      // For GIFs, we need animated: true to process all frames
      const image = sharp(filePath, (isGif || isWebp) ? { animated: true } : {});
      const metadata = await image.metadata();

      // Proportional resizing (maintains aspect ratio)
      const resizeWidth = (metadata.width && metadata.width > width) ? width : metadata.width;

      // Pipeline for processing
      let pipeline = image.resize(resizeWidth, null, { withoutEnlargement: true });

      if (isGif) {
        // Keep GIF animated and apply optimization
        await pipeline.gif().toFile(tempPath);
      } else if (isWebp) {
        // Maintain WebP format and animation if present
        await pipeline.webp({ quality: 80, effort: 4 }).toFile(tempPath);
      } else if (isPng) {
        // Maintain PNG transparency without losing alpha channel
        await pipeline.png({ compressionLevel: 9 }).toFile(tempPath);
      } else {
        // Default to high-quality JPEG for others
        await pipeline.jpeg({ quality: 85, mozjpeg: true, chromaSubsampling: "4:4:4" }).toFile(tempPath);
      }

      fs.unlinkSync(filePath);
      fs.renameSync(tempPath, filePath);
    } catch (error) {
      console.error("Compression error:", error);
    }
  }

  static async uploadFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: {
            message: "فایلی ارسال نشده است"
          }
        });
      }

      const target = (req.query.target as string) || (req.body.target as string) || 'default';
      const fullPath = path.join(process.cwd(), "uploads", req.file.filename);

      // Perform compression
      await UploadController.compressImage(fullPath, target);
      
      return res.status(200).json({
        url: `/api/v1/upload/file/${req.file.filename}`,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: fs.statSync(fullPath).size // Get compressed size
      });
    } catch (error: any) {
      return res.status(500).json({
        error: {
          message: error.message || "خطا در آپلود فایل"
        }
      });
    }
  }

  static async getFile(req: Request, res: Response) {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), "uploads", filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      return res.sendFile(filePath);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async uploadReceipt(req: any, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: {
            message: "رسید ارسال نشده است"
          }
        });
      }

      // Return a special path that goes through our auth-protected route
      const filePath = `/api/v1/upload/receipt/${req.file.filename}`;
      
      return res.status(200).json({
        url: filePath,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    } catch (error: any) {
      return res.status(500).json({
        error: {
          message: error.message || "خطا در آپلود رسید"
        }
      });
    }
  }

  static async getReceipt(req: any, res: Response) {
    try {
      const { filename } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if user is admin
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.role !== "ADMIN") {
        // If not admin, check if this receipt belongs to them
        const payment = await prisma.paymentRequest.findFirst({
          where: {
            userId: userId,
            receiptImageUrl: {
              contains: filename
            }
          }
        });

        if (!payment) {
          return res.status(403).json({ error: "Access denied. Only admins or the owner can view this receipt." });
        }
      }

      const filePath = path.join(process.cwd(), "uploads_private", "receipts", filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      return res.sendFile(filePath);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
