import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.ts";
import { UserController } from "../controllers/user.controller.ts";
import { authenticate } from "../middleware/auth.middleware.ts";
import { authLimiter } from "../middleware/rateLimit.middleware.ts";

const router = Router();

router.post("/register", authLimiter, AuthController.register);
router.post("/login", authLimiter, AuthController.login);
router.post("/forgot-password", authLimiter, AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);
router.post("/verify-2fa", AuthController.verify2FA);
router.post("/bale/url", AuthController.getBaleLoginUrl);
router.post("/bale/callback", AuthController.verifyBaleCallback);
router.get("/me", authenticate, UserController.getMe);
router.get("/status/:phone", AuthController.checkStatus);
router.post("/send-verification-link", authenticate, AuthController.sendBaleVerificationLink);

export default router;
