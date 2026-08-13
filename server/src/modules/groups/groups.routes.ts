import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import {
  createGroup,
  addMember,
  removeMember,
  leaveGroup,
  getGroupDetails,
} from "./groups.controller";
import { getGroupBalances } from "./balances.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", createGroup);
router.get("/:groupId", getGroupDetails);
router.post("/:groupId/members", addMember);
router.delete("/:groupId/members/:memberId", removeMember);
router.post("/:groupId/leave", leaveGroup);
router.get("/:groupId/balances", getGroupBalances);

export default router;