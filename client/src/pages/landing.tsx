import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

const FEATURES = [
  {
    title: "Split any expense",
    desc: "Split bills equally, by exact amounts, percentages, or shares — however your group actually spent the money.",
    icon: "🧾",
  },
  {
    title: "Group expenses",
    desc: "Create a ledger for a trip, roommates, or a project and keep every shared cost in one place.",
    icon: "👥",
  },
  {
    title: "Simplify debts",
    desc: "Splitlyy automatically works out the fewest payments needed to settle up the whole group.",
    icon: "🔄",
  },
  {
    title: "Track balances",
    desc: "See exactly who owes who, and how much, updated the moment a new expense is added.",
    icon: "📊",
  },
  {
    title: "Settle up",
    desc: "Record a payment and clear a balance in a couple of taps — no spreadsheets, no awkward reminders.",
    icon: "✅",
  },
  {
    title: "Expense history",
    desc: "Every expense and settlement is logged, so your group always has a clear paper trail.",
    icon: "📜",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create a group",
    desc: "Start a ledger for a trip, home, or event and invite the people you're splitting with.",
  },
  {
    step: "02",
    title: "Add expenses",
    desc: "Log what was spent, who paid, and how it should be split across the group.",
  },
  {
    step: "03",
    title: "Track balances",
    desc: "Splitlyy keeps a running tally of who owes who as new expenses come in.",
  },
  {
    step: "04",
    title: "Settle up",
    desc: "Pay each other back and mark it settled — everyone stays in sync automatically.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <header className="border-b-2 border-dashed border-moss/20 bg-cream/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display text-xl tracking-tight text-ink">
            Splitlyy<span className="text-moss">.</span>
          </span>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 1. Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
        <p className="inline-block text-xs uppercase tracking-widest text-moss bg-sage-light border-2 border-dashed border-moss/30 rounded-full px-4 py-1.5 mb-6 animate-pop-in">
          Split expenses, not friendships
        </p>
        <h1 className="font-display text-4xl sm:text-6xl leading-tight text-ink mb-6 animate-pop-in">
          Share expenses.
          <br />
          <span className="text-moss">Stay square.</span>
        </h1>
        <p className="text-ink-soft text-lg max-w-xl mx-auto mb-10 animate-pop-in">
          Splitlyy keeps track of shared bills with friends, roommates, and
          travel groups — so nobody has to remember who owes what.
        </p>
        <div className="flex items-center justify-center gap-4 animate-pop-in">
          <Link to="/signup">
            <Button variant="primary" size="lg">
              Create your ledger →
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg">
              I have an account
            </Button>
          </Link>
        </div>

        <div className="mt-16 flex justify-center animate-float">
          <Card className="p-6 max-w-sm w-full text-left shadow-xl shadow-moss/5">
            <p className="text-xs uppercase tracking-widest text-ink-soft mb-3">
              Goa Trip
            </p>
            <div className="flex justify-between text-sm py-2 border-b border-dashed border-moss/15">
              <span className="text-ink">Hotel booking</span>
              <span className="font-mono text-ink">₹8,400</span>
            </div>
            <div className="flex justify-between text-sm py-2 border-b border-dashed border-moss/15">
              <span className="text-ink">Dinner at the beach shack</span>
              <span className="font-mono text-ink">₹2,150</span>
            </div>
            <div className="flex justify-between text-sm pt-3">
              <span className="text-ink-soft">You are owed</span>
              <span className="font-mono amount-positive">₹3,275</span>
            </div>
          </Card>
        </div>
      </section>

      {/* 2. Features */}
      <section className="bg-white border-y-2 border-dashed border-moss/15">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-moss mb-2">
              Features
            </p>
            <h2 className="font-display text-3xl sm:text-4xl text-ink">
              Everything you need to split fairly
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <Card
                key={f.title}
                className="p-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-moss/10 hover:border-moss/50"
              >
                <div className="w-11 h-11 rounded-full bg-sage-light flex items-center justify-center text-xl mb-4">
                  {f.icon}
                </div>
                <h3 className="font-display text-lg text-ink mb-1.5">
                  {f.title}
                </h3>
                <p className="text-sm text-ink-soft leading-relaxed">
                  {f.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 3. How it works */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest text-moss mb-2">
            How it works
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-ink">
            Four steps to a settled group
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s) => (
            <div key={s.step} className="relative">
              <span className="font-display text-4xl text-moss/25">
                {s.step}
              </span>
              <h3 className="font-display text-lg text-ink mt-2 mb-1.5">
                {s.title}
              </h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. CTA */}
      <section className="bg-moss">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
            Ready to stop doing the maths?
          </h2>
          <p className="text-sage-light/90 mb-8 max-w-md mx-auto">
            Create a free account and start splitting expenses with your
            group in minutes.
          </p>
          <Link to="/signup">
            <Button
              variant="secondary"
              size="lg"
              className="!bg-white !text-moss !border-white hover:!bg-sage-light"
            >
              Get started for free
            </Button>
          </Link>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="bg-ink text-cream/80">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="grid sm:grid-cols-4 gap-10 mb-10">
            <div className="sm:col-span-2">
              <span className="font-display text-xl text-white">
                Splitlyy<span className="text-sage">.</span>
              </span>
              <p className="text-sm text-cream/60 mt-3 max-w-xs">
                The simplest way to split bills and settle up with the
                people you share expenses with.
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-cream/50 mb-3">
                Product
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/signup" className="hover:text-sage transition-colors">
                    Get started
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-sage transition-colors">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-cream/50 mb-3">
                Follow us
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-sage transition-colors"
                  >
                    Twitter / X
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-sage transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-sage transition-colors"
                  >
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-sage transition-colors"
                  >
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-dashed border-cream/15 pt-6 text-xs text-cream/40 flex flex-col sm:flex-row justify-between gap-2">
            <span>© {new Date().getFullYear()} Splitlyy. All rights reserved.</span>
            <span>Made for splitting bills, not friendships.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
