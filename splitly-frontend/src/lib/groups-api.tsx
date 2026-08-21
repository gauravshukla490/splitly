import { apiFetch } from "./api";

export interface Group {
  id: string;
  name: string;
  groupPhoto: string | null;
  createdBy: string;
  isOneOnOne: boolean;
  createdAt: string;
}

export interface Member {
  userId: string;
  name: string;
  email: string;
  profilePhotoUrl: string | null;
}

export interface Expense {
  id: string;
  groupId: string;
  paidBy: string;
  title: string;
  amount: string;
  currency: string;
  createdAt: string;
}

export interface SuggestedSettlement {
  currency: string;
  fromUserId: string;
  toUserId: string;
  amount: string;
  fromUserName: string;
  toUserName: string;
}

export interface BalancesResponse {
  balances: Record<string, Record<string, number>>;
  settlementsSuggested: SuggestedSettlement[];
}

export function createGroup(data: { name: string; memberIds?: string[] }) {
  return apiFetch<{ message: string; group: Group }>("/groups", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMyGroups() {
  return apiFetch<{ groups: Group[] }>("/groups");
}

export function getGroupDetails(groupId: string) {
  return apiFetch<{ group: Group; members: Member[] }>(`/groups/${groupId}`);
}

export function addMember(groupId: string, userId: string) {
  return apiFetch<{ message: string }>(`/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export function removeMember(groupId: string, memberId: string) {
  return apiFetch<{ message: string }>(`/groups/${groupId}/members/${memberId}`, {
    method: "DELETE",
  });
}

export function leaveGroup(groupId: string) {
  return apiFetch<{ message: string }>(`/groups/${groupId}/leave`, {
    method: "POST",
  });
}

export function getGroupBalances(groupId: string) {
  return apiFetch<BalancesResponse>(`/groups/${groupId}/balances`);
}

export function addExpense(
  groupId: string,
  data: { title: string; amount: number; currency: string }
) {
  return apiFetch<{ message: string; expense: Expense }>(`/expenses/${groupId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getExpensesByGroup(groupId: string) {
  return apiFetch<{ expenses: Expense[] }>(`/expenses/${groupId}`);
}

export interface Settlement {
  id: string;
  fromUser: string;
  toUser: string;
  amount: string;
  currency: string;
  note: string | null;
  fromConfirmed: boolean;
  toConfirmed: boolean;
  createdAt: string;
}

export function createSettlement(data: {
  toUser: string;
  amount: number;
  currency: string;
  note?: string;
}) {
  return apiFetch<{ message: string; settlement: Settlement }>("/settlements", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function confirmSettlement(settlementId: string) {
  return apiFetch<{ message: string }>(`/settlements/${settlementId}/confirm`, {
    method: "POST",
  });
}

export function getMySettlements() {
  return apiFetch<{ sent: Settlement[]; received: Settlement[] }>("/settlements");
}
