import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.ts";
import { StreamerController } from "../controllers/streamer.controller.ts";

const router = Router();

router.use(authenticate);

router.get("/stats", StreamerController.getStats);
router.post("/update-info", StreamerController.updateInfo);
router.post("/withdraw", StreamerController.requestWithdrawal);

export default router;
