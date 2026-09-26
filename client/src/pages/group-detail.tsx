import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Page, BackButton, Loading } from "../components/page";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";
import { Avatar } from "../components/ui/avatar";
import { Tabs } from "../components/ui/tabs";
import { UserSearch } from "../components/user-search";
import { ExpenseList } from "../components/expense-list";
import { SettlementsList } from "../components/settlements-list";
import { useAuth } from "../lib/auth-context";
import { addMember, deleteExpense, getGroupExpenses, leaveGroup, removeMember } from "../lib/services";
import type { Expense } from "../lib/services";
import { errorMessage, money } from "../lib/format";

type Data = Awaited<ReturnType<typeof getGroupExpenses>>;
type Tab = "expenses" | "balances" | "members";

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("expenses");

  const load = () =>
    getGroupExpenses(groupId!)
      .then(setData)
      .catch((err) => setError(errorMessage(err, "Could not load group")));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setError("");
    try {
      await action();
      await load();
    } catch (err) {
      setError(errorMessage(err, fallback));
    }
  };

  const handleDelete = (expense: Expense) => {
    if (!window.confirm("Are you sure you want to delete this expense? This action cannot be undone.")) return;
    run(() => deleteExpense(expense.id), "Failed to delete expense");
  };

  const handleLeave = async () => {
    try {
      await leaveGroup(groupId!);
      navigate("/dashboard");
    } catch (err) {
      setError(errorMessage(err, "Could not leave group"));
    }
  };

  if (!data) {
    return (
      <Page>
        <BackButton />
        {error ? <Alert>{error}</Alert> : <Loading />}
      </Page>
    );
  }

  const { group, members, expenses, settlements, balances, userLookupMap } = data;
  const myBalance = balances.find((b) => b.id === user?.id)?.totalBalance ?? 0;
  const nameOf = (id: string) => (id === user?.id ? "You" : userLookupMap[id]?.name || "Unknown");

  return (
    <Page>
      <BackButton />

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-3xl">{group.name}</h1>
          {group.description && <p className="text-sm text-ink-soft mt-1">{group.description}</p>}
          <p className="text-xs text-ink-soft mt-1">{members.length} members</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/settlements/group/${group.id}`}>
            <Button variant="outline">Settle up</Button>
          </Link>
          <Link to={`/expenses/new?groupId=${group.id}`}>
            <Button>Add expense</Button>
          </Link>
        </div>
      </div>

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}

      <Card className="p-5 mb-6 flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {myBalance === 0 ? "You are all settled up" : myBalance > 0 ? "You are owed" : "You owe"}
        </p>
        <p className={`text-2xl ${myBalance > 0 ? "amount-positive" : myBalance < 0 ? "amount-negative" : "font-mono"}`}>
          {money(myBalance)}
        </p>
      </Card>

      <Tabs
        tabs={[
          { id: "expenses", label: `Expenses (${expenses.length})` },
          { id: "balances", label: "Balances" },
          { id: "members", label: `Members (${members.length})` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "expenses" && (
        <div className="flex flex-col gap-8">
          <ExpenseList expenses={expenses} userLookup={userLookupMap} isGroupExpense onDelete={handleDelete} />
          {settlements.length > 0 && (
            <div>
              <h2 className="text-sm uppercase tracking-widest text-ink-soft mb-3">Settlements</h2>
              <SettlementsList settlements={settlements} userLookup={userLookupMap} />
            </div>
          )}
        </div>
      )}

      {tab === "balances" && (
        <div className="flex flex-col gap-3">
          {balances.map((b) => (
            <Card key={b.id} className="p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Avatar name={b.name} src={b.imageUrl} size={32} />
                  <span className="font-medium">{b.id === user?.id ? "You" : b.name}</span>
                </span>
                <span className={b.totalBalance > 0 ? "amount-positive" : b.totalBalance < 0 ? "amount-negative" : "font-mono"}>
                  {b.totalBalance > 0 ? "+" : b.totalBalance < 0 ? "-" : ""}
                  {money(b.totalBalance)}
                </span>
              </div>
              {(b.owes.length > 0 || b.owedBy.length > 0) && (
                <ul className="mt-3 text-xs text-ink-soft flex flex-col gap-1">
                  {b.owes.map((o) => (
                    <li key={`o-${o.to}`}>
                      owes {nameOf(o.to)} <span className="amount-negative">{money(o.amount)}</span>
                    </li>
                  ))}
                  {b.owedBy.map((o) => (
                    <li key={`b-${o.from}`}>
                      is owed <span className="amount-positive">{money(o.amount)}</span> by {nameOf(o.from)}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === "members" && (
        <MembersTab
          members={members}
          myId={user?.id}
          onAdd={(userId) => run(() => addMember(groupId!, userId), "Could not add member")}
          onRemove={(memberId) => run(() => removeMember(groupId!, memberId), "Could not remove member")}
          onLeave={handleLeave}
        />
      )}
    </Page>
  );
}

function MembersTab({
  members,
  myId,
  onAdd,
  onRemove,
  onLeave,
}: {
  members: Data["members"];
  myId?: string;
  onAdd: (userId: string) => void;
  onRemove: (memberId: string) => void;
  onLeave: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <ul className="flex flex-col gap-3">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Avatar name={m.name} src={m.imageUrl} size={32} />
                <span className="text-sm">
                  {m.name}
                  {m.id === myId && <span className="text-ink-soft"> (you)</span>}
                </span>
                {m.role === "admin" && (
                  <span className="text-[10px] uppercase tracking-widest rounded-full bg-moss-light text-moss px-2 py-0.5">
                    admin
                  </span>
                )}
              </span>
              {m.id !== myId && (
                <button onClick={() => onRemove(m.id)} className="text-xs text-rust/70 hover:text-rust">
                  remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {showAdd ? (
        <Card className="p-4">
          <UserSearch
            label="Add a member"
            exclude={members.map((m) => m.id)}
            onSelect={(u) => {
              onAdd(u.id);
              setShowAdd(false);
            }}
          />
        </Card>
      ) : null}

      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setShowAdd((s) => !s)}>
          {showAdd ? "Cancel" : "+ Add member"}
        </Button>
        <Button variant="danger" onClick={onLeave}>
          Leave group
        </Button>
      </div>
    </div>
  );
}
