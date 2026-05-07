import { Router } from "express";
import { GameController } from "../controllers/game.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", GameController.getAllGames);
router.get("/:id", GameController.getGameById);

export default router;
