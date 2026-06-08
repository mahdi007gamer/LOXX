import { Router } from "express";
import { UserController } from "../controllers/user.controller.ts";
import { authenticate } from "../middleware/auth.middleware.ts";

const router = Router();

router.get("/all/count", UserController.getTotalUserCount);
router.get("/me/stats", authenticate, UserController.getStats);
router.get("/me/games", authenticate, UserController.getMyGames);
router.post("/me/games/toggle", authenticate, UserController.toggleGame);
router.patch("/profile", authenticate, UserController.updateProfile);
router.patch("/security/password", authenticate, UserController.changePassword);
router.patch("/:id/verify", authenticate, UserController.verifyUserManually);
router.post("/me/2fa/enable", authenticate, UserController.enable2FA);
router.post("/me/2fa/verify", authenticate, UserController.verify2FA);
router.post("/me/2fa/disable", authenticate, UserController.disable2FA);
router.get("/me/sessions", authenticate, UserController.getDevices);
router.delete("/me/sessions/:id", authenticate, UserController.revokeDevice);
router.get("/:username", authenticate, UserController.getProfile);

export default router;
