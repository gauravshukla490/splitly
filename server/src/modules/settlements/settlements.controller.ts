import { Request, Response } from "express";
import { eq, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { expenses, settlements } from "../../db/schema.js";
import {
  getGroupById,
  getGroupMembers,
  getUserById,
  loadExpenses,
  loadSettlements,
} from "../../utils/ledger.js";

export const createSettlement = async (req: Request, res: Response) => {
  try {
    const me = req.userId!;
    const { amount, note, paidByUserId, receivedByUserId, groupId, relatedExpenseIds } = req.body;

    if (!(Number(amount) > 0)) {
      return res.status(400).json({ message: "Amount must be positive" });
    }
    if (!paidByUserId || !receivedByUserId) {
      return res.status(400).json({ message: "paidByUserId and receivedByUserId are required" });
    }
    if (paidByUserId === receivedByUserId) {
      return res.status(400).json({ message: "Payer and receiver cannot be the same user" });
    }
    if (me !== paidByUserId && me !== receivedByUserId) {
      return res.status(403).json({ message: "You must be either the payer or the receiver" });
    }

    // Groups check (if provided)
    if (groupId) {
      const group = await getGroupById(groupId);
      if (!group) return res.status(404).json({ message: "Group not found" });

      const members = await getGroupMembers(groupId);
      const isMember = (uid: string) => members.some((m) => m.userId === uid);
      if (!isMember(paidByUserId) || !isMember(receivedByUserId)) {
        return res.status(400).json({ message: "Both parties must be member of the groups" });
      }
    }

    const [created] = await db
      .insert(settlements)
      .values({
        amount: Number(amount).toFixed(2),
        note,
        fromUser: paidByUserId,
        toUser: receivedByUserId,
        groupId: groupId || null,
        relatedExpenseIds: relatedExpenseIds ?? null,
        createdBy: me,
        fromConfirmed: true,
        toConfirmed: true,
      })
      .returning({ id: settlements.id });

    return res.status(201).json({ id: created.id });
  } catch (error) {
    console.error("Create settlement error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Balance between me and a user (?entityType=user) or with each member of a group (?entityType=group)
export const settlementData = async (req: Request, res: Response) => {
  try {
    const me = req.userId!;
    const entityType = String(req.query.entityType ?? "");
    const entityId = String(req.query.entityId ?? "");

    if (entityType === "user") {
      const other = await getUserById(entityId);
      if (!other) return res.status(404).json({ message: "user not found" });

      // One-on-one expenses that either of us paid
      const oneOnOne = await loadExpenses(isNull(expenses.groupId));

      let owed = 0; // they owe me
      let owing = 0; // I owe them

      for (const exp of oneOnOne) {
        if (exp.paidByUserId !== me && exp.paidByUserId !== other.id) continue;

        const involvesMe = exp.paidByUserId === me || exp.splits.some((s) => s.userId === me);
        const involvesThem =
          exp.paidByUserId === other.id || exp.splits.some((s) => s.userId === other.id);
        if (!involvesMe || !involvesThem) continue;

        if (exp.paidByUserId === me) {
          const split = exp.splits.find((s) => s.userId === other.id && !s.paid);
          if (split) owed += split.amount;
        } else {
          const split = exp.splits.find((s) => s.userId === me && !s.paid);
          if (split) owing += split.amount;
        }
      }

      const between = (await loadSettlements(isNull(settlements.groupId))).filter(
        (s) =>
          (s.paidByUserId === me && s.receivedByUserId === other.id) ||
          (s.paidByUserId === other.id && s.receivedByUserId === me)
      );

      for (const s of between) {
        if (s.paidByUserId === me) {
          // I paid them => my owing goes down
          owing = Math.max(0, owing - s.amount);
        } else {
          // They paid me => their owing goes down
          owed = Math.max(0, owed - s.amount);
        }
      }

      return res.status(200).json({
        type: "user",
        counterPart: {
          userId: other.id,
          name: other.name,
          email: other.email,
          imageUrl: other.profilePhotoUrl,
        },
        youAreOwed: owed,
        youOwe: owing,
        netBalance: owed - owing, // >0 you should receive, <0 you should pay
      });
    }

    if (entityType === "group") {
      const group = await getGroupById(entityId);
      if (!group) return res.status(404).json({ message: "Group not found" });

      const members = await getGroupMembers(group.id);
      if (!members.some((m) => m.userId === me)) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }

      const groupExpenses = await loadExpenses(eq(expenses.groupId, group.id));

      // Per-member tallies
      const balances: Record<string, { owed: number; owing: number }> = {};
      members.forEach((m) => {
        if (m.userId !== me) balances[m.userId] = { owed: 0, owing: 0 };
      });

      for (const exp of groupExpenses) {
        if (exp.paidByUserId === me) {
          // I paid; others may owe me
          exp.splits.forEach((split) => {
            if (split.userId !== me && !split.paid && balances[split.userId]) {
              balances[split.userId].owed += split.amount;
            }
          });
        } else if (balances[exp.paidByUserId]) {
          // Someone else in the group paid; I may owe them
          const split = exp.splits.find((s) => s.userId === me && !s.paid);
          if (split) balances[exp.paidByUserId].owing += split.amount;
        }
      }

      const groupSettlements = await loadSettlements(eq(settlements.groupId, group.id));
      for (const st of groupSettlements) {
        // Only settlements where one side is me
        if (st.paidByUserId === me && balances[st.receivedByUserId]) {
          balances[st.receivedByUserId].owing = Math.max(
            0,
            balances[st.receivedByUserId].owing - st.amount
          );
        }
        if (st.receivedByUserId === me && balances[st.paidByUserId]) {
          balances[st.paidByUserId].owed = Math.max(
            0,
            balances[st.paidByUserId].owed - st.amount
          );
        }
      }

      const list = await Promise.all(
        Object.entries(balances).map(async ([uid, { owed, owing }]) => {
          const m = await getUserById(uid);
          return {
            userId: uid,
            name: m?.name || "Unknown",
            imageUrl: m?.profilePhotoUrl,
            youAreOwed: owed,
            youOwe: owing,
            netBalance: owed - owing,
          };
        })
      );

      return res.status(200).json({
        type: "group",
        group: { id: group.id, name: group.name, description: group.description },
        balances: list,
      });
    }

    return res.status(400).json({ message: "Invalid entityType; expected 'user' or 'group'" });
  } catch (error) {
    console.error("Settlement data error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
