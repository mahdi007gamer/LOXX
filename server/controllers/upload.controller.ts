import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import prisma from "../utils/prisma.ts";

export class UploadController {
  static async uploadFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: {
            message: "فایلی ارسال نشده است"
          }
        });
      }

      // In a real production app, you might upload to S3 or Cloudinary.
      // Here we serve from local disk for the exercise.
      const filePath = `/uploads/${req.file.filename}`;
      
      return res.status(200).json({
        url: filePath,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    } catch (error: any) {
      return res.status(500).json({
        error: {
          message: error.message || "خطا در آپلود فایل"
        }
      });
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
