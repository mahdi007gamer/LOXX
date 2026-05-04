import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, NotificationController.list);
router.post("/read", authenticate, NotificationController.markRead);

export default router;
