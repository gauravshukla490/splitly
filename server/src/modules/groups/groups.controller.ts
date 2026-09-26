import { Request, Response } from "express";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import { expenses, groupMember, groups, settlements, users } from "../../db/schema.js";
import {
  getGroupById,
  getGroupMembers,
  getUserById,
  getUserGroups,
  loadExpenses,
  loadSettlements,
} from "../../utils/ledger.js";

export const createGroup = async (req: Request, res: Response) => {
  try {
    const me = req.userId!;
    const { name, description, members } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Groups name cannnot be empty" });
    }

    const uniqueMembers = new Set<string>(Array.isArray(members) ? members : []);
    uniqueMembers.add(me);

    const found = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.id, [...uniqueMembers]));
    for (const id of uniqueMembers) {
      if (!found.some((u) => u.id === id)) {
        return res.status(404).json({ message: `User with ID : ${id} not found` });
      }
    }

    const group = await db.transaction(async (tx) => {
      const [g] = await tx
        .insert(groups)
        .values({
          name: String(name).trim(),
          description: String(description ?? "").trim(),
          createdBy: me,
          isOneOnOne: false,
        })
        .returning();

      await tx.insert(groupMember).values(
        [...uniqueMembers].map((id) => ({
          groupId: g.id,
          userId: id,
          role: id === me ? "admin" : "member",
        }))
      );
      return g;
    });

    return res.status(201).json({ message: "Group created", group });
  } catch (error) {
    console.error("Create group error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// The user's groups; with ?groupId also returns that group's members
export const getGroupOrMembers = async (req: Request, res: Response) => {
  try {
    const me = req.userId!;
    const groupId = req.query.groupId ? String(req.query.groupId) : undefined;

    const userGroups = await getUserGroups(me);
    const groupList = await Promise.all(
      userGroups.map(async (g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        memberCount: (await getGroupMembers(g.id)).length,
      }))
    );

    if (!groupId) return res.status(200).json({ selectGroup: null, groups: groupList });

    const selected = userGroups.find((g) => g.id === groupId);
    if (!selected) {
      return res
        .status(403)
        .json({ message: "Group not found or you are not the member of this group" });
    }

    const members = await getGroupMembers(selected.id);
    const memberDetails = (
      await Promise.all(
        members.map(async (m) => {
          const u = await getUserById(m.userId);
          if (!u) return null;
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            imageUrl: u.profilePhotoUrl,
            role: m.role,
          };
        })
      )
    ).filter(Boolean);

    return res.status(200).json({
      selectGroup: {
        id: selected.id,
        name: selected.name,
        description: selected.description,
        createdBy: selected.createdBy,
        member: memberDetails,
      },
      groups: groupList,
    });
  } catch (error) {
    console.error("Get group or members error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Group expenses, settlements and per-member balances (with debt simplification)
export const getGroupExpenses = async (req: Request, res: Response) => {
  try {
    const me = req.userId!;
    const { groupId } = req.params;

    const group = await getGroupById(groupId);
    if (!group) return res.status(404).json({ message: "Group Not Found" });

    const members = await getGroupMembers(groupId);
    if (!members.some((m) => m.userId === me)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const groupExpenses = await loadExpenses(eq(expenses.groupId, groupId));
    const groupSettlements = await loadSettlements(eq(settlements.groupId, groupId));

    const memberDetails = (
      await Promise.all(
        members.map(async (m) => {
          const u = await getUserById(m.userId);
          return u ? { id: u.id, name: u.name, imageUrl: u.profilePhotoUrl, role: m.role } : null;
        })
      )
    ).filter((m): m is NonNullable<typeof m> => m !== null);
    const ids = memberDetails.map((m) => m.id);

    // totals[user] = overall balance; ledger[a][b] = how much a owes b
    const totals: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
    const ledger: Record<string, Record<string, number>> = {};
    ids.forEach((a) => {
      ledger[a] = {};
      ids.forEach((b) => {
        if (a !== b) ledger[a][b] = 0;
      });
    });

    for (const exp of groupExpenses) {
      const payer = exp.paidByUserId;
      if (!(payer in totals)) continue;

      for (const split of exp.splits) {
        if (split.userId === payer || split.paid || !(split.userId in totals)) continue;

        totals[payer] += split.amount; // payer gains credit
        totals[split.userId] -= split.amount; // debtor goes into debt
        ledger[split.userId][payer] += split.amount;
      }
    }

    for (const s of groupSettlements) {
      if (!(s.paidByUserId in totals) || !(s.receivedByUserId in totals)) continue;

      totals[s.paidByUserId] += s.amount;
      totals[s.receivedByUserId] -= s.amount;
      ledger[s.paidByUserId][s.receivedByUserId] -= s.amount;
    }

    // Debt simplification: net out the two directions between every pair
    ids.forEach((a) => {
      ids.forEach((b) => {
        if (a >= b) return;

        const diff = ledger[a][b] - ledger[b][a];
        if (diff > 0) {
          ledger[a][b] = diff;
          ledger[b][a] = 0;
        } else if (diff < 0) {
          ledger[b][a] = -diff;
          ledger[a][b] = 0;
        } else {
          ledger[a][b] = ledger[b][a] = 0;
        }
      });
    });

    const balances = memberDetails.map((m) => ({
      ...m,
      totalBalance: totals[m.id],
      owes: Object.entries(ledger[m.id])
        .filter(([, val]) => val > 0)
        .map(([to, amount]) => ({ to, amount })),
      owedBy: ids
        .filter((other) => other !== m.id && ledger[other][m.id] > 0)
        .map((other) => ({ from: other, amount: ledger[other][m.id] })),
    }));

    const userLookupMap = Object.fromEntries(memberDetails.map((m) => [m.id, m]));

    return res.status(200).json({
      group: { id: group.id, name: group.name, description: group.description },
      members: memberDetails,
      expenses: groupExpenses,
      settlements: groupSettlements,
      balances,
      userLookupMap,
    });
  } catch (error) {
    console.error("Get group expenses error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const addMember = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { userId: newMemberId } = req.body;

    if (!newMemberId) {
      return res.status(400).json({ message: "userId to add is required" });
    }

    const members = await getGroupMembers(groupId);
    if (!members.some((m) => m.userId === req.userId)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const [existingRow] = await db
      .select()
      .from(groupMember)
      .where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, newMemberId)))
      .limit(1);

    if (existingRow) {
      if (existingRow.isActive) {
        return res.status(409).json({ message: "User is already a member" });
      }
      await db.update(groupMember).set({ isActive: true }).where(eq(groupMember.id, existingRow.id));
    } else {
      await db.insert(groupMember).values({ groupId, userId: newMemberId });
    }

    return res.status(200).json({ message: "Member added" });
  } catch (error) {
    console.error("Add member error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const { groupId, memberId } = req.params;

    const members = await getGroupMembers(groupId);
    if (!members.some((m) => m.userId === req.userId)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    await db
      .update(groupMember)
      .set({ isActive: false })
      .where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, memberId)));

    return res.status(200).json({ message: "Member removed" });
  } catch (error) {
    console.error("Remove member error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const leaveGroup = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;

    await db
      .update(groupMember)
      .set({ isActive: false })
      .where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, req.userId!)));

    return res.status(200).json({ message: "You have left the group" });
  } catch (error) {
    console.error("Leave group error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
