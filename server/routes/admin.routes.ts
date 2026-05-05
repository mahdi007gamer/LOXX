import { Router } from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware.js";
import * as adminController from "../controllers/admin.controller.js";

const router = Router();

router.use(authenticate, authorizeAdmin);

router.get("/users", adminController.getAllUsers);
router.patch("/users/:id/role", adminController.updateUserRole);
router.delete("/users/:id", adminController.deleteUser);

export default router;
