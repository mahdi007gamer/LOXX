import { Request, Response } from "express";
import prisma from "../utils/prisma.ts";

export const getEnamadData = async (req: Request, res: Response) => {
  try {
    let config = await prisma.enamadConfig.findUnique({
      where: { id: "default" }
    });

    if (!config) {
      config = await prisma.enamadConfig.create({
        data: {
          id: "default",
          siteTitle: "لوکس | پلتفرم بازی های آنلاین",
          enamadMetaCode: "46418638"
        }
      });
    }

    const files = await prisma.verificationFile.findMany({
      orderBy: { createdAt: "desc" }
    });

    res.json({
      status: "success",
      data: {
        config,
        files
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const updateEnamadConfig = async (req: Request, res: Response) => {
  try {
    const { siteTitle, enamadMetaCode } = req.body;

    const config = await prisma.enamadConfig.upsert({
      where: { id: "default" },
      update: { siteTitle, enamadMetaCode },
      create: {
        id: "default",
        siteTitle,
        enamadMetaCode
      }
    });

    res.json({ status: "success", data: config, message: "تنظیمات تغییر نام و متاتگ با موفقیت بروزرسانی شد" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const createVerificationFile = async (req: Request, res: Response) => {
  try {
    const { filename, content } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ status: "error", message: "نام فایل و محتوا الزامی است" });
    }

    const file = await prisma.verificationFile.upsert({
      where: { filename },
      update: { content },
      create: { filename, content }
    });

    res.json({ status: "success", data: file, message: `فایل تاییدیه ${filename} با موفقیت ساخته شد` });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const deleteVerificationFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const file = await prisma.verificationFile.findUnique({
      where: { id }
    });

    if (!file) {
      return res.status(404).json({ status: "error", message: "فایل مورد نظر یافت نشد" });
    }

    await prisma.verificationFile.delete({
      where: { id }
    });

    res.json({ status: "success", message: `فایل تاییدیه ${file.filename} با موفقیت حذف شد` });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
