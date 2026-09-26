import { Request, Response } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { expenses } from "../../db/schema.js";
import {
  getGroupMembers,
  getUserById,
  getUserGroups,
  loadExpenses,
  publicUser,
} from "../../utils/ledger.js";

// People the user has one-on-one expenses with + the user's groups
export const getAllContacts = async (req: Request, res: Response) => {
  try {
    const me = req.userId!;

    const personalExpenses = (await loadExpenses(isNull(expenses.groupId))).filter(
      (e) => e.paidByUserId === me || e.splits.some((s) => s.userId === me)
    );

    const contactIds = new Set<string>();
    personalExpenses.forEach((exp) => {
      if (exp.paidByUserId !== me) contactIds.add(exp.paidByUserId);
      exp.splits.forEach((s) => {
        if (s.userId !== me) contactIds.add(s.userId);
      });
    });

    const contactUsers = await Promise.all(
      [...contactIds].map(async (id) => {
        const u = await getUserById(id);
        return u ? { ...publicUser(u), type: "user" } : null;
      })
    );

    const groups = await getUserGroups(me);
    const userGroups = await Promise.all(
      groups.map(async (g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        memberCount: (await getGroupMembers(g.id)).length,
        type: "groups",
      }))
    );

    return res.status(200).json({
      users: contactUsers.filter(Boolean),
      groups: userGroups,
    });
  } catch (error) {
    console.error("Get contacts error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
