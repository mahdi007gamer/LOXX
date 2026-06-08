import { Router } from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware.ts";
import * as emailController from "../controllers/email.controller.ts";

const router = Router();

// Public Webhook for Inbound Email Forwarding (No auth header required)
router.post("/incoming", emailController.handleIncomingWebhook);

// Auth & Admin middlewares apply to all internal mailbox management routes
router.use(authenticate);
router.use(authorizeAdmin);

router.get("/accounts", emailController.getEmailAccounts);
router.post("/accounts", emailController.createEmailAccount);
router.delete("/accounts/:id", emailController.deleteEmailAccount);

router.get("/messages", emailController.getEmailMessages);
router.post("/messages/send", emailController.sendEmailMessage);
router.post("/messages/receive-test", emailController.receiveTestEmail);
router.patch("/messages/:id/read", emailController.markAsRead);
router.delete("/messages/:id", emailController.deleteEmailMessage);

export default router;
