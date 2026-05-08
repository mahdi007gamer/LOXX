import { Router } from "express";
import { RankingController } from "../controllers/ranking.controller.ts";
import { authenticate } from "../middleware/auth.middleware.ts";

const router = Router();

router.get("/", authenticate, RankingController.getLeaderboard);

export default router;
