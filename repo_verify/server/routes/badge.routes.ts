import { Router } from "express";
import { BadgeController } from "../controllers/badge.controller.ts";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware.ts";

const router = Router();

// Public/User routes
router.get("/", authenticate, BadgeController.getAllBadges);
router.get("/category/:category", authenticate, BadgeController.getBadgesByCategory);
router.get("/my", authenticate, BadgeController.getUserBadges);
router.post("/pin/:badgeId", authenticate, BadgeController.togglePin);
router.post("/toggle-standard/:badgeId", authenticate, BadgeController.toggleStandardBadge);

// Admin routes
router.post("/", authenticate, authorizeAdmin, BadgeController.createBadge);
router.put("/:id", authenticate, authorizeAdmin, BadgeController.updateBadge);
router.delete("/:id", authenticate, authorizeAdmin, BadgeController.deleteBadge);
router.post("/assign", authenticate, authorizeAdmin, BadgeController.adminAssignBadge);
router.post("/remove", authenticate, authorizeAdmin, BadgeController.adminRemoveBadge);

export default router;
