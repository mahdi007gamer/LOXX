import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.ts";
import { UserController } from "../controllers/user.controller.ts";
import { authenticate } from "../middleware/auth.middleware.ts";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);
router.post("/verify-2fa", AuthController.verify2FA);
router.get("/me", authenticate, UserController.getMe);
router.post("/verify-email", AuthController.verifyEmail);
router.post("/send-verification-email", authenticate, AuthController.sendVerificationEmail);

export default router;
