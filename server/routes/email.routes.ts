import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.ts";
import * as emailController from "../controllers/email.controller.ts";

const router = Router();

// Apply auth middleware to all email routes
router.use(authenticate);

router.get("/accounts", emailController.getEmailAccounts);
router.post("/accounts", emailController.createEmailAccount);
router.delete("/accounts/:id", emailController.deleteEmailAccount);

router.get("/messages", emailController.getEmailMessages);
router.post("/messages/send", emailController.sendEmailMessage);
router.post("/messages/receive-test", emailController.receiveTestEmail);
router.patch("/messages/:id/read", emailController.markAsRead);
router.delete("/messages/:id", emailController.deleteEmailMessage);

export default router;
