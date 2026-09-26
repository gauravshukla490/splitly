import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import {
  createGroup,
  getGroupOrMembers,
  getGroupExpenses,
  addMember,
  removeMember,
  leaveGroup,
} from "./groups.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createGroup);
router.get("/", getGroupOrMembers);
router.get("/:groupId/expenses", getGroupExpenses);
router.post("/:groupId/members", addMember);
router.delete("/:groupId/members/:memberId", removeMember);
router.post("/:groupId/leave", leaveGroup);

export default router;
