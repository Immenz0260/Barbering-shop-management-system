import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { Scissors } from "lucide-react";
import loginImage from "../assets/login.jpg";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ new_password: "", confirm_password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const serif = { fontFamily: "'Playfair Display', serif" };

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new one.");
    }
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/users/reset-password", {
        token,
        new_password: form.new_password,
      });
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block relative">
        <img src={loginImage} alt="Barbershop" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/60" />
      </div>

      <div className="flex items-center justify-center px-6 py-24 bg-background">
        <div className="max-w-sm w-full">
          <p className="text-primary text-xs tracking-[0.3em] uppercase mb-3">Reset Password</p>
          <h1 style={serif} className="text-4xl font-semibold mb-3">New Password</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-muted-foreground tracking-[0.15em] uppercase mb-2">
                New Password
              </label>
              <input
                type="password"
                required
                value={form.new_password}
                onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-card border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground tracking-[0.15em] uppercase mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={form.confirm_password}
                onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-card border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {message && <p className="text-green-400">{message}</p>}
            {error && <p className="text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full py-4 bg-primary text-primary-foreground text-xs tracking-[0.25em] uppercase hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">Back to Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;