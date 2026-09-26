import { Request, Response } from "express";
import { eq, gte, isNull } from "drizzle-orm";
import { expenses, settlements } from "../../db/schema.js";
import {
  getUserById,
  getUserGroups,
  loadExpenses,
  loadSettlements,
} from "../../utils/ledger.js";

// Overall one-on-one balances for the current user
export const getUserBalances = async (req: Request, res: Response) => {
  try {
    const me = req.userId!;

    // One-on-one expenses only, where the user is the payer or in the splits
    const oneOnOne = (await loadExpenses(isNull(expenses.groupId))).filter(
      (e) => e.paidByUserId === me || e.splits.some((s) => s.userId === me)
    );

    let youOwe = 0;
    let youAreOwed = 0;
    const balanceByUser: Record<string, { owed: number; owing: number }> = {};
    const entry = (id: string) => (balanceByUser[id] ??= { owed: 0, owing: 0 });

    for (const e of oneOnOne) {
      const mySplit = e.splits.find((s) => s.userId === me);

      if (e.paidByUserId === me) {
        for (const s of e.splits) {
          if (s.userId === me || s.paid) continue;
          youAreOwed += s.amount;
          entry(s.userId).owed += s.amount;
        }
      } else if (mySplit && !mySplit.paid) {
        // Someone else paid and I haven't paid my split
        youOwe += mySplit.amount;
        entry(e.paidByUserId).owing += mySplit.amount;
      }
    }

    const mySettlements = (await loadSettlements(isNull(settlements.groupId))).filter(
      (s) => s.paidByUserId === me || s.receivedByUserId === me
    );

    for (const s of mySettlements) {
      if (s.paidByUserId === me) {
        // I paid someone -> reduces what I owe
        youOwe -= s.amount;
        entry(s.receivedByUserId).owing -= s.amount;
      } else {
        // Someone paid me -> reduces what they owe me
        youAreOwed -= s.amount;
        entry(s.paidByUserId).owed -= s.amount;
      }
    }

    const youOweList: { userId: string; name: string; imageUrl: string | null | undefined; amount: number }[] = [];
    const youAreOwedByList: typeof youOweList = [];

    for (const [uid, { owed, owing }] of Object.entries(balanceByUser)) {
      const net = owed - owing;
      if (net === 0) continue;

      const counterPart = await getUserById(uid);
      const base = {
        userId: uid,
        name: counterPart?.name ?? "Unknown",
        imageUrl: counterPart?.profilePhotoUrl,
        amount: Math.abs(net),
      };

      if (net > 0) youAreOwedByList.push(base);
      else youOweList.push(base);
    }

    youOweList.sort((a, b) => b.amount - a.amount);
    youAreOwedByList.sort((a, b) => b.amount - a.amount);

    return res.status(200).json({
      youOwe,
      youAreOwed,
      totalBalance: youAreOwed - youOwe,
      oweDetails: { youOwe: youOweList, youAreOwedBy: youAreOwedByList },
    });
  } catch (error) {
    console.error("Get user balances error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const thisYearExpensesOf = async (me: string) => {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);

  const yearExpenses = await loadExpenses(gte(expenses.date, startOfYear));
  return {
    currentYear,
    userExpenses: yearExpenses.filter(
      (e) => e.paidByUserId === me || e.splits.some((s) => s.userId === me)
    ),
  };
};

// Total of the user's own shares this year
export const getTotalSpent = async (req: Request, res: Response) => {
  try {
    const me = req.userId!;
    const { userExpenses } = await thisYearExpensesOf(me);

    let totalSpent = 0;
    userExpenses.forEach((e) => {
      const mySplit = e.splits.find((s) => s.userId === me);
      if (mySplit) totalSpent += mySplit.amount;
    });

    return res.status(200).json({ totalSpent });
  } catch (error) {
    console.error("Get total spent error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Per-month totals of the user's shares for the current year
export const getMonthlySpending = async (req: Request, res: Response) => {
  try {
    const me = req.userId!;
    const { currentYear, userExpenses } = await thisYearExpensesOf(me);

    const monthlyTotals: Record<number, number> = {};
    for (let i = 0; i < 12; i++) {
      monthlyTotals[new Date(currentYear, i, 1).getTime()] = 0;
    }

    userExpenses.forEach((e) => {
      const d = new Date(e.date);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const mySplit = e.splits.find((s) => s.userId === me);
      if (mySplit) monthlyTotals[monthStart] = (monthlyTotals[monthStart] || 0) + mySplit.amount;
    });

    const result = Object.entries(monthlyTotals)
      .map(([month, total]) => ({ month: parseInt(month), total }))
      .sort((a, b) => a.month - b.month);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Get monthly spending error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// The user's groups, each with the user's balance
export const getUserGroupBalances = async (req: Request, res: Response) => {
  try {
    const me = req.userId!;
    const groups = await getUserGroups(me);

    const enhanced = await Promise.all(
      groups.map(async (group) => {
        const groupExpenses = await loadExpenses(eq(expenses.groupId, group.id));

        let balance = 0;
        groupExpenses.forEach((e) => {
          if (e.paidByUserId === me) {
            // I paid; others may owe me
            e.splits.forEach((s) => {
              if (s.userId !== me && !s.paid) balance += s.amount;
            });
          } else {
            // Someone else paid; I may owe them
            const mySplit = e.splits.find((s) => s.userId === me);
            if (mySplit && !mySplit.paid) balance -= mySplit.amount;
          }
        });

        const groupSettlements = (await loadSettlements(eq(settlements.groupId, group.id))).filter(
          (s) => s.paidByUserId === me || s.receivedByUserId === me
        );
        groupSettlements.forEach((s) => {
          if (s.paidByUserId === me) balance += s.amount;
          else balance -= s.amount;
        });

        return { ...group, balance };
      })
    );

    return res.status(200).json(enhanced);
  } catch (error) {
    console.error("Get user groups error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
