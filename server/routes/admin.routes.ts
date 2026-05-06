import { Router } from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware.js";
import * as adminController from "../controllers/admin.controller.js";

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

export default router;
