import { Router } from "express";
import { FriendshipController } from "../controllers/friendship.controller.ts";
import { authenticate } from "../middleware/auth.middleware.ts";

const router = Router();

router.get("/list", authenticate, FriendshipController.listFriends);
router.get("/activities", authenticate, FriendshipController.getFriendActivities);
router.get("/requests", authenticate, FriendshipController.listRequests);
router.post("/request", authenticate, FriendshipController.sendRequest);
router.post("/respond", authenticate, FriendshipController.respondRequest);
router.patch("/:id/favorite", authenticate, FriendshipController.toggleFavorite);
router.patch("/:id/mute", authenticate, FriendshipController.toggleMute);
router.patch("/:id/block", authenticate, FriendshipController.toggleBlock);
router.delete("/:id", authenticate, FriendshipController.removeFriend);

export default router;
