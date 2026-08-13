import { Request, Response } from "express";
import { db } from "../../db";
import { expenses, expenseSplits, groupMember, users } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getExchangeRate } from "../../utils/exchangeRate";

// ============================================
// ADD EXPENSE — equal split among active group members
// ============================================
export const addExpense = async (req: Request, res: Response) => {
  try {
    const paidBy = req.userId!;
    const { groupId } = req.params;
    const { title, amount, currency } = req.body;

    if (!title || !amount || !currency) {
      return res.status(400).json({ message: "title, amount, and currency are required" });
    }

    // Get all active members — expense splits equally among them
    const activeMembers = await db
      .select({ userId: groupMember.userId })
      .from(groupMember)
      .where(and(eq(groupMember.groupId, groupId), eq(groupMember.isActive, true)));

    if (activeMembers.length === 0) {
      return res.status(400).json({ message: "Group has no active members" });
    }

    // Create the expense record
    const [newExpense] = await db
      .insert(expenses)
      .values({ groupId, paidBy, title, amount, currency })
      .returning();

    // Equal share per member
    const shareAmount = Number(amount) / activeMembers.length;

    // For each member, convert their share to their own base currency
    const splitRows = [];
    for (const member of activeMembers) {
      const [user] = await db
        .select({ baseCurrency: users.baseCurrency })
        .from(users)
        .where(eq(users.id, member.userId))
        .limit(1);

      const userCurrency = user?.baseCurrency || "INR";
      const exchangeRate = await getExchangeRate(currency, userCurrency);
      const convertedAmount = shareAmount * exchangeRate;

      splitRows.push({
        expenseId: newExpense.id,
        userId: member.userId,
        amountOwed: shareAmount.toFixed(2),
        convertedAmount: convertedAmount.toFixed(2),
        exchangeRate: exchangeRate.toFixed(6),
      });
    }

    await db.insert(expenseSplits).values(splitRows);

    return res.status(201).json({ message: "Expense added", expense: newExpense });
  } catch (error) {
    console.error("Add expense error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ============================================
// GET EXPENSES BY GROUP
// ============================================
export const getExpensesByGroup = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;

    const groupExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.groupId, groupId))
      .orderBy(desc(expenses.createdAt));

    return res.status(200).json({ expenses: groupExpenses });
  } catch (error) {
    console.error("Get expenses error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};