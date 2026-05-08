import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.ts";
import { UserController } from "../controllers/user.controller.ts";
import { authenticate } from "../middleware/auth.middleware.ts";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);
router.get("/me", authenticate, UserController.getMe);

export default router;
