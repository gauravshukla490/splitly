import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../lib/auth-api";
import { ApiError } from "../lib/api";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";
import { ReceiptCard } from "../components/ui/card";

export function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signup({ name, email, password });
      // Carry the userId forward so the verify-otp page knows who to verify
      navigate("/verify-otp", { state: { userId: res.userId, email } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">
          New account
        </p>
        <h1 className="text-3xl mb-6">Open a ledger</h1>

        <ReceiptCard>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && <Alert>{error}</Alert>}
            <Input
              label="Name"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>
        </ReceiptCard>

        <p className="text-sm text-ink-soft mt-6 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-ink underline decoration-dotted">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}