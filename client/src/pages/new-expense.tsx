import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Page, BackButton } from "../components/page";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Alert } from "../components/ui/alert";
import { Tabs } from "../components/ui/tabs";
import { Avatar } from "../components/ui/avatar";
import { UserSearch } from "../components/user-search";
import { useAuth } from "../lib/auth-context";
import { EXPENSE_CATEGORIES } from "../lib/categories";
import { errorMessage, money } from "../lib/format";
import { createExpense, getGroups, getGroupWithMembers } from "../lib/services";
import type { GroupSummary, Split, SplitType } from "../lib/services";

interface Participant {
  id: string;
  name: string;
  imageUrl?: string | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function NewExpensePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [type, setType] = useState<"individual" | "group">(
    params.get("groupId") ? "group" : "individual"
  );
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [paidByUserId, setPaidByUserId] = useState(user?.id ?? "");

  const me: Participant = { id: user!.id, name: user!.name };
  const [otherPerson, setOtherPerson] = useState<Participant | null>(null);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [groupId, setGroupId] = useState(params.get("groupId") ?? "");
  const [groupMembers, setGroupMembers] = useState<Participant[]>([]);

  // custom per-person values for percentage / exact splits
  const [custom, setCustom] = useState<Record<string, string>>({});

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getGroups()
      .then((res) => setGroups(res.groups))
      .catch(() => setGroups([]));
  }, []);

  useEffect(() => {
    if (!groupId) {
      setGroupMembers([]);
      return;
    }
    getGroupWithMembers(groupId)
      .then((res) => setGroupMembers(res.selectGroup.member))
      .catch((err) => setError(errorMessage(err, "Could not load group")));
  }, [groupId]);

  const participants: Participant[] = useMemo(
    () => (type === "group" ? groupMembers : otherPerson ? [me, otherPerson] : [me]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type, groupMembers, otherPerson, user?.id]
  );

  // reset custom values when the participant set or split type changes
  useEffect(() => setCustom({}), [splitType, participants.length]);

  const total = parseFloat(amount) || 0;

  const splits: Split[] = useMemo(() => {
    if (total <= 0 || participants.length === 0) return [];
    const n = participants.length;

    let amounts: number[];
    if (splitType === "equal") {
      amounts = participants.map(() => round2(total / n));
    } else if (splitType === "percentage") {
      amounts = participants.map((p) => {
        const pct = custom[p.id] !== undefined ? parseFloat(custom[p.id]) || 0 : 100 / n;
        return round2((total * pct) / 100);
      });
    } else {
      amounts = participants.map((p) =>
        custom[p.id] !== undefined ? parseFloat(custom[p.id]) || 0 : round2(total / n)
      );
    }

    // push any rounding remainder onto the first participant for the equal split
    if (splitType === "equal") {
      amounts[0] = round2(amounts[0] + (total - amounts.reduce((a, b) => a + b, 0)));
    }

    return participants.map((p, i) => ({
      userId: p.id,
      amount: amounts[i],
      paid: p.id === paidByUserId,
    }));
  }, [total, participants, splitType, custom, paidByUserId]);

  const splitsTotal = splits.reduce((sum, s) => sum + s.amount, 0);
  const balanced = Math.abs(splitsTotal - total) <= 0.01;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (type === "individual" && !otherPerson) return setError("Select a person to split with");
    if (type === "group" && !groupId) return setError("Select a group");
    if (!balanced) return setError("Split amounts don't add up to the total. Please adjust your splits.");

    setSaving(true);
    try {
      await createExpense({
        description,
        amount: total,
        category,
        date: new Date(date).getTime(),
        paidByUserId,
        splitType,
        splits,
        groupId: type === "group" ? groupId : undefined,
      });
      navigate(type === "group" ? `/groups/${groupId}` : `/person/${otherPerson!.id}`);
    } catch (err) {
      setError(errorMessage(err, "Failed to create expense"));
      setSaving(false);
    }
  };

  return (
    <Page>
      <BackButton />
      <p className="text-xs uppercase tracking-widest text-ink-soft mb-1">New entry</p>
      <h1 className="text-3xl mb-6">Add an expense</h1>

      <Card className="p-6">
        <Tabs
          tabs={[
            { id: "individual", label: "Individual expense" },
            { id: "group", label: "Group expense" },
          ]}
          value={type}
          onChange={(t) => {
            setType(t);
            setPaidByUserId(user!.id);
          }}
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && <Alert>{error}</Alert>}

          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Lunch, movie tickets, etc." required />
            <Input label="Amount" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          {type === "group" ? (
            <Select label="Group" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">Select a group…</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.memberCount} members)
                </option>
              ))}
            </Select>
          ) : (
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">Participants</p>
              <div className="flex gap-2 flex-wrap mb-3">
                <span className="text-xs rounded-full bg-moss-light text-moss px-3 py-1">You</span>
                {otherPerson && (
                  <button
                    type="button"
                    onClick={() => {
                      setOtherPerson(null);
                      setPaidByUserId(user!.id);
                    }}
                    className="text-xs rounded-full bg-cream-dark px-3 py-1 hover:bg-rust/10"
                  >
                    {otherPerson.name} ✕
                  </button>
                )}
              </div>
              {!otherPerson && (
                <UserSearch label="Split with" onSelect={(u) => setOtherPerson({ id: u.id, name: u.name, imageUrl: u.imageUrl })} />
              )}
            </div>
          )}

          {participants.length > 1 && (
            <>
              <Select label="Paid by" value={paidByUserId} onChange={(e) => setPaidByUserId(e.target.value)}>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id === user?.id ? "You" : p.name}
                  </option>
                ))}
              </Select>

              <div>
                <Tabs
                  tabs={[
                    { id: "equal", label: "Equal" },
                    { id: "percentage", label: "Percentage" },
                    { id: "exact", label: "Exact amounts" },
                  ]}
                  value={splitType}
                  onChange={setSplitType}
                />

                <ul className="flex flex-col gap-3">
                  {participants.map((p, i) => (
                    <li key={p.id} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm">
                        <Avatar name={p.name} src={p.imageUrl} size={26} />
                        {p.id === user?.id ? "You" : p.name}
                      </span>
                      <span className="flex items-center gap-3">
                        {splitType !== "equal" && (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-24 bg-cream/60 border-2 border-dashed border-moss/20 rounded-lg px-2 py-1 text-sm text-right"
                            value={
                              custom[p.id] ??
                              (splitType === "percentage"
                                ? String(round2(100 / participants.length))
                                : splits[i] ? String(splits[i].amount) : "")
                            }
                            onChange={(e) => setCustom((c) => ({ ...c, [p.id]: e.target.value }))}
                          />
                        )}
                        <span className="font-mono text-sm tabular-nums w-24 text-right">
                          {money(splits[i]?.amount ?? 0)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>

                {total > 0 && (
                  <p className={`text-xs mt-3 ${balanced ? "text-ink-soft" : "text-rust"}`}>
                    Total split: {money(splitsTotal)} / {money(total)}
                    {!balanced && " — amounts must add up to the total"}
                  </p>
                )}
              </div>
            </>
          )}

          <Button type="submit" disabled={saving} className="self-start">
            {saving ? "Creating…" : "Create expense"}
          </Button>
        </form>
      </Card>
    </Page>
  );
}
