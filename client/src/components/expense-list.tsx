import { Card } from "./ui/card";
import { Avatar } from "./ui/avatar";
import { Button } from "./ui/button";
import { useAuth } from "../lib/auth-context";
import { getCategoryName } from "../lib/categories";
import { formatDate, money } from "../lib/format";
import type { Expense } from "../lib/services";

type Lookup = Record<string, { name: string; imageUrl?: string | null }>;

export function ExpenseList({
  expenses,
  userLookup,
  showOtherPerson = true,
  isGroupExpense = false,
  otherPersonId,
  onDelete,
}: {
  expenses: Expense[];
  userLookup: Lookup;
  showOtherPerson?: boolean;
  isGroupExpense?: boolean;
  otherPersonId?: string;
  onDelete: (expense: Expense) => void;
}) {
  const { user } = useAuth();

  if (expenses.length === 0) {
    return (
      <Card className="p-8 text-center text-ink-soft text-sm">No expenses found</Card>
    );
  }

  const nameOf = (id: string) => (id === user?.id ? "You" : userLookup[id]?.name || "Other User");

  return (
    <div className="flex flex-col gap-4">
      {expenses.map((expense) => {
        const iPaid = expense.paidByUserId === user?.id;
        const canDelete = expense.createdBy === user?.id || expense.paidByUserId === user?.id;

        return (
          <Card key={expense.id} className="p-4 hover:border-moss/50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">{expense.description}</h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  {formatDate(expense.date)} · {getCategoryName(expense.category)}
                  {showOtherPerson && ` · ${nameOf(expense.paidByUserId)} paid`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-mono tabular-nums">{money(expense.amount)}</p>
                  {isGroupExpense ? (
                    <p className="text-xs text-ink-soft">Group expense</p>
                  ) : (
                    <p className={`text-xs ${iPaid ? "text-moss" : "text-rust"}`}>
                      {iPaid ? "You paid" : `${nameOf(expense.paidByUserId)} paid`}
                    </p>
                  )}
                </div>
                {canDelete && (
                  <Button variant="danger" size="sm" onClick={() => onDelete(expense)}>
                    Delete
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-3 flex gap-2 flex-wrap">
              {expense.splits
                .filter(
                  (s) => showOtherPerson || s.userId === user?.id || s.userId === otherPersonId
                )
                .map((s) => (
                  <span
                    key={s.userId}
                    className={`inline-flex items-center gap-1.5 text-xs rounded-full px-2 py-1 ${
                      s.paid ? "border border-moss/30 text-ink-soft" : "bg-cream-dark text-ink"
                    }`}
                  >
                    <Avatar name={nameOf(s.userId)} src={userLookup[s.userId]?.imageUrl} size={16} />
                    {nameOf(s.userId)}: {money(s.amount)}
                  </span>
                ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
