import { Request, Response } from "express";
import { BadgeService } from "../services/badge.service.ts";

export class BadgeController {
  static async getAllBadges(req: Request, res: Response) {
    try {
      const badges = await BadgeService.getAllBadges();
      res.json({ status: "success", data: badges });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  static async getBadgesByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const badges = await BadgeService.getBadgesByCategory(category);
      res.json({ status: "success", data: badges });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  static async createBadge(req: Request, res: Response) {
    try {
      const badge = await BadgeService.createBadge(req.body);
      res.json({ status: "success", data: badge });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  static async updateBadge(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const badge = await BadgeService.updateBadge(id, req.body);
      res.json({ status: "success", data: badge });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  static async deleteBadge(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await BadgeService.deleteBadge(id);
      res.json({ status: "success", message: "Badge deleted" });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  static async togglePin(req: Request, res: Response) {
    try {
      const { badgeId } = req.params;
      const { isPinned } = req.body;
      const userId = (req as any).user.id;
      const result = await BadgeService.pinBadge(userId, badgeId, isPinned);
      res.json({ status: "success", data: result });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  static async getUserBadges(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const badges = await BadgeService.getUserBadges(userId);
      res.json({ status: "success", data: badges });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  static async adminAssignBadge(req: Request, res: Response) {
    try {
      const { userId, badgeId } = req.body;
      const result = await BadgeService.assignBadge(userId, badgeId);
      res.json({ status: "success", data: result });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  static async adminRemoveBadge(req: Request, res: Response) {
    try {
      const { userId, badgeId } = req.body;
      await BadgeService.removeBadge(userId, badgeId);
      res.json({ status: "success", message: "Badge removed from user" });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
}
