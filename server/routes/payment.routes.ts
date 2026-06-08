import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller.ts";
import { authenticate, authorizeAdmin } from "../middleware/auth.middleware.ts";

const router = Router();

router.post("/create", authenticate, PaymentController.create);
router.post("/cancel", authenticate, PaymentController.cancel);
router.post("/verify-promo", authenticate, PaymentController.verifyPromo);
router.get("/status", authenticate, PaymentController.status);

// Admin routes
router.get("/admin/pending", authenticate, authorizeAdmin, PaymentController.adminListPending);
router.get("/admin/history", authenticate, authorizeAdmin, PaymentController.adminListHistory);
router.post("/admin/approve", authenticate, authorizeAdmin, PaymentController.adminApprove);
router.post("/admin/reject", authenticate, authorizeAdmin, PaymentController.adminReject);

export default router;
