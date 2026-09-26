import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Avatar } from "./ui/avatar";
import { searchUsers } from "../lib/services";
import type { PublicUser } from "../lib/services";

// Search-as-you-type user picker (name or email, min 2 chars)
export function UserSearch({
  onSelect,
  exclude = [],
  label = "Search people",
}: {
  onSelect: (user: PublicUser) => void;
  exclude?: string[];
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicUser[]>([]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchUsers(query.trim())
        .then((res) => setResults(res.users))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const visible = results.filter((u) => !exclude.includes(u.id));

  return (
    <div>
      <Input
        label={label}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Name or email"
      />
      {query.trim().length >= 2 && (
        <ul className="mt-2 border-2 border-dashed border-moss/20 rounded-xl bg-white max-h-48 overflow-auto">
          {visible.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ink-soft">No users found</li>
          ) : (
            visible.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(u);
                    setQuery("");
                    setResults([]);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-sage-light"
                >
                  <Avatar name={u.name} src={u.imageUrl} size={24} />
                  <span className="text-sm">{u.name}</span>
                  <span className="text-xs text-ink-soft">{u.email}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
