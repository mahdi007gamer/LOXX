import { Router } from "express";
import { FriendshipController } from "../controllers/friendship.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/list", authenticate, FriendshipController.listFriends);
router.post("/request", authenticate, FriendshipController.sendRequest);
router.post("/respond", authenticate, FriendshipController.respondRequest);

export default router;
