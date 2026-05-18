import { Router } from "express";
import { ChatController } from "../controllers/chat.controller.ts";
import { authenticate } from "../middleware/auth.middleware.ts";

const router = Router();

router.get("/recent-dms", authenticate, ChatController.getRecentDms);
router.get("/:id/messages", authenticate, ChatController.getMessages);

export default router;
