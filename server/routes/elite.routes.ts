import { Router } from "express";
import { EliteGroupController } from "../controllers/elite.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.post("/", EliteGroupController.createGroup);
router.get("/", EliteGroupController.getGroups);
router.put("/:groupId", EliteGroupController.updateGroup);
router.post("/members/invite", EliteGroupController.inviteMember);
router.post("/members/accept", EliteGroupController.acceptInvite);
router.post("/members", EliteGroupController.addMember);
router.post("/members/leave", EliteGroupController.leaveGroup);
router.delete("/members", EliteGroupController.removeMember);
router.delete("/:groupId", EliteGroupController.deleteGroup);

export default router;
