import { Request, Response } from "express";
import { db } from "../../db/index.js";
import { expenses, expenseSplits, users } from "../../db/schema.js";
import { eq } from "drizzle-orm";

export const getGroupBalances = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;

    const groupExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.groupId, groupId));

    if (groupExpenses.length === 0) {
      return res.status(200).json({ balances: {}, settlementsSuggested: [] });
    }

    const expenseIds = groupExpenses.map((e) => e.id);
    const allSplits = await db.select().from(expenseSplits);
    const relevantSplits = allSplits.filter((s) => expenseIds.includes(s.expenseId));

    const ledger: Record<string, Record<string, number>> = {};

    const ensureUser = (currency: string, userId: string) => {
      if (!ledger[currency]) ledger[currency] = {};
      if (!ledger[currency][userId]) ledger[currency][userId] = 0;
    };

    for (const expense of groupExpenses) {
      ensureUser(expense.currency, expense.paidBy);
      ledger[expense.currency][expense.paidBy] += Number(expense.amount);
    }

    for (const split of relevantSplits) {
      const expense = groupExpenses.find((e) => e.id === split.expenseId)!;
      ensureUser(expense.currency, split.userId);
      ledger[expense.currency][split.userId] -= Number(split.amountOwed);
    }

    const settlementsSuggested: {
      currency: string;
      fromUserId: string;
      toUserId: string;
      amount: string;
    }[] = [];

    for (const currency of Object.keys(ledger)) {
      const balances = Object.entries(ledger[currency])
        .map(([userId, amount]) => ({ userId, amount: Math.round(amount * 100) / 100 }))
        .filter((b) => Math.abs(b.amount) > 0.01);

      const debtors = balances.filter((b) => b.amount < 0).sort((a, b) => a.amount - b.amount);
      const creditors = balances.filter((b) => b.amount > 0).sort((a, b) => b.amount - a.amount);

      let i = 0, j = 0;
      while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const settleAmount = Math.min(-debtor.amount, creditor.amount);

        settlementsSuggested.push({
          currency,
          fromUserId: debtor.userId,
          toUserId: creditor.userId,
          amount: settleAmount.toFixed(2),
        });

        debtor.amount += settleAmount;
        creditor.amount -= settleAmount;

        if (Math.abs(debtor.amount) < 0.01) i++;
        if (Math.abs(creditor.amount) < 0.01) j++;
      }
    }

    const userIds = Array.from(
      new Set(Object.values(ledger).flatMap((c) => Object.keys(c)))
    );
    const userRows = await db.select().from(users);
    const nameMap = Object.fromEntries(
      userRows.filter((u) => userIds.includes(u.id)).map((u) => [u.id, u.name])
    );

    return res.status(200).json({
      balances: ledger,
      settlementsSuggested: settlementsSuggested.map((s) => ({
        ...s,
        fromUserName: nameMap[s.fromUserId],
        toUserName: nameMap[s.toUserId],
      })),
    });
  } catch (error) {
    console.error("Get balances error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};