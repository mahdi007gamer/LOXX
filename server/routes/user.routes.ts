import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/:username", authenticate, UserController.getProfile);
router.patch("/update", authenticate, UserController.updateProfile);

export default router;
