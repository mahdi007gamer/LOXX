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

  static async uploadGif(req: any, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: {
            message: "گیف ارسال نشده است"
          }
        });
      }

      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "کاربر تایید صلاحیت نشده است" });
      }

      // Check user VIP status
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      });

      if (!user || (user.profile?.membershipType !== "VIP" && user.role !== "ADMIN")) {
        // Delete uploaded file to avoid waste
        const tempPath = path.join(process.cwd(), "uploads", req.file.filename);
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
        return res.status(403).json({
          error: {
            message: "تنها کاربران دارای اشتراک VIP مجاز به آپلود گیف‌های جدید هستند."
          }
        });
      }

      const { originalname, size, filename } = req.file;

      // Deduplication / Spam prevention check
      const existing = await prisma.uploadedGif.findFirst({
        where: { originalName: originalname, size: size }
      });

      if (existing) {
        // Delete the newly uploaded temporary file
        const tempPath = path.join(process.cwd(), "uploads", filename);
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
        return res.status(200).json({
          url: existing.url,
          filename: existing.url.split("/").pop(),
          size: existing.size,
          mimetype: "image/gif",
          status: "duplicate"
        });
      }

      // If it doesn't exist, process and compress
      const gifsDir = path.join(process.cwd(), "uploads", "gifs");
      if (!fs.existsSync(gifsDir)) {
        fs.mkdirSync(gifsDir, { recursive: true });
      }

      const sourcePath = path.join(process.cwd(), "uploads", filename);
      const destPath = path.join(gifsDir, filename);

      // Move file to /uploads/gifs
      fs.renameSync(sourcePath, destPath);

      // Compress/resize the GIF using our existing helper in the new folder
      await UploadController.compressImage(destPath, "chat");

      const finalSize = fs.statSync(destPath).size;
      const url = `/api/v1/upload/file/gifs/${filename}`;

      // Create record
      const dbGif = await prisma.uploadedGif.create({
        data: {
          originalName: originalname,
          size: finalSize,
          url
        }
      });

      return res.status(200).json({
        url: dbGif.url,
        filename,
        mimetype: "image/gif",
        size: finalSize,
        status: "new"
      });

    } catch (error: any) {
      return res.status(500).json({
        error: {
          message: error.message || "خطا در آپلود گیف"
        }
      });
    }
  }

  static async getGifFile(req: Request, res: Response) {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), "uploads", "gifs", filename);
      
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

  static async listGifs(req: Request, res: Response) {
    try {
      const q = req.query.q as string || "";
      const query = q.trim();

      let whereClause = {};
      if (query) {
        whereClause = {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { tags: { contains: query, mode: "insensitive" } },
            { originalName: { contains: query, mode: "insensitive" } }
          ]
        };
      }

      const gifs = await prisma.uploadedGif.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" }
      });

      return res.status(200).json(gifs);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "خطا در دریافت لیست گیف‌ها" });
    }
  }

  static async updateGif(req: any, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const adminUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!adminUser || adminUser.role !== "ADMIN") {
        return res.status(403).json({ error: "شما دسترسی به این بخش را ندارید." });
      }

      const { id } = req.params;
      const { title, tags } = req.body;

      const updated = await prisma.uploadedGif.update({
        where: { id },
        data: {
          title: title || "",
          tags: tags || ""
        }
      });

      return res.status(200).json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "خطا در ویرایش گیف" });
    }
  }

  static async deleteGif(req: any, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const adminUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!adminUser || adminUser.role !== "ADMIN") {
        return res.status(403).json({ error: "شما دسترسی به این بخش را ندارید." });
      }

      const { id } = req.params;
      const gif = await prisma.uploadedGif.findUnique({ where: { id } });
      if (!gif) {
        return res.status(404).json({ error: "گیف پیدا نشد." });
      }

      // Try to remove from disk if possible
      const filename = gif.url.split("/").pop();
      if (filename) {
        const filePath = path.join(process.cwd(), "uploads", "gifs", filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await prisma.uploadedGif.delete({ where: { id } });

      return res.status(200).json({ success: true, message: "گیف با موفقیت حذف شد." });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "خطا در حذف گیف" });
    }
  }

  static async adminUploadGif(req: any, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "گیف گالری ارسال نشده است" });
      }

      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const adminUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!adminUser || adminUser.role !== "ADMIN") {
        return res.status(403).json({ error: "تنها ادمین‌ها مجاز به اضافه کردن گیف به گالری هستند." });
      }

      const { title, tags } = req.body;
      const { originalname, size, filename } = req.file;

      const gifsDir = path.join(process.cwd(), "uploads", "gifs");
      if (!fs.existsSync(gifsDir)) {
        fs.mkdirSync(gifsDir, { recursive: true });
      }

      const sourcePath = path.join(process.cwd(), "uploads", filename);
      const destPath = path.join(gifsDir, filename);

      fs.renameSync(sourcePath, destPath);

      await UploadController.compressImage(destPath, "chat");

      const finalSize = fs.statSync(destPath).size;
      const url = `/api/v1/upload/file/gifs/${filename}`;

      const dbGif = await prisma.uploadedGif.create({
        data: {
          originalName: originalname,
          title: title || "",
          tags: tags || "",
          size: finalSize,
          url
        }
      });

      return res.status(200).json(dbGif);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "خطا در آپلود گیف گالری" });
    }
  }

  static async uploadChunk(req: any, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No chunk file received" });
      }

      const { fileId, chunkIndex, totalChunks, filename, target, title, tags } = req.body;
      if (!fileId || chunkIndex === undefined || !totalChunks || !filename) {
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ error: "Missing chunk metadata" });
      }

      const idx = parseInt(chunkIndex);
      const total = parseInt(totalChunks);

      const chunksDir = path.join(process.cwd(), "uploads", "chunks", fileId);
      if (!fs.existsSync(chunksDir)) {
        fs.mkdirSync(chunksDir, { recursive: true });
      }

      // Move chunk to its temp path
      const chunkPath = path.join(chunksDir, `${idx}`);
      fs.renameSync(req.file.path, chunkPath);

      // Check if all chunks are uploaded
      const files = fs.readdirSync(chunksDir);
      if (files.length === total) {
        const ext = path.extname(filename);
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const assembledFilename = `assembled-${uniqueSuffix}${ext}`;
        
        let targetDir = path.join(process.cwd(), "uploads");
        if (target === "gif") {
          targetDir = path.join(process.cwd(), "uploads", "gifs");
        }
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const finalPath = path.join(targetDir, assembledFilename);
        const writeStream = fs.createWriteStream(finalPath);

        // Assemble chunks in order
        for (let i = 0; i < total; i++) {
          const currentChunkPath = path.join(chunksDir, `${i}`);
          if (!fs.existsSync(currentChunkPath)) {
            writeStream.end();
            return res.status(400).json({ error: `Missing chunk index ${i}` });
          }
          const buffer = fs.readFileSync(currentChunkPath);
          writeStream.write(buffer);
        }
        writeStream.end();

        // Wait for streaming to finish
        await new Promise<void>((resolve) => writeStream.on("finish", () => resolve()));

        // Clean up chunk folder
        fs.rmSync(chunksDir, { recursive: true, force: true });

        // Perform target logic or compression
        if (target === "audio") {
          const url = `/api/v1/upload/file/${assembledFilename}`;
          return res.status(200).json({
            url,
            filename: assembledFilename,
            size: fs.statSync(finalPath).size,
            mimetype: "audio/mp3",
            status: "complete"
          });
        } else if (target === "gif") {
          await UploadController.compressImage(finalPath, "chat");
          const finalSize = fs.statSync(finalPath).size;
          const url = `/api/v1/upload/file/gifs/${assembledFilename}`;
          
          const dbGif = await prisma.uploadedGif.create({
            data: {
              originalName: filename,
              title: title || "",
              tags: tags || "",
              size: finalSize,
              url
            }
          });
          return res.status(200).json(dbGif);
        } else {
          await UploadController.compressImage(finalPath, target || "default");
          const finalSize = fs.statSync(finalPath).size;
          const url = `/api/v1/upload/file/${assembledFilename}`;
          return res.status(200).json({
            url,
            filename: assembledFilename,
            size: finalSize,
            status: "complete"
          });
        }
      }

      return res.status(200).json({ status: "chunk_received", chunkIndex: idx });
    } catch (error: any) {
      console.error("Chunk upload error:", error);
      return res.status(500).json({ error: error.message || "Failed to process chunk" });
    }
  }
}
