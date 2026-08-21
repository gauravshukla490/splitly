import { useState, FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { resetPassword } from "../lib/auth-api";
import { ApiError } from "../lib/api";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";
import { ReceiptCard } from "../components/ui/card";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { userId?: string } | null;

  const [userId, setUserId] = useState(state?.userId || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword({ userId, code, newPassword });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-xs uppercase tracking-widest text-ink-soft mb-2">
          New password
        </p>
        <h1 className="text-3xl mb-6">Set a new password</h1>

        <ReceiptCard>
          {success ? (
            <Alert variant="success">Password reset. Redirecting to sign in…</Alert>
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
                className="tracking-[0.5em] font-mono text-lg text-center"
                required
              />
              <Input
                label="New password"
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Reset password"}
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