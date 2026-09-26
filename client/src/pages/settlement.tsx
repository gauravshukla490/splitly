import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Page, BackButton, Loading } from "../components/page";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Alert } from "../components/ui/alert";
import { Avatar } from "../components/ui/avatar";
import { useAuth } from "../lib/auth-context";
import { createSettlement, getSettlementData } from "../lib/services";
import type { SettlementData } from "../lib/services";
import { errorMessage, money } from "../lib/format";

export function SettlementPage() {
  const { type, id } = useParams<{ type: "user" | "group"; id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<SettlementData | null>(null);
  const [error, setError] = useState("");

  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [paymentType, setPaymentType] = useState<"youPaid" | "theyPaid">("youPaid");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (type !== "user" && type !== "group") return;
    getSettlementData(type, id!)
      .then(setData)
      .catch((err) => setError(errorMessage(err, "Failed to fetch the data")));
  }, [type, id]);

  if (!data) {
    return (
      <Page>
        <BackButton />
        {error ? <Alert>{error}</Alert> : <Loading />}
      </Page>
    );
  }

  const counterpart =
    data.type === "user"
      ? { userId: data.counterPart.userId, name: data.counterPart.name, imageUrl: data.counterPart.imageUrl }
      : data.balances.find((b) => b.userId === selectedMemberId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!counterpart) return setError("Please select a group member to settle with");

    setSaving(true);
    setError("");
    try {
      const meId = user!.id;
      await createSettlement({
        amount: parseFloat(amount),
        note: note || undefined,
        paidByUserId: paymentType === "youPaid" ? meId : counterpart.userId,
        receivedByUserId: paymentType === "youPaid" ? counterpart.userId : meId,
        groupId: data.type === "group" ? data.group.id : undefined,
      });
      navigate(data.type === "user" ? `/person/${id}` : `/groups/${id}`);
    } catch (err) {
      setError(errorMessage(err, "Failed to record settlement"));
      setSaving(false);
    }
  };

  const title = data.type === "user" ? data.counterPart.name : data.group.name;

  return (
    <Page>
      <BackButton />
      <h1 className="text-3xl">Record a settlement</h1>
      <p className="text-sm text-ink-soft mb-6">
        {data.type === "user" ? `Settling up with ${title}` : `Settling up in ${title}`}
      </p>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && <Alert>{error}</Alert>}

          {data.type === "user" ? (
            <div className="bg-cream-dark rounded-xl p-4">
              <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">Current balance</p>
              {data.netBalance === 0 ? (
                <p className="text-sm text-ink-soft">You are all settled up with {data.counterPart.name}</p>
              ) : (
                <div className="flex items-center justify-between">
                  <p>
                    {data.netBalance > 0 ? (
                      <>
                        <span className="font-medium">{data.counterPart.name}</span> owes you
                      </>
                    ) : (
                      <>
                        You owe <span className="font-medium">{data.counterPart.name}</span>
                      </>
                    )}
                  </p>
                  <span className={data.netBalance > 0 ? "amount-positive text-xl" : "amount-negative text-xl"}>
                    {money(data.netBalance)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">Who are you settling with?</p>
              <ul className="flex flex-col gap-2">
                {data.balances.map((m) => (
                  <li key={m.userId}>
                    <button
                      type="button"
                      onClick={() => setSelectedMemberId(m.userId)}
                      className={`w-full flex items-center justify-between rounded-xl border-2 border-dashed px-3 py-2.5 text-left transition-colors ${
                        selectedMemberId === m.userId ? "border-moss bg-sage-light" : "border-moss/20 hover:bg-sage-light/60"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <Avatar name={m.name} src={m.imageUrl} size={28} />
                        {m.name}
                      </span>
                      <span className={`text-sm ${m.netBalance > 0 ? "text-moss" : m.netBalance < 0 ? "text-rust" : "text-ink-soft"}`}>
                        {m.netBalance > 0
                          ? `They owe you ${money(m.netBalance)}`
                          : m.netBalance < 0
                            ? `You owe ${money(m.netBalance)}`
                            : "Settled up"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {!selectedMemberId && (
                <p className="text-xs text-gold mt-2">Please select a member to settle with</p>
              )}
            </div>
          )}

          {counterpart && (
            <>
              <div>
                <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">Who paid?</p>
                <div className="flex flex-col gap-2">
                  {(
                    [
                      ["youPaid", `You paid ${counterpart.name}`, user!.name, null],
                      ["theyPaid", `${counterpart.name} paid you`, counterpart.name, counterpart.imageUrl],
                    ] as const
                  ).map(([value, label, avatarName, avatarSrc]) => (
                    <label
                      key={value}
                      className="flex items-center gap-3 rounded-xl border-2 border-dashed border-moss/20 px-3 py-2.5 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="paymentType"
                        checked={paymentType === value}
                        onChange={() => setPaymentType(value)}
                        className="accent-moss"
                      />
                      <Avatar name={avatarName} src={avatarSrc} size={24} />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Input
                label="Amount (₹)"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
              <Input
                label="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Dinner, rent, etc."
              />
            </>
          )}

          <Button type="submit" disabled={saving || !counterpart} className="self-start">
            {saving ? "Recording…" : "Record settlement"}
          </Button>
        </form>
      </Card>
    </Page>
  );
}
