import { Router } from "express";
import { RankingController } from "../controllers/ranking.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, RankingController.getLeaderboard);

export default router;
