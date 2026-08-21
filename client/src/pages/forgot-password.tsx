import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { forgotPassword } from "../lib/auth-api";
import { ApiError } from "../lib/api";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";
import { ReceiptCard } from "../components/ui/card";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await forgotPassword({ identifier });
      setSent(true);
      // Backend returns userId only when the account actually exists —
      // pass it along so the reset page doesn't need the user to hunt for it.
      if (res.userId) {
        setTimeout(() => {
          navigate("/reset-password", { state: { userId: res.userId } });
        }, 1200);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">
          Reset access
        </p>
        <h1 className="text-3xl mb-6">Forgot your password?</h1>

        <ReceiptCard>
          {sent ? (
            <Alert variant="success">
              If an account exists, a code has been sent.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && <Alert>{error}</Alert>}
              <Input
                label="Email or phone"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Sending…" : "Send reset code"}
              </Button>
            </form>
          )}
        </ReceiptCard>

        <p className="text-sm text-ink-soft mt-6 text-center">
          <Link to="/login" className="text-ink underline decoration-dotted">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}