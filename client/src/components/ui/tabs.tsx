export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex border-b-2 border-dashed border-moss/20 mb-4">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2 text-sm transition-colors ${
            value === t.id ? "text-moss border-b-2 border-moss -mb-0.5" : "text-ink-soft hover:text-moss"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
