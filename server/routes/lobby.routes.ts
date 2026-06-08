import { Router } from "express";
import { LobbyController } from "../controllers/lobby.controller.ts";
import { authenticate } from "../middleware/auth.middleware.ts";

const router = Router();

router.post("/create", authenticate, LobbyController.create);
router.post("/", authenticate, LobbyController.create);
router.get("/", LobbyController.list);
router.get("/:id", authenticate, LobbyController.getById);
router.post("/:id/join", authenticate, LobbyController.join);

export default router;
