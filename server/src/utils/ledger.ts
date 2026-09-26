import { SQL, and, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  expenses,
  expenseSplits,
  groupMember,
  groups,
  settlements,
  users,
} from "../db/schema.js";

// Same shapes the WiseMoney (Convex) documents had, so the balance logic ports 1:1.
export type ExpenseDoc = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: number;
  paidByUserId: string;
  splitType: string;
  splits: { userId: string; amount: number; paid: boolean }[];
  groupId: string | null;
  createdBy: string | null;
};

export type SettlementDoc = {
  id: string;
  amount: number;
  note: string | null;
  date: number;
  paidByUserId: string;
  receivedByUserId: string;
  groupId: string | null;
  relatedExpenseIds: string[] | null;
  createdBy: string | null;
};

export const loadExpenses = async (where?: SQL): Promise<ExpenseDoc[]> => {
  const rows = await db.select().from(expenses).where(where);
  if (rows.length === 0) return [];

  const splitRows = await db
    .select()
    .from(expenseSplits)
    .where(inArray(expenseSplits.expenseId, rows.map((r) => r.id)));

  return rows.map((r) => ({
    id: r.id,
    description: r.title,
    amount: Number(r.amount),
    category: r.category,
    date: r.date.getTime(),
    paidByUserId: r.paidBy,
    splitType: r.splitType,
    splits: splitRows
      .filter((s) => s.expenseId === r.id)
      .map((s) => ({ userId: s.userId, amount: Number(s.amountOwed), paid: s.paid })),
    groupId: r.groupId,
    createdBy: r.createdBy,
  }));
};

export const loadSettlements = async (where?: SQL): Promise<SettlementDoc[]> => {
  const rows = await db.select().from(settlements).where(where);
  return rows.map((r) => ({
    id: r.id,
    amount: Number(r.amount),
    note: r.note,
    date: r.date.getTime(),
    paidByUserId: r.fromUser,
    receivedByUserId: r.toUser,
    groupId: r.groupId,
    relatedExpenseIds: r.relatedExpenseIds,
    createdBy: r.createdBy,
  }));
};

export const getUserById = async (id: string) => {
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return u ?? null;
};

export const publicUser = (u: typeof users.$inferSelect) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  imageUrl: u.profilePhotoUrl,
});

export const getGroupMembers = async (groupId: string) =>
  db
    .select({
      userId: groupMember.userId,
      role: groupMember.role,
      joinedAt: groupMember.joinedAt,
    })
    .from(groupMember)
    .where(and(eq(groupMember.groupId, groupId), eq(groupMember.isActive, true)));

export const getGroupById = async (id: string) => {
  const [g] = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
  return g ?? null;
};

// Groups the user actively belongs to.
export const getUserGroups = async (userId: string) =>
  db
    .select({ group: groups })
    .from(groupMember)
    .innerJoin(groups, eq(groupMember.groupId, groups.id))
    .where(and(eq(groupMember.userId, userId), eq(groupMember.isActive, true)))
    .then((rows) => rows.map((r) => r.group));
