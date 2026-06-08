import { Router } from "express";
import { GameController } from "../controllers/game.controller.ts";
import { authenticate } from "../middleware/auth.middleware.ts";

const router = Router();

router.get("/", GameController.getAllGames);
router.get("/:id", GameController.getGameById);

export default router;
