import { Router } from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware.ts";
import * as adminController from "../controllers/admin.controller.ts";
import { BadgeController } from "../controllers/badge.controller.ts";
import { StreamerController } from "../controllers/streamer.controller.ts";

const router = Router();

router.use(authenticate, authorizeAdmin);

router.get("/alerts", adminController.getAdminAlerts);
router.get("/dashboard-stats", adminController.getDashboardStats);

router.get("/users", adminController.getAllUsers);
router.patch("/users/:id", adminController.updateUserDetails);
router.get("/backup", adminController.exportDatabase);
router.patch("/users/:id/role", adminController.updateUserRole);
router.patch("/users/:id/membership", adminController.updateUserMembership);
router.patch("/users/:id/verify", adminController.updateUserVerification);
router.delete("/users/:id", adminController.deleteUser);

router.post("/games", adminController.createGame);
router.patch("/games/:id", adminController.updateGame);
router.get("/games/:id", adminController.getGameById);
router.delete("/games/:id", adminController.deleteGame);
router.post("/games/auto-link-badges", adminController.autoLinkGameBadges);

// Genres
router.get("/genres", adminController.getAllGenres);
router.post("/genres", adminController.createGenre);
router.patch("/genres/:id", adminController.updateGenre);
router.post("/genres/seed-default", adminController.seedGenres);
router.delete("/genres/:id", adminController.deleteGenre);

// Badges
router.post("/badges/seed-default", BadgeController.seedDefaultBadges);

// Streamers
router.get("/streamers", adminController.getAllStreamers);
router.patch("/streamers/:id", adminController.updateStreamer);
router.post("/streamers/withdrawal/:id/approve", adminController.approveWithdrawal);
router.post("/streamers/withdrawal/:id/reject", adminController.rejectWithdrawal);

// Streamer cooperation proposals
router.get("/cooperation-proposals", StreamerController.getCooperationProposals);
router.put("/cooperation-proposals/:id", StreamerController.updateCooperationStatus);
router.delete("/cooperation-proposals/:id", StreamerController.deleteCooperationProposal);

// Streamer Invites
router.get("/streamer-invites", adminController.getStreamerInvites);
router.post("/streamer-invites", adminController.createStreamerInvite);
router.delete("/streamer-invites/:id", adminController.deleteStreamerInvite);

// Enamad (اینماد) Support
import * as enamadController from "../controllers/enamad.controller.ts";
router.get("/enamad", enamadController.getEnamadData);
router.post("/enamad/config", enamadController.updateEnamadConfig);
router.post("/enamad/files", enamadController.createVerificationFile);
router.delete("/enamad/files/:id", enamadController.deleteVerificationFile);

// Clear general chat route
router.delete("/chat/clear-general", adminController.clearGeneralChat);
router.post("/chat/generate-tts", adminController.generateTTSGreeting);

export default router;
