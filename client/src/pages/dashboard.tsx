import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Page, Loading } from "../components/page";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";
import { Avatar } from "../components/ui/avatar";
import {
  getUserBalances,
  getTotalSpent,
  getMonthlySpending,
  getGroupBalances,
} from "../lib/services";
import { errorMessage, money } from "../lib/format";

type Data = {
  balances: Awaited<ReturnType<typeof getUserBalances>>;
  totalSpent: number;
  monthly: Awaited<ReturnType<typeof getMonthlySpending>>;
  groups: Awaited<ReturnType<typeof getGroupBalances>>;
};

export function DashboardPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getUserBalances(), getTotalSpent(), getMonthlySpending(), getGroupBalances()])
      .then(([balances, spent, monthly, groups]) =>
        setData({ balances, totalSpent: spent.totalSpent, monthly, groups })
      )
      .catch((err) => setError(errorMessage(err, "Could not load dashboard")));
  }, []);

  return (
    <Page wide>
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink-soft mb-1">Overview</p>
          <h1 className="text-3xl">Dashboard</h1>
        </div>
        <Link to="/expenses/new">
          <Button>+ Add expense</Button>
        </Link>
      </div>

      {error && <Alert>{error}</Alert>}
      {!data && !error && <Loading />}

      {data && (
        <div className="flex flex-col gap-8">
          <BalanceSummary balances={data.balances} />

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ExpenseSummary monthly={data.monthly} total={data.totalSpent} />
            </div>
            <GroupList groups={data.groups} />
          </div>
        </div>
      )}
    </Page>
  );
}

function PersonLines({
  lines,
  tone,
  empty,
}: {
  lines: Data["balances"]["oweDetails"]["youOwe"];
  tone: "amount-positive" | "amount-negative";
  empty: string;
}) {
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {lines.length === 0 && <li className="text-xs text-ink-soft">{empty}</li>}
      {lines.map((p) => (
        <li key={p.userId}>
          <Link to={`/person/${p.userId}`} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Avatar name={p.name} src={p.imageUrl} size={22} />
              {p.name}
            </span>
            <span className={tone}>{money(p.amount)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function BalanceSummary({ balances }: { balances: Data["balances"] }) {
  const { youOwe, youAreOwed, totalBalance, oweDetails } = balances;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="p-5">
        <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">Total balance</p>
        <p className={`${totalBalance >= 0 ? "amount-positive" : "amount-negative"} text-2xl`}>
          {totalBalance < 0 && "-"}
          {money(totalBalance)}
        </p>
        <p className="text-xs text-ink-soft mt-1">
          {totalBalance > 0
            ? "You are owed overall"
            : totalBalance < 0
              ? "You owe overall"
              : "All settled up"}
        </p>
      </Card>

      <Card className="p-5">
        <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">You are owed</p>
        <p className="amount-positive text-2xl">{money(youAreOwed)}</p>
        <PersonLines lines={oweDetails.youAreOwedBy} tone="amount-positive" empty="Nobody owes you" />
      </Card>

      <Card className="p-5">
        <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">You owe</p>
        <p className="amount-negative text-2xl">{money(youOwe)}</p>
        <PersonLines lines={oweDetails.youOwe} tone="amount-negative" empty="You owe nothing" />
      </Card>
    </div>
  );
}

function ExpenseSummary({ monthly, total }: { monthly: Data["monthly"]; total: number }) {
  const max = Math.max(...monthly.map((m) => m.total), 1);
  const year = new Date().getFullYear();

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-sm uppercase tracking-widest text-ink-soft">Spending in {year}</h2>
        <p className="font-mono tabular-nums">{money(total)}</p>
      </div>
      <div className="flex items-end gap-2 h-40">
        {monthly.map((m) => (
          <div key={m.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <div
              title={money(m.total)}
              className="w-full bg-sage rounded-t-md hover:bg-moss transition-colors"
              style={{ height: `${(m.total / max) * 100}%`, minHeight: m.total > 0 ? 4 : 0 }}
            />
            <span className="text-[10px] text-ink-soft">
              {new Date(m.month).toLocaleDateString(undefined, { month: "short" })}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function GroupList({ groups }: { groups: Data["groups"] }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm uppercase tracking-widest text-ink-soft">Groups</h2>
        <Link to="/contacts" className="text-xs text-moss underline decoration-dotted">
          + new
        </Link>
      </div>
      {groups.length === 0 ? (
        <p className="text-sm text-ink-soft">No groups yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {groups.map((g) => (
            <li key={g.id}>
              <Link to={`/groups/${g.id}`} className="flex items-center justify-between">
                <span>
                  <span className="block text-sm">{g.name}</span>
                </span>
                {g.balance !== 0 && (
                  <span className={`${g.balance > 0 ? "amount-positive" : "amount-negative"} text-sm`}>
                    {g.balance > 0 ? "+" : "-"}
                    {money(g.balance)}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
