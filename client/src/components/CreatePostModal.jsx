import { useState } from 'react';
import { Code2, Plus, ShieldCheck, X } from 'lucide-react';
import { api } from '../lib/api.js';

const TAGS = ['React', 'Node.js', 'Python', 'Database', 'UI/UX', 'Architecture'];
const LANGUAGES = [
  ['javascript', 'JavaScript'], ['typescript', 'TypeScript'], ['python', 'Python'],
  ['sql', 'SQL'], ['html-css', 'HTML / CSS'], ['java', 'Java'],
];
const EXPIRIES = [
  ['1h', '1 Hour'], ['12h', '12 Hours'], ['24h', '24 Hours'], ['48h', '48 Hours'],
];

export default function CreatePostModal({ onClose, onCreated, onRequireAuth }) {
  const [form, setForm] = useState({
    title: '', description: '', codeSnippet: '', codeLanguage: 'javascript',
    liveUrl: '', expiry: '24h', tags: [], isAnonymous: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  }

  function toggleTag(tag) {
    setForm((current) => ({
      ...current,
      tags: current.tags.includes(tag) ? current.tags.filter((item) => item !== tag) : [...current.tags, tag],
    }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError('Add a title and a description before publishing.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await api.post('/posts', form);
      onCreated(result.post);
    } catch (requestError) {
      if (requestError.status === 401) onRequireAuth();
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-3 sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="my-auto flex max-h-[94vh] w-full max-w-[760px] animate-slide-up flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel dark:border-slate-800 dark:bg-[#111827]" role="dialog" aria-modal="true" aria-labelledby="create-post-title">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-7 sm:py-5">
          <div>
            <p className="mb-1 font-label text-[10px] uppercase tracking-[0.18em] text-orange-500">Fresh eyes, better code</p>
            <h2 id="create-post-title" className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Drop a new roast</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Share the context. The community brings the feedback.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white" aria-label="Close create post dialog"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="custom-scrollbar overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Title <span className="text-orange-500">*</span></span>
              <input required maxLength={120} value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="What should the community review?" className="form-input" />
              <span className="block text-right font-label text-[10px] text-slate-400">{form.title.length}/120</span>
            </label>
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Description <span className="text-orange-500">*</span></span>
              <textarea required maxLength={5000} rows={4} value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Explain what this code does, what you have tried, and where you want honest feedback..." className="form-input min-h-[110px] resize-y" />
            </label>
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="snippet" className="text-xs font-bold text-slate-700 dark:text-slate-300">Code snippet</label>
                <span className="inline-flex items-center gap-1 font-label text-[10px] text-slate-400"><Code2 size={12} /> MONOSPACE</span>
              </div>
              <textarea id="snippet" maxLength={30000} rows={7} spellCheck="false" value={form.codeSnippet} onChange={(event) => update('codeSnippet', event.target.value)} placeholder={'function makeItBetter() {\n  // Paste the code you want reviewed\n}'} className="form-input min-h-[150px] resize-y bg-slate-950 font-mono text-xs leading-6 text-slate-100 placeholder:text-slate-600 focus:border-orange-500 focus:ring-orange-500/10 dark:bg-[#0B0F19]" />
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Code language</span>
              <select value={form.codeLanguage} onChange={(event) => update('codeLanguage', event.target.value)} className="form-input">
                {LANGUAGES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Post lifespan</span>
              <select value={form.expiry} onChange={(event) => update('expiry', event.target.value)} className="form-input">
                {EXPIRIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Live URL <span className="font-normal text-slate-400">(optional)</span></span>
              <input type="url" maxLength={2048} value={form.liveUrl} onChange={(event) => update('liveUrl', event.target.value)} placeholder="https://your-demo.example" className="form-input" />
            </label>
            <div className="space-y-2 sm:col-span-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tech tags</span>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => {
                  const active = form.tags.includes(tag);
                  return <button key={tag} type="button" onClick={() => toggleTag(tag)} aria-pressed={active} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${active ? 'border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-300' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600'}`}>{tag}</button>;
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 dark:bg-slate-800 dark:text-slate-300"><ShieldCheck size={16} /></span>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Post anonymously</p>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">Your username stays hidden. You can still manage your post.</p>
              </div>
            </div>
            <button type="button" role="switch" aria-checked={form.isAnonymous} onClick={() => update('isAnonymous', !form.isAnonymous)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${form.isAnonymous ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${form.isAnonymous ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          {error && <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300" role="alert">{error}</p>}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
            <button disabled={busy} type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"><Plus size={16} />{busy ? 'Publishing...' : 'Publish roast'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
