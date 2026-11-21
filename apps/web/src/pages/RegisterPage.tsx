import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { UserPlus, Loader2 } from "lucide-react";

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await register({
        fullName,
        email,
        password,
        role: "CITIZEN",
      });
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main id="main-content" className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Citizen Registration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create an account to track your complaints and receive SMS/email updates
          </p>
        </div>

        {error && (
          <div
            id="reg-error"
            role="alert"
            aria-live="assertive"
            className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 dark:text-red-300 rounded text-xs"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-sm font-semibold mb-1">
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Anand Kumar"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm"
              aria-invalid={!!error}
              aria-describedby={error ? "reg-error" : undefined}
              required
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-semibold mb-1">
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="anand@example.com"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm"
              aria-invalid={!!error}
              aria-describedby={error ? "reg-error" : undefined}
              required
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-semibold mb-1">
              Password (min 6 characters)
            </label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-sm"
              minLength={6}
              aria-invalid={!!error}
              aria-describedby={error ? "reg-error" : undefined}
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
              <UserPlus className="w-4 h-4" />
            )}
            <span>Register Account</span>
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-primary-600 hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </main>
  );
};
