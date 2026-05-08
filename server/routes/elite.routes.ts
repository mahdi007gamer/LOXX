import { Router } from "express";
import { EliteGroupController } from "../controllers/elite.controller";

const router = Router();

router.post("/", EliteGroupController.createGroup);
router.get("/", EliteGroupController.getGroups);
router.post("/members", EliteGroupController.addMember);
router.delete("/members", EliteGroupController.removeMember);
router.delete("/:groupId", EliteGroupController.deleteGroup);

export default router;
