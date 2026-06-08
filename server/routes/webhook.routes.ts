import { Router } from "express";
import { WebhookController } from "../controllers/webhook.controller.ts";

const router = Router();

router.post("/bale", WebhookController.handleBale);

export default router;
