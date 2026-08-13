import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { addExpense, getExpensesByGroup } from "./expenses.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/:groupId", addExpense);
router.get("/:groupId", getExpensesByGroup);

export default router;

