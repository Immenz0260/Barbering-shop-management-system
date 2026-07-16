import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Scissors } from "lucide-react"; // Make sure to import your Scissors icon component
import loginImage from "../assets/login.jpg"; // reusing the same shop photo as your Landing page hero

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams(); 

  // Defining the inline serif font style variable used in your snippet
  const serif = { fontFamily: "'Playfair Display', serif" };
  const redirectTo = searchParams.get("redirect") || "/";

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(redirectTo); 
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    // grid-cols-2 splits this into two equal-width columns side by side —
    // md: means it only does this on medium screens and up; on phones
    // (below md) it'll stack into a single column automatically.
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left column: photo, hidden on small screens (hidden md:block) */}
      <div className="hidden md:block relative">
        <img src={loginImage} alt="Barbershop" className="w-full h-full object-cover" />
        {/* object-cover: fills the box without stretching/distorting the image,
            cropping edges if needed to fit */}

        {/* Integrated Branding Block Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/60" />
        <div className="absolute bottom-16 left-12 right-12">
          <div className="flex items-center gap-2.5 mb-6">
            <Scissors size={18} className="text-primary" />
            <span style={serif} className="text-xl font-semibold tracking-wider">ESARPS PREMIUM CUTS</span>
          </div>
          <p style={serif} className="text-4xl font-semibold leading-tight text-foreground mb-4">
            Every great cut<br />starts with<br /><em>great craft.</em>
          </p>
          <div className="flex items-center gap-3 mt-6">
            <div className="w-8 h-px bg-primary" />
            <span className="text-xs text-muted-foreground tracking-[0.2em] uppercase">Your Portal</span>
          </div>
        </div>
      </div>

      {/* Right column: the actual form */}
      <div className="flex items-center justify-center px-6 py-24 bg-background">
        <div className="max-w-sm w-full">
          <p className="text-primary text-xs tracking-[0.3em] uppercase mb-3">
            Welcome Back
          </p>
          <h1
            style={serif}
            className="text-4xl font-semibold mb-3"
          >
            Log In
          </h1>
          <p className="text-muted-foreground text-sm mb-10">
            Access your bookings and account details.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-muted-foreground tracking-[0.15em] uppercase mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full bg-card border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground tracking-[0.15em] uppercase mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-card border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-primary-foreground text-xs tracking-[0.25em] uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Logging In..." : "Log In"}
            </button>
            
            {/* Forgot Password Link */}
            <div className="text-center mt-4">
              <Link 
                to="/forgot-password" 
                className="text-primary hover:underline text-sm"
              >
                Forgot Password?
              </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;