import { Card } from "./ui/card";
import { useAuth } from "../lib/auth-context";
import { formatDate, money } from "../lib/format";
import type { Settlement } from "../lib/services";

export function SettlementsList({
  settlements,
  userLookup,
}: {
  settlements: Settlement[];
  userLookup: Record<string, { name: string }>;
}) {
  const { user } = useAuth();

  if (settlements.length === 0) {
    return <Card className="p-8 text-center text-ink-soft text-sm">No settlements found</Card>;
  }

  const nameOf = (id: string) => (id === user?.id ? "You" : userLookup[id]?.name || "Other User");

  return (
    <div className="flex flex-col gap-3">
      {settlements.map((s) => {
        const iPaid = s.paidByUserId === user?.id;
        return (
          <Card key={s.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">
                {iPaid ? "You paid " : `${nameOf(s.paidByUserId)} paid `}
                {nameOf(s.receivedByUserId)}
              </p>
              <p className="text-xs text-ink-soft mt-0.5">
                {formatDate(s.date)}
                {s.note && ` · ${s.note}`}
              </p>
            </div>
            <p className={`font-mono tabular-nums ${iPaid ? "text-rust" : "text-moss"}`}>
              {money(s.amount)}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
