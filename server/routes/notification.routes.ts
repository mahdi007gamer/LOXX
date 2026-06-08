import express from "express";
import { NotificationController } from "../controllers/notification.controller.ts";
import { authenticate } from "../middleware/auth.middleware.ts";

const router = express.Router();

router.get("/", authenticate, NotificationController.list);
router.post("/read", authenticate, NotificationController.markRead);
router.delete("/:id", authenticate, NotificationController.delete);

export default router;
