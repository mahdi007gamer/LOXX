import { Router } from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware.ts";
import { StreamerController } from "../controllers/streamer.controller.ts";

const router = Router();

// Public endpoints
router.get("/invite/:alias", StreamerController.getInviteByAlias);
router.post("/invite/:alias/cooperate", StreamerController.submitCooperation);
router.get("/invite/:alias/proposals", StreamerController.getActiveProposalForAlias);

router.use(authenticate);

// Streamer endpoints
router.get("/stats", StreamerController.getStats);
router.post("/update-info", StreamerController.updateInfo);
router.post("/withdraw", StreamerController.requestWithdrawal);

// Admin endpoints for cooperation proposals
router.get("/cooperation-proposals", authorizeAdmin, StreamerController.getCooperationProposals);
router.put("/cooperation-proposals/:id", authorizeAdmin, StreamerController.updateCooperationStatus);
router.delete("/cooperation-proposals/:id", authorizeAdmin, StreamerController.deleteCooperationProposal);

export default router;
