import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "./navbar";
import { Button } from "./ui/button";

export function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className={`${wide ? "max-w-5xl" : "max-w-4xl"} mx-auto px-6 py-10`}>{children}</main>
    </div>
  );
}

export function BackButton() {
  const navigate = useNavigate();
  return (
    <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
      ← Back
    </Button>
  );
}

export function Loading() {
  return <p className="text-ink-soft text-sm">Loading…</p>;
}
