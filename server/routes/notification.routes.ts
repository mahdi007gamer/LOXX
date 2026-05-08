import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller.ts";
import { authenticate } from "../middleware/auth.middleware.ts";

const router = Router();

router.get("/", authenticate, NotificationController.list);
router.post("/read", authenticate, NotificationController.markRead);

export default router;
