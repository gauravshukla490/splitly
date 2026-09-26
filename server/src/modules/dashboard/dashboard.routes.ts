import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import {
  getUserBalances,
  getTotalSpent,
  getMonthlySpending,
  getUserGroupBalances,
} from "./dashboard.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/balances", getUserBalances);
router.get("/total-spent", getTotalSpent);
router.get("/monthly-spending", getMonthlySpending);
router.get("/groups", getUserGroupBalances);

export default router;
