import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  X,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { api, TOKEN_KEY_NAME } from "../lib/api.js";

export default function AuthModal({
  mode,
  onClose,
  onAuthenticated,
  onModeChange,
}) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("auth");
  const [resetSent, setResetSent] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const isRegister = mode === "register";

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setResendMessage("");
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResendMessage("");
    setPendingVerification(false);

    try {
      const result = await api.post(
        `/auth/${isRegister ? "register" : "login"}`,
        {
          ...(isRegister ? { username: form.username } : {}),
          email: form.email,
          password: form.password,
        },
      );

      if (isRegister) {
        setVerificationEmail(form.email.trim().toLowerCase());
        setVerificationSent(true);
        return;
      }

      if (result.token) {
        window.localStorage.setItem(TOKEN_KEY_NAME, result.token);
      }

      onAuthenticated(result);
    } catch (requestError) {
      setError(requestError.message);
      const message = String(requestError.message || "").toLowerCase();
      if (isRegister && message.includes("pending")) {
        setVerificationEmail(form.email.trim().toLowerCase());
        setPendingVerification(true);
      }
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    setBusy(true);
    setError("");

    try {
      await api.post("/auth/resend-verification", {
        email: verificationEmail,
      });

      setError(
        "If an unverified account exists, a new verification email will be sent.",
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  async function resendExistingVerification() {
    const email = (verificationEmail || form.email).trim().toLowerCase();

    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    setBusy(true);
    setError("");
    setResendMessage("");

    try {
      await api.post("/auth/resend-verification", { email });
      setVerificationEmail(email);
      setResendMessage(
        "If an unverified account exists, a new verification email has been sent. Check your inbox and spam folder.",
      );
      setPendingVerification(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitForgotPassword(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await api.post("/auth/forgot-password", {
        email: form.email,
      });

      setResetSent(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function openForgotPassword() {
    setView("forgot");
    setResetSent(false);
    setError("");
  }

  function backToLogin() {
    setView("auth");
    setResetSent(false);
    setVerificationSent(false);
    setVerificationEmail("");
    setPendingVerification(false);
    setResendMessage("");
    setError("");
    onModeChange("login");
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="relative my-auto w-full max-w-[430px] animate-slide-up rounded-2xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-800 dark:bg-[#111827] sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
          {view === "forgot" ? <Mail size={22} /> : <ShieldCheck size={22} />}
        </div>

        <p className="mb-2 font-label text-[10px] uppercase tracking-[0.2em] text-orange-500">
          Your code. Your call.
        </p>

        {/* FORGOT PASSWORD */}
        {view === "forgot" ? (
          <>
            <h2
              id="auth-title"
              className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white"
            >
              Forgot your password?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Enter your registered email address. We'll send you a link to
              reset your password.
            </p>

            {resetSent ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                  If an account exists with that email, a password-reset link
                  will be sent. Please check your inbox and spam folder.
                </div>

                <button
                  type="button"
                  onClick={backToLogin}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white transition hover:bg-orange-600"
                >
                  <ArrowLeft size={16} />
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={submitForgotPassword} className="mt-6 space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Email address
                  </span>

                  <input
                    required
                    type="email"
                    maxLength={254}
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => update("email", event.target.value)}
                    placeholder="you@example.com"
                    className="form-input"
                  />
                </label>

                {error && (
                  <div className="space-y-2">
                    <p
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium leading-5 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
                      role="alert"
                    >
                      {error}
                    </p>

                    {!isRegister &&
                      error.toLowerCase().includes("verify your email") && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={resendExistingVerification}
                          className="text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 disabled:opacity-50"
                        >
                          {busy ? "Sending..." : "Resend verification email"}
                        </button>
                      )}
                  </div>
                )}

                <button
                  disabled={busy}
                  type="submit"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? "Sending..." : "Send reset link"}
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={backToLogin}
                  className="flex w-full items-center justify-center gap-2 py-2 text-xs font-bold text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"
                >
                  <ArrowLeft size={14} />
                  Back to sign in
                </button>
              </form>
            )}
          </>
        ) : /* EMAIL VERIFICATION */
        verificationSent ? (
          <>
            <h2
              id="auth-title"
              className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white"
            >
              Verify your email
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              We've sent a verification link to{" "}
              <strong className="text-slate-800 dark:text-white">
                {verificationEmail}
              </strong>
              . Open your inbox and click the link to activate your account.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                Please verify your email.
              </div>

              {error && (
                <p
                  className="text-xs leading-5 text-slate-500 dark:text-slate-400"
                  role="status"
                >
                  {error}
                </p>
              )}

              <button
                type="button"
                disabled={busy}
                onClick={resendVerification}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-orange-500 text-sm font-bold text-orange-600 transition hover:bg-orange-50 disabled:opacity-60 dark:text-orange-400 dark:hover:bg-orange-500/10"
              >
                {busy ? "Sending..." : "Resend verification email"}
              </button>

              <button
                type="button"
                onClick={backToLogin}
                className="flex w-full items-center justify-center gap-2 py-2 text-xs font-bold text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </button>
            </div>
          </>
        ) : (
          /* LOGIN AND REGISTER */
          <>
            <h2
              id="auth-title"
              className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white"
            >
              {isRegister ? "Create your account" : "Welcome back"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {isRegister
                ? "Join the feedback loop. Share your code and get sharper."
                : "Sign in to post, vote, and resolve feedback."}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {isRegister && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Username
                  </span>

                  <input
                    required
                    minLength={3}
                    maxLength={30}
                    autoComplete="username"
                    value={form.username}
                    onChange={(event) => update("username", event.target.value)}
                    placeholder="e.g. julia_codes"
                    className="form-input"
                  />
                </label>
              )}

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email address
                </span>

                <input
                  required
                  type="email"
                  maxLength={254}
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  placeholder="you@example.com"
                  className="form-input"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
                </span>

                <div className="relative">
                  <input
                    required
                    minLength={8}
                    maxLength={128}
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      isRegister ? "new-password" : "current-password"
                    }
                    value={form.password}
                    onChange={(event) => update("password", event.target.value)}
                    placeholder="At least 8 characters"
                    className="form-input pr-11"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              {!isRegister && (
                <div className="-mt-1 text-right">
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {error && (
                <div className="space-y-2">
                  <p
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium leading-5 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
                    role="alert"
                  >
                    {error}
                  </p>

                  {isRegister && pendingVerification && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={resendExistingVerification}
                      className="flex h-11 w-full items-center justify-center rounded-xl border border-orange-500 text-sm font-bold text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-orange-400 dark:hover:bg-orange-500/10"
                    >
                      {busy ? "Sending..." : "Resend verification email"}
                    </button>
                  )}
                </div>
              )}

              {resendMessage && (
                <p
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium leading-5 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                  role="status"
                >
                  {resendMessage}
                </p>
              )}

              <button
                disabled={busy}
                type="submit"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy
                  ? "Please wait..."
                  : isRegister
                    ? "Create account"
                    : "Sign in"}
                <ArrowRight size={16} />
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
              {isRegister ? "Already have an account?" : "New to StackRoast?"}{" "}
              <button
                type="button"
                onClick={() => onModeChange(isRegister ? "login" : "register")}
                className="font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
              >
                {isRegister ? "Sign in" : "Create an account"}
              </button>
            </p>
          </>
        )}
      </section>
    </div>
  );
}
