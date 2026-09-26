import { Request, Response } from "express";
import { arrayContains, eq, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { expenses, expenseSplits, settlements } from "../../db/schema.js";
import {
  getGroupMembers,
  getUserById,
  loadExpenses,
  loadSettlements,
} from "../../utils/ledger.js";

export const createExpense = async (req: Request, res: Response) => {
  try {
    const me = req.userId!;
    const { description, amount, category, date, paidByUserId, splitType, splits, groupId } =
      req.body;

    if (!description || !amount || !paidByUserId || !splitType || !Array.isArray(splits)) {
      return res.status(400).json({
        message: "description, amount, paidByUserId, splitType and splits are required",
      });
    }

    // If there's a group, verify the user is a member
    if (groupId) {
      const members = await getGroupMembers(groupId);
      if (members.length === 0) return res.status(404).json({ message: "Group not found" });
      if (!members.some((m) => m.userId === me)) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
    }

    // Splits must add up to the total (small tolerance for floating point)
    const totalSplitAmount = splits.reduce((sum: number, s: any) => sum + Number(s.amount), 0);
    if (Math.abs(totalSplitAmount - Number(amount)) > 0.01) {
      return res
        .status(400)
        .json({ message: "Split amounts must add up to the total expense amount" });
    }

    const expenseId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(expenses)
        .values({
          title: description,
          amount: String(amount),
          category: category || "Other",
          date: date ? new Date(date) : new Date(),
          paidBy: paidByUserId,
          splitType,
          groupId: groupId || null,
          createdBy: me,
        })
        .returning({ id: expenses.id });

      await tx.insert(expenseSplits).values(
        splits.map((s: any) => ({
          expenseId: created.id,
          userId: s.userId,
          amountOwed: Number(s.amount).toFixed(2),
          convertedAmount: Number(s.amount).toFixed(2),
          paid: Boolean(s.paid),
        }))
      );
      return created.id;
    });

    return res.status(201).json({ id: expenseId });
  } catch (error) {
    console.error("Create expense error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// One-on-one expenses + settlements between me and another user, with running balance
export const getExpensesBetweenUsers = async (req: Request, res: Response) => {
  try {
    const me = req.userId!;
    const { userId } = req.params;

    if (me === userId) return res.status(400).json({ message: "Cannot query yourself" });

    const other = await getUserById(userId);
    if (!other) return res.status(404).json({ message: "User not found" });

    // Expenses with no group that either of us paid, where both are involved
    const candidates = await loadExpenses(isNull(expenses.groupId));
    const between = candidates
      .filter((e) => {
        if (e.paidByUserId !== me && e.paidByUserId !== userId) return false;
        const meInvolved = e.paidByUserId === me || e.splits.some((s) => s.userId === me);
        const themInvolved = e.paidByUserId === userId || e.splits.some((s) => s.userId === userId);
        return meInvolved && themInvolved;
      })
      .sort((a, b) => b.date - a.date);

    const betweenSettlements = (await loadSettlements(isNull(settlements.groupId)))
      .filter(
        (s) =>
          (s.paidByUserId === me && s.receivedByUserId === userId) ||
          (s.paidByUserId === userId && s.receivedByUserId === me)
      )
      .sort((a, b) => b.date - a.date);

    let balance = 0;
    for (const e of between) {
      if (e.paidByUserId === me) {
        const split = e.splits.find((s) => s.userId === userId && !s.paid);
        if (split) balance += split.amount; // they owe me
      } else {
        const split = e.splits.find((s) => s.userId === me && !s.paid);
        if (split) balance -= split.amount; // I owe them
      }
    }
    for (const s of betweenSettlements) {
      if (s.paidByUserId === me) balance += s.amount; // I paid them back
      else balance -= s.amount; // they paid me back
    }

    return res.status(200).json({
      expenses: between,
      settlements: betweenSettlements,
      otherUser: {
        id: other.id,
        name: other.name,
        email: other.email,
        imageUrl: other.profilePhotoUrl,
      },
      balance,
    });
  } catch (error) {
    console.error("Get expenses between users error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const me = req.userId!;
    const { expenseId } = req.params;

    const [expense] = await loadExpenses(eq(expenses.id, expenseId));
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    // Only the creator of the expense or the payer can delete it
    if (expense.createdBy !== me && expense.paidByUserId !== me) {
      return res
        .status(403)
        .json({ message: "You don't have permission to delete this expense" });
    }

    await db.transaction(async (tx) => {
      const related = await tx
        .select()
        .from(settlements)
        .where(arrayContains(settlements.relatedExpenseIds, [expenseId]));

      for (const s of related) {
        const remaining = (s.relatedExpenseIds ?? []).filter((id) => id !== expenseId);
        if (remaining.length === 0) {
          // Only related expense -> delete the settlement
          await tx.delete(settlements).where(eq(settlements.id, s.id));
        } else {
          await tx
            .update(settlements)
            .set({ relatedExpenseIds: remaining })
            .where(eq(settlements.id, s.id));
        }
      }

      await tx.delete(expenseSplits).where(eq(expenseSplits.expenseId, expenseId));
      await tx.delete(expenses).where(eq(expenses.id, expenseId));
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete expense error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
