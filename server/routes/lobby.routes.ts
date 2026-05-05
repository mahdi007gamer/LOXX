import { Router } from "express";
import { LobbyController } from "../controllers/lobby.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/create", authenticate, LobbyController.create);
router.post("/", authenticate, LobbyController.create);
router.get("/", authenticate, LobbyController.list);
router.post("/:id/join", authenticate, LobbyController.join);

export default router;
