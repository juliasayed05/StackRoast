import { useState } from "react";
import { CheckCircle2, XCircle, LoaderCircle, Mail } from "lucide-react";
import { api, TOKEN_KEY_NAME } from "../lib/api.js";

export default function VerifyEmailPage() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const [status, setStatus] = useState("ready");
  const [message, setMessage] = useState(
    "Click below to verify your email address.",
  );

  async function handleVerification() {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing or invalid.");
      return;
    }

    try {
      setStatus("loading");
      setMessage("Please wait while we verify your email...");

      const result = await api.post("/auth/verify-email", {
        token,
      });

      if (!result.token || !result.user) {
        throw new Error(
          "Email verified, but automatic login could not be completed.",
        );
      }

      // Save JWT for persistent login.
      window.localStorage.setItem(TOKEN_KEY_NAME, result.token);

      setStatus("success");
      setMessage(
        "Your email has been verified successfully. You are now logged in!",
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error?.response?.data?.message ||
          error.message ||
          "Email verification failed. Please request a new link.",
      );
    }
  }

  function continueToStackRoast() {
    window.location.replace("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-[#080C14]">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-[#111827]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
          {status === "loading" && (
            <LoaderCircle size={32} className="animate-spin" />
          )}

          {status === "success" && (
            <CheckCircle2 size={32} className="text-emerald-500" />
          )}

          {status === "error" && (
            <XCircle size={32} className="text-rose-500" />
          )}

          {status === "ready" && <Mail size={32} />}
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-500">
          StackRoast
        </p>

        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {status === "ready"
            ? "Verify your email"
            : status === "loading"
              ? "Verifying your email"
              : status === "success"
                ? "Email verified!"
                : "Verification failed"}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {message}
        </p>

        {status === "success" && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            Your account is verified and your login session has been saved.
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            The link may have expired or already been used. You can request a
            new verification email.
          </div>
        )}

        {status === "ready" && (
          <button
            type="button"
            disabled={!token}
            onClick={handleVerification}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            Verify Email
          </button>
        )}

        {status === "loading" && (
          <button
            disabled
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500/70 text-sm font-bold text-white"
          >
            <LoaderCircle size={16} className="animate-spin" />
            Please wait...
          </button>
        )}

        {(status === "success" || status === "error" || !token) && (
          <button
            type="button"
            onClick={continueToStackRoast}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white transition hover:bg-orange-600"
          >
            {status === "success"
              ? "Continue to StackRoast"
              : "Back to StackRoast"}
          </button>
        )}
      </section>
    </main>
  );
}
