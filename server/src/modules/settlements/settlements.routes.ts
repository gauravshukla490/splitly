import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import {
  createSettlement,
  confirmSettlement,
  getMySettlements,
} from "./settlements.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createSettlement);
router.post("/:settlementId/confirm", confirmSettlement);
router.get("/", getMySettlements);

export default router;