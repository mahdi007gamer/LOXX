import { Request, Response } from "express";
import path from "path";
import fs from "fs";

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
}
