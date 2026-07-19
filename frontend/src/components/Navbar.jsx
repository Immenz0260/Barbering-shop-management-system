import { useState } from "react";
import { Scissors, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <Scissors size={20} className="text-primary" />
          <span
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-2xl font-semibold tracking-wider text-foreground"
          >
            ESARPS PREMIUM CUTS
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className="text-base tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <Link
            to="/booking"
            className="px-6 py-2.5 bg-primary text-primary-foreground text-base tracking-[0.2em] uppercase hover:opacity-90 transition-opacity"
          >
            Book Now
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              {["owner", "barber"].includes(user.role) && (
                <Link
                  to="/dashboard"
                  className="text-base text-muted-foreground tracking-[0.2em] uppercase hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
              )}
              <span className="text-xs tracking-[0.2em] uppercase text-primary">
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="text-base text-muted-foreground tracking-[0.2em] uppercase hover:text-foreground transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-base text-muted-foreground tracking-[0.2em] uppercase hover:text-foreground transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="text-base text-muted-foreground tracking-[0.2em] uppercase hover:text-foreground transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background px-6 py-5 flex flex-col gap-5">
          <Link to="/" onClick={() => setOpen(false)} className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
            Home
          </Link>
          <Link to="/booking" onClick={() => setOpen(false)} className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
            Book Now 
          </Link>

          {isAuthenticated ? (
             <>
              {["owner", "barber"].includes(user.role) && (
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="text-xs tracking-[0.2em] uppercase text-muted-foreground"
                >
                  Dashboard
                </Link>
              )}
            <button
              onClick={() => { setOpen(false); handleLogout(); }}
              className="text-xs tracking-[0.2em] uppercase text-muted-foreground text-left"
            >
              Logout ({user.role})
            </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                Login
              </Link>
              <Link to="/signup" onClick={() => setOpen(false)} className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;