import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Page, Loading } from "../components/page";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Alert } from "../components/ui/alert";
import { Avatar } from "../components/ui/avatar";
import { UserSearch } from "../components/user-search";
import { getContacts, createGroup } from "../lib/services";
import type { PublicUser } from "../lib/services";
import { errorMessage } from "../lib/format";

type Contacts = Awaited<ReturnType<typeof getContacts>>;

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contacts | null>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    getContacts()
      .then(setContacts)
      .catch((err) => setError(errorMessage(err, "Could not load contacts")));
  }, []);

  return (
    <Page>
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink-soft mb-1">People & groups</p>
          <h1 className="text-3xl">Contacts</h1>
        </div>
        <Button variant="secondary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Create group"}
        </Button>
      </div>

      {error && <Alert>{error}</Alert>}
      {showForm && <CreateGroupForm />}
      {!contacts && !error && <Loading />}

      {contacts && (
        <div className="grid md:grid-cols-2 gap-8">
          <section>
            <h2 className="text-sm uppercase tracking-widest text-ink-soft mb-3">People</h2>
            {contacts.users.length === 0 ? (
              <Card className="p-6 text-sm text-ink-soft text-center">No contacts yet.</Card>
            ) : (
              <div className="flex flex-col gap-3">
                {contacts.users.map((u) => (
                  <Link key={u.id} to={`/person/${u.id}`}>
                    <Card className="p-4 flex items-center gap-3 hover:border-moss/50">
                      <Avatar name={u.name} src={u.imageUrl} size={40} />
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-ink-soft">{u.email}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm uppercase tracking-widest text-ink-soft mb-3">Groups</h2>
            {contacts.groups.length === 0 ? (
              <Card className="p-6 text-sm text-ink-soft text-center">No groups yet.</Card>
            ) : (
              <div className="flex flex-col gap-3">
                {contacts.groups.map((g) => (
                  <Link key={g.id} to={`/groups/${g.id}`}>
                    <Card className="p-4 hover:border-moss/50">
                      <p className="font-medium">{g.name}</p>
                      <p className="text-xs text-ink-soft">{g.memberCount} members</p>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </Page>
  );
}

function CreateGroupForm() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<PublicUser[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await createGroup({
        name,
        description,
        members: members.map((m) => m.id),
      });
      navigate(`/groups/${res.group.id}`);
    } catch (err) {
      setError(errorMessage(err, "Could not create group"));
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}
        <Input label="Group name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Goa Trip" required />
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />

        <div>
          <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">Members</p>
          <div className="flex gap-2 flex-wrap mb-3">
            <span className="text-xs rounded-full bg-moss-light text-moss px-3 py-1">You (admin)</span>
            {members.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setMembers((prev) => prev.filter((p) => p.id !== m.id))}
                className="text-xs rounded-full bg-cream-dark px-3 py-1 hover:bg-rust/10"
              >
                {m.name} ✕
              </button>
            ))}
          </div>
          <UserSearch
            label="Add members"
            exclude={members.map((m) => m.id)}
            onSelect={(u) => setMembers((prev) => [...prev, u])}
          />
        </div>

        <Button type="submit" disabled={saving} className="self-start">
          {saving ? "Creating…" : "Create group"}
        </Button>
      </form>
    </Card>
  );
}
