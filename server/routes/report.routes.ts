import { Router } from "express";
import { ReportController } from "../controllers/report.controller.ts";
import { authenticate } from "../middleware/auth.middleware.ts";

const router = Router();

router.post("/", authenticate, ReportController.create);
// Admin routes for reports
router.get("/admin", authenticate, ReportController.listAdminReports);
router.post("/admin/:reportId/action", authenticate, ReportController.applyAction);
router.delete("/admin/message/:messageId", authenticate, ReportController.deleteMessageAdmin);

export default router;
