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
    <header className="border-b-2 border-dashed border-moss/20 bg-cream/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          to={user ? "/dashboard" : "/"}
          className="font-display text-xl tracking-tight text-ink"
        >
          Splitlyy<span className="text-moss">.</span>
        </Link>
        {user && (
          <div className="flex items-center gap-4 text-sm">
            <Link to="/dashboard" className="text-ink-soft hover:text-moss">Dashboard</Link>
            <Link to="/contacts" className="text-ink-soft hover:text-moss">Contacts</Link>
            <Link to="/expenses/new" className="text-ink-soft hover:text-moss">Add expense</Link>
            <span className="text-ink">{user.name}</span>
            <Button variant="ghost" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
