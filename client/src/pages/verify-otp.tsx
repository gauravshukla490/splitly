import { useState, FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { verifyOtp } from "../lib/auth-api";
import { ApiError } from "../lib/api";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";
import { ReceiptCard } from "../components/ui/card";

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { userId?: string; email?: string } | null;

  const [userId, setUserId] = useState(state?.userId || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyOtp({ userId, code });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">
          Verification
        </p>
        <h1 className="text-3xl mb-2">Check your inbox</h1>
        <p className="text-sm text-ink-soft mb-6">
          {state?.email
            ? `We sent a 6-digit code to ${state.email}.`
            : "Enter the 6-digit code you were sent, along with your user ID."}
        </p>

        <ReceiptCard>
          {success ? (
            <Alert variant="success">Account verified. Redirecting to sign in…</Alert>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && <Alert>{error}</Alert>}
              {!state?.userId && (
                <Input
                  label="User ID"
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                />
              )}
              <Input
                label="6-digit code"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                inputMode="numeric"
                className="tracking-[0.5em] font-mono text-lg text-center"
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Verifying…" : "Verify account"}
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