import { useState } from "react";
import { Scissors, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <Scissors size={25} className="text-primary" />
          <span
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-4xl font-semibold tracking-wider text-foreground"
          >
            ESARPS
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className="text-xl tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <Link
            to="/booking"
            className="px-6 py-2.5 bg-primary text-primary-foreground text-xl tracking-[0.2em] uppercase hover:opacity-90 transition-opacity"
          >
            Book Now
          </Link>
          <Link
            to="/login"
            className="text-xl text-muted-foreground tracking-[0.2em] uppercase hover:text-foreground transition-colors"
          >
            Login
          </Link>
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
          <Link to="/login" onClick={() => setOpen(false)} className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
            Login
          </Link>
        </div>
      )}
    </nav>
  );
}

export default Navbar;