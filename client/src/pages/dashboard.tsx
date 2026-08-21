import { useEffect, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { getMyGroups, createGroup, Group } from "../lib/groups-api";
import { ApiError } from "../lib/api";
import { Navbar } from "../components/navbar";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";
import { Card } from "../components/ui/card";

export function DashboardPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  const loadGroups = async () => {
    try {
      const res = await getMyGroups();
      setGroups(res.groups);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createGroup({ name: newGroupName });
      setNewGroupName("");
      setShowForm(false);
      await loadGroups();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create group");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-ink-soft mb-1">
              Your ledgers
            </p>
            <h1 className="text-3xl">Groups</h1>
          </div>
          <Button onClick={() => setShowForm((s) => !s)} variant="secondary">
            {showForm ? "Cancel" : "+ New group"}
          </Button>
        </div>

        {error && <Alert>{error}</Alert>}

        {showForm && (
          <Card className="p-6 mb-8">
            <form onSubmit={handleCreate} className="flex items-end gap-4">
              <div className="flex-1">
                <Input
                  label="Group name"
                  id="groupName"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Goa Trip"
                  required
                />
              </div>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating…" : "Create"}
              </Button>
            </form>
          </Card>
        )}

        {loading ? (
          <p className="text-ink-soft text-sm">Loading…</p>
        ) : groups.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-ink-soft">
              No groups yet. Start one to split your first expense.
            </p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {groups.map((group) => (
              <Link key={group.id} to={`/groups/${group.id}`}>
                <Card className="p-5 hover:border-moss/50 transition-colors">
                  <p className="font-display text-lg text-ink">{group.name}</p>
                  <p className="text-xs text-ink-soft mt-1 font-mono">
                    opened {new Date(group.createdAt).toLocaleDateString()}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}