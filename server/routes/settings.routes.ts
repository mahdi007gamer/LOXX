import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller.ts";
import { authenticate } from "../middleware/auth.middleware.ts";

const router = Router();

router.get("/", authenticate, SettingsController.getSettings);
router.patch("/", authenticate, SettingsController.updateSettings);

export default router;
