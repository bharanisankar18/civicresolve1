import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LogIn, Loader2, Shield } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await login({ email, password });
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = (role: "ADMIN" | "CITIZEN") => {
    if (role === "ADMIN") {
      setEmail("admin@civicresolve.gov.in");
      setPassword("Admin@123");
    } else {
      setEmail("citizen@civicresolve.org");
      setPassword("Citizen@123");
    }
  };

  return (
    <main id="main-content" className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-600 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Sign In to CivicResolve
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access citizen tracking or municipal officer triage
          </p>
        </div>

        {/* Quick Demo Pre-fill Buttons */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Demo 1-Click Credentials
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("ADMIN")}
              className="py-1.5 px-2 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded text-xs font-semibold text-primary-600"
            >
              Fill City Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("CITIZEN")}
              className="py-1.5 px-2 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded text-xs font-semibold text-emerald-600"
            >
              Fill Citizen
            </button>
          </div>
        </div>

        {error && (
          <div
            id="login-error"
            role="alert"
            aria-live="assertive"
            className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 dark:text-red-300 rounded text-xs"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold mb-1">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm"
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold mb-1">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm"
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-touch py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>Sign In</span>
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-primary-600 hover:underline">
            Register as a Citizen
          </Link>
        </p>
      </div>
    </main>
  );
};
