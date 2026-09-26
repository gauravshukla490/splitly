import { apiFetch } from "./api";

// ---------- shared shapes (mirror the server's ledger documents) ----------

export interface PublicUser {
  id: string;
  name: string;
  email: string | null;
  imageUrl: string | null;
}

export interface Split {
  userId: string;
  amount: number;
  paid: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: number;
  paidByUserId: string;
  splitType: SplitType;
  splits: Split[];
  groupId: string | null;
  createdBy: string | null;
}

export interface Settlement {
  id: string;
  amount: number;
  note: string | null;
  date: number;
  paidByUserId: string;
  receivedByUserId: string;
  groupId: string | null;
  relatedExpenseIds: string[] | null;
  createdBy: string | null;
}

export type SplitType = "equal" | "percentage" | "exact";

export interface GroupSummary {
  id: string;
  name: string;
  description: string;
  memberCount: number;
}

export interface GroupMember extends PublicUser {
  role: string;
}

// ---------- users / contacts ----------

export const searchUsers = (query: string) =>
  apiFetch<{ users: PublicUser[] }>(`/users/search?query=${encodeURIComponent(query)}`);

export const getContacts = () =>
  apiFetch<{
    users: (PublicUser & { type: "user" })[];
    groups: (GroupSummary & { type: "groups" })[];
  }>("/contacts");

// ---------- groups ----------

export const createGroup = (data: { name: string; description: string; members: string[] }) =>
  apiFetch<{ message: string; group: { id: string } }>("/groups", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getGroups = () =>
  apiFetch<{ selectGroup: null; groups: GroupSummary[] }>("/groups");

export const getGroupWithMembers = (groupId: string) =>
  apiFetch<{
    selectGroup: {
      id: string;
      name: string;
      description: string;
      createdBy: string;
      member: GroupMember[];
    };
    groups: GroupSummary[];
  }>(`/groups?groupId=${groupId}`);

export interface MemberBalance {
  id: string;
  name: string;
  imageUrl: string | null;
  role: string;
  totalBalance: number;
  owes: { to: string; amount: number }[];
  owedBy: { from: string; amount: number }[];
}

export const getGroupExpenses = (groupId: string) =>
  apiFetch<{
    group: { id: string; name: string; description: string };
    members: GroupMember[];
    expenses: Expense[];
    settlements: Settlement[];
    balances: MemberBalance[];
    userLookupMap: Record<string, { id: string; name: string; imageUrl: string | null }>;
  }>(`/groups/${groupId}/expenses`);

export const addMember = (groupId: string, userId: string) =>
  apiFetch<{ message: string }>(`/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });

export const removeMember = (groupId: string, memberId: string) =>
  apiFetch<{ message: string }>(`/groups/${groupId}/members/${memberId}`, { method: "DELETE" });

export const leaveGroup = (groupId: string) =>
  apiFetch<{ message: string }>(`/groups/${groupId}/leave`, { method: "POST" });

// ---------- expenses ----------

export const createExpense = (data: {
  description: string;
  amount: number;
  category: string;
  date: number;
  paidByUserId: string;
  splitType: SplitType;
  splits: Split[];
  groupId?: string;
}) => apiFetch<{ id: string }>("/expenses", { method: "POST", body: JSON.stringify(data) });

export const getExpensesBetweenUsers = (userId: string) =>
  apiFetch<{
    expenses: Expense[];
    settlements: Settlement[];
    otherUser: PublicUser;
    balance: number;
  }>(`/expenses/between/${userId}`);

export const deleteExpense = (expenseId: string) =>
  apiFetch<{ success: boolean }>(`/expenses/${expenseId}`, { method: "DELETE" });

// ---------- settlements ----------

export const createSettlement = (data: {
  amount: number;
  note?: string;
  paidByUserId: string;
  receivedByUserId: string;
  groupId?: string;
}) => apiFetch<{ id: string }>("/settlements", { method: "POST", body: JSON.stringify(data) });

export type SettlementData =
  | {
      type: "user";
      counterPart: { userId: string; name: string; email: string | null; imageUrl: string | null };
      youAreOwed: number;
      youOwe: number;
      netBalance: number;
    }
  | {
      type: "group";
      group: { id: string; name: string; description: string };
      balances: {
        userId: string;
        name: string;
        imageUrl: string | null;
        youAreOwed: number;
        youOwe: number;
        netBalance: number;
      }[];
    };

export const getSettlementData = (entityType: "user" | "group", entityId: string) =>
  apiFetch<SettlementData>(`/settlements/data?entityType=${entityType}&entityId=${entityId}`);

// ---------- dashboard ----------

export interface BalanceLine {
  userId: string;
  name: string;
  imageUrl: string | null;
  amount: number;
}

export const getUserBalances = () =>
  apiFetch<{
    youOwe: number;
    youAreOwed: number;
    totalBalance: number;
    oweDetails: { youOwe: BalanceLine[]; youAreOwedBy: BalanceLine[] };
  }>("/dashboard/balances");

export const getTotalSpent = () => apiFetch<{ totalSpent: number }>("/dashboard/total-spent");

export const getMonthlySpending = () =>
  apiFetch<{ month: number; total: number }[]>("/dashboard/monthly-spending");

export const getGroupBalances = () =>
  apiFetch<(GroupSummary & { balance: number })[]>("/dashboard/groups");
