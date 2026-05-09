import { Router } from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware.ts";
import * as adminController from "../controllers/admin.controller.ts";

const router = Router();

router.use(authenticate, authorizeAdmin);

router.get("/users", adminController.getAllUsers);
router.patch("/users/:id/role", adminController.updateUserRole);
router.patch("/users/:id/membership", adminController.updateUserMembership);
router.delete("/users/:id", adminController.deleteUser);

router.post("/games", adminController.createGame);
router.patch("/games/:id", adminController.updateGame);
router.get("/games/:id", adminController.getGameById);
router.delete("/games/:id", adminController.deleteGame);

// Genres
router.get("/genres", adminController.getAllGenres);
router.post("/genres", adminController.createGenre);
router.patch("/genres/:id", adminController.updateGenre);
router.delete("/genres/:id", adminController.deleteGenre);

export default router;
