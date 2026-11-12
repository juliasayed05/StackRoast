import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';
import { api } from '../lib/api.js';

export default function AuthModal({ mode, onClose, onAuthenticated, onModeChange }) {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isRegister = mode === 'register';

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api.post(`/auth/${isRegister ? 'register' : 'login'}`, {
        ...(isRegister ? { username: form.username } : {}),
        email: form.email,
        password: form.password,
      });
      onAuthenticated(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="relative my-auto w-full max-w-[430px] animate-slide-up rounded-2xl border border-slate-200 bg-white p-6 shadow-panel dark:border-slate-800 dark:bg-[#111827] sm:p-8" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white" aria-label="Close sign in dialog"><X size={18} /></button>
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400"><ShieldCheck size={22} /></div>
        <p className="mb-2 font-label text-[10px] uppercase tracking-[0.2em] text-orange-500">Your code. Your call.</p>
        <h2 id="auth-title" className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{isRegister ? 'Create your account' : 'Welcome back'}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{isRegister ? 'Join the feedback loop. Share your code and get sharper.' : 'Sign in to post, vote, and resolve feedback.'}</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {isRegister && (
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Username</span>
              <input required minLength={3} maxLength={30} autoComplete="username" value={form.username} onChange={(event) => update('username', event.target.value)} placeholder="e.g. julia_codes" className="form-input" />
            </label>
          )}
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Email address</span>
            <input required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="you@example.com" className="form-input" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</span>
            <div className="relative">
              <input required minLength={8} maxLength={128} type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} value={form.password} onChange={(event) => update('password', event.target.value)} placeholder="At least 8 characters" className="form-input pr-11" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </label>
          {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium leading-5 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300" role="alert">{error}</p>}
          <button disabled={busy} type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={16} />
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          {isRegister ? 'Already have an account?' : 'New to StackRoast?'}{' '}
          <button type="button" onClick={() => onModeChange(isRegister ? 'login' : 'register')} className="font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300">{isRegister ? 'Sign in' : 'Create an account'}</button>
        </p>
      </section>
    </div>
  );
}
