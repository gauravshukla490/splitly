export function Alert({ children, variant = "error" }: { children: React.ReactNode; variant?: "error" | "success" }) {
  const colors =
    variant === "error"
      ? "border-rust/30 text-rust bg-rust/5"
      : "border-moss/30 text-moss bg-moss-light";
  return (
    <div className={`border-2 border-dashed rounded-xl px-4 py-2.5 text-sm ${colors}`}>{children}</div>
  );
}
