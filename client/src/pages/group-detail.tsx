import { useEffect, useState, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getGroupDetails,
  getExpensesByGroup,
  addExpense,
  getGroupBalances,
  addMember,
  removeMember,
  leaveGroup,
  createSettlement,
  Group,
  Member,
  Expense,
  BalancesResponse,
} from "../lib/groups-api";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { Navbar } from "../components/navbar";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";
import { Card, ReceiptCard } from "../components/ui/card";

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<BalancesResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // add expense form
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCurrency, setExpCurrency] = useState("INR");
  const [addingExpense, setAddingExpense] = useState(false);

  // add member form
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [newMemberId, setNewMemberId] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  const loadAll = async () => {
    if (!groupId) return;
    try {
      const [detailsRes, expensesRes, balancesRes] = await Promise.all([
        getGroupDetails(groupId),
        getExpensesByGroup(groupId),
        getGroupBalances(groupId),
      ]);
      setGroup(detailsRes.group);
      setMembers(detailsRes.members);
      setExpenses(expensesRes.expenses);
      setBalances(balancesRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load group");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const nameFor = (userId: string) =>
    members.find((m) => m.userId === userId)?.name || userId.slice(0, 8);

  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    setAddingExpense(true);
    setError("");
    try {
      await addExpense(groupId, {
        title: expTitle,
        amount: Number(expAmount),
        currency: expCurrency,
      });
      setExpTitle("");
      setExpAmount("");
      setShowExpenseForm(false);
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add expense");
    } finally {
      setAddingExpense(false);
    }
  };

  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    setAddingMember(true);
    setError("");
    try {
      await addMember(groupId, newMemberId);
      setNewMemberId("");
      setShowMemberForm(false);
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add member");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!groupId) return;
    try {
      await removeMember(groupId, memberId);
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove member");
    }
  };

  const handleLeave = async () => {
    if (!groupId) return;
    try {
      await leaveGroup(groupId);
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not leave group");
    }
  };

  const handleSettle = async (toUser: string, amount: string, currency: string) => {
    try {
      await createSettlement({ toUser, amount: Number(amount), currency });
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not record settlement");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <p className="max-w-4xl mx-auto px-6 py-10 text-ink-soft text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <Link to="/" className="text-xs text-ink-soft underline decoration-dotted">
          ← All groups
        </Link>

        <div className="flex items-baseline justify-between mt-3 mb-8">
          <h1 className="text-3xl">{group?.name}</h1>
          <Button variant="danger" onClick={handleLeave}>
            Leave group
          </Button>
        </div>

        {error && <div className="mb-6"><Alert>{error}</Alert></div>}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left column: members + balances */}
          <div className="md:col-span-1 flex flex-col gap-8">
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm uppercase tracking-widest text-ink-soft">
                  Members
                </h2>
                <button
                  onClick={() => setShowMemberForm((s) => !s)}
                  className="text-xs text-moss underline decoration-dotted"
                >
                  {showMemberForm ? "cancel" : "+ add"}
                </button>
              </div>

              {showMemberForm && (
                <form onSubmit={handleAddMember} className="flex flex-col gap-2 mb-4">
                  <Input
                    placeholder="User ID to add"
                    value={newMemberId}
                    onChange={(e) => setNewMemberId(e.target.value)}
                    required
                  />
                  <Button type="submit" disabled={addingMember} className="self-start">
                    {addingMember ? "Adding…" : "Add member"}
                  </Button>
                </form>
              )}

              <ul className="flex flex-col gap-2">
                {members.map((m) => (
                  <li
                    key={m.userId}
                    className="flex items-center justify-between text-sm border-b border-paper-line pb-2"
                  >
                    <span>
                      {m.name}
                      {m.userId === user?.id && (
                        <span className="text-ink-soft"> (you)</span>
                      )}
                    </span>
                    {m.userId !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(m.userId)}
                        className="text-xs text-rust/70 hover:text-rust"
                      >
                        remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-sm uppercase tracking-widest text-ink-soft mb-3">
                Suggested settlements
              </h2>
              {balances && balances.settlementsSuggested.length === 0 ? (
                <p className="text-sm text-ink-soft">All settled up.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {balances?.settlementsSuggested.map((s, i) => (
                    <li key={i} className="text-sm">
                      <p>
                        <span className="font-medium">{s.fromUserName}</span> owes{" "}
                        <span className="font-medium">{s.toUserName}</span>
                      </p>
                      <p className="amount-negative text-base">
                        {s.currency} {s.amount}
                      </p>
                      {s.fromUserId === user?.id && (
                        <Button
                          variant="secondary"
                          className="mt-1 text-xs px-2 py-1"
                          onClick={() => handleSettle(s.toUserId, s.amount, s.currency)}
                        >
                          Mark as paid
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Right column: expenses */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm uppercase tracking-widest text-ink-soft">
                Expenses
              </h2>
              <Button
                variant="secondary"
                onClick={() => setShowExpenseForm((s) => !s)}
              >
                {showExpenseForm ? "Cancel" : "+ Add expense"}
              </Button>
            </div>

            {showExpenseForm && (
              <Card className="p-6 mb-6">
                <form onSubmit={handleAddExpense} className="grid sm:grid-cols-3 gap-4 items-end">
                  <div className="sm:col-span-1">
                    <Input
                      label="Title"
                      value={expTitle}
                      onChange={(e) => setExpTitle(e.target.value)}
                      placeholder="Hotel booking"
                      required
                    />
                  </div>
                  <Input
                    label="Amount"
                    type="number"
                    step="0.01"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    required
                  />
                  <Input
                    label="Currency"
                    value={expCurrency}
                    onChange={(e) => setExpCurrency(e.target.value.toUpperCase())}
                    maxLength={3}
                    required
                  />
                  <Button type="submit" disabled={addingExpense} className="sm:col-span-3">
                    {addingExpense ? "Adding…" : "Split equally among members"}
                  </Button>
                </form>
              </Card>
            )}

            {expenses.length === 0 ? (
              <Card className="p-10 text-center">
                <p className="text-ink-soft">No expenses logged yet.</p>
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                {expenses.map((exp) => (
                  <ReceiptCard key={exp.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-display text-lg">{exp.title}</p>
                        <p className="text-xs text-ink-soft">
                          paid by {nameFor(exp.paidBy)} ·{" "}
                          {new Date(exp.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-mono text-lg tabular-nums">
                        {exp.currency} {exp.amount}
                      </p>
                    </div>
                  </ReceiptCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
