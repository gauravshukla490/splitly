
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { logout as logoutApi } from "../lib/auth-api";
import { Button } from "./ui/button";

export function Navbar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
      navigate("/login");
    }
  };

  return (
    <header className="border-b border-paper-line">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-display text-xl tracking-tight text-ink">
          Splitlyy<span className="text-moss">.</span>
        </Link>
        {user && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-ink-soft">{user.name}</span>
            <Button variant="ghost" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}