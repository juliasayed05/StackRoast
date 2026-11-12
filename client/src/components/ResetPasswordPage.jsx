import { useState } from "react";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { api } from "../lib/api.js";

export default function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (!token || token.length !== 64) {
      setError("This password-reset link is invalid.");
      return;
    }

    if (password.length < 8 || password.length > 128) {
      setError("Password must be between 8 and 128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const result = await api.post("/auth/reset-password", {
        token,
        password,
      });

      setSuccess(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to reset password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-[#0B0F19]">
      <section className="w-full max-w-[430px] rounded-2xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-800 dark:bg-[#111827] sm:p-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
          {success ? <ShieldCheck size={23} /> : <LockKeyhole size={23} />}
        </div>

        <p className="mb-2 font-label text-[10px] uppercase tracking-[0.2em] text-orange-500">
          StackRoast Account Security
        </p>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {success ? "Password updated!" : "Create a new password"}
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {success
            ? "Your password has been changed successfully. You can now sign in."
            : "Choose a strong password to secure your StackRoast account."}
        </p>

        {success ? (
          <a
            href="/"
            className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white transition hover:bg-orange-600"
          >
            Back to StackRoast <ArrowRight size={16} />
          </a>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-4">
            {!token && (
              <p className="text-xs text-rose-600 dark:text-rose-300">
                No reset token was found in this link.
              </p>
            )}

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                New password
              </span>
              <div className="relative">
                <input
                  required
                  minLength={8}
                  maxLength={128}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className="form-input pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Confirm new password
              </span>
              <input
                required
                minLength={8}
                maxLength={128}
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Enter your password again"
                className="form-input"
              />
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
              >
                {error}
              </p>
            )}

            <button
              disabled={busy || !token}
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Updating password..." : "Reset password"}
              <ArrowRight size={16} />
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
