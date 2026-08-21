import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../lib/auth-api";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";
import { ReceiptCard } from "../components/ui/card";

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login({ identifier, password });
      setUser(res.user);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">
          Welcome back
        </p>
        <h1 className="text-3xl mb-6">Sign in to your ledger</h1>

        <ReceiptCard>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && <Alert>{error}</Alert>}
            <Input
              label="Email or phone"
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            <Input
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </ReceiptCard>

        <div className="flex justify-between text-sm text-ink-soft mt-6">
          <Link to="/signup" className="text-ink underline decoration-dotted">
            Create account
          </Link>
          <Link to="/forgot-password" className="underline decoration-dotted">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}