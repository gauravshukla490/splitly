import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Page, BackButton, Loading } from "../components/page";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";
import { Avatar } from "../components/ui/avatar";
import { Tabs } from "../components/ui/tabs";
import { ExpenseList } from "../components/expense-list";
import { SettlementsList } from "../components/settlements-list";
import { deleteExpense, getExpensesBetweenUsers } from "../lib/services";
import type { Expense } from "../lib/services";
import { errorMessage, money } from "../lib/format";

type Data = Awaited<ReturnType<typeof getExpensesBetweenUsers>>;

export function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"expenses" | "settlements">("expenses");

  const load = () =>
    getExpensesBetweenUsers(id!)
      .then(setData)
      .catch((err) => setError(errorMessage(err, "Could not load this person")));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDelete = async (expense: Expense) => {
    if (!window.confirm("Are you sure you want to delete this expense? This action cannot be undone.")) return;
    try {
      await deleteExpense(expense.id);
      await load();
    } catch (err) {
      setError(errorMessage(err, "Failed to delete expense"));
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

  const { otherUser, expenses, settlements, balance } = data;
  const lookup = { [otherUser.id]: otherUser };

  return (
    <Page>
      <BackButton />

      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Avatar name={otherUser.name} src={otherUser.imageUrl} size={64} />
          <div>
            <h1 className="text-3xl">{otherUser.name}</h1>
            <p className="text-sm text-ink-soft">{otherUser.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/settlements/user/${otherUser.id}`}>
            <Button variant="outline">Settle up</Button>
          </Link>
          <Link to="/expenses/new">
            <Button>Add expense</Button>
          </Link>
        </div>
      </div>

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}

      <Card className="p-5 mb-6 flex items-center justify-between">
        <p>
          {balance === 0 ? (
            "You are all settled up!"
          ) : balance > 0 ? (
            <>
              <span className="font-medium">{otherUser.name}</span> owes you
            </>
          ) : (
            <>
              You owe <span className="font-medium">{otherUser.name}</span>
            </>
          )}
        </p>
        <p className={`text-2xl ${balance > 0 ? "amount-positive" : balance < 0 ? "amount-negative" : "font-mono"}`}>
          {money(balance)}
        </p>
      </Card>

      <Tabs
        tabs={[
          { id: "expenses", label: `Expenses (${expenses.length})` },
          { id: "settlements", label: `Settlements (${settlements.length})` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "expenses" ? (
        <ExpenseList
          expenses={expenses}
          userLookup={lookup}
          showOtherPerson={false}
          otherPersonId={otherUser.id}
          onDelete={handleDelete}
        />
      ) : (
        <SettlementsList settlements={settlements} userLookup={lookup} />
      )}
    </Page>
  );
}
