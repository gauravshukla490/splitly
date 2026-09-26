import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import {
  createExpense,
  getExpensesBetweenUsers,
  deleteExpense,
} from "./expenses.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createExpense);
router.get("/between/:userId", getExpensesBetweenUsers);
router.delete("/:expenseId", deleteExpense);

export default router;
