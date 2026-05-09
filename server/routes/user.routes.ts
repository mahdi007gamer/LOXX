import { Router } from "express";
import { UserController } from "../controllers/user.controller.ts";
import { authenticate } from "../middleware/auth.middleware.ts";

const router = Router();

router.get("/all/count", UserController.getTotalUserCount);
router.get("/me/stats", authenticate, UserController.getStats);
router.get("/me/games", authenticate, UserController.getMyGames);
router.post("/me/games/toggle", authenticate, UserController.toggleGame);
router.get("/me/devices", authenticate, UserController.getDevices);
router.delete("/me/devices/:id", authenticate, UserController.revokeDevice);
router.get("/:username", authenticate, UserController.getProfile);
router.patch("/profile", authenticate, UserController.updateProfile);
router.patch("/security/password", authenticate, UserController.changePassword);

router.post("/me/2fa/setup", authenticate, UserController.setup2FA);
router.post("/me/2fa/verify", authenticate, UserController.verify2FA);
router.post("/me/2fa/disable", authenticate, UserController.disable2FA);

export default router;
