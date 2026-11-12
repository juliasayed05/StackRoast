import { useEffect, useState } from 'react';
import { ArrowUp, CheckCircle2, Clock3, ExternalLink, MessageSquare, Send, ShieldCheck, Trash2, X } from 'lucide-react';
import { api } from '../lib/api.js';
import CodeBlock from './CodeBlock.jsx';
import { useCountdown } from './Countdown.jsx';

const FEEDBACK_TYPES = ['Brutal Roast', 'Constructive Fix', 'Security Warning', 'Performance Tip'];
const feedbackStyles = {
  'Brutal Roast': 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
  'Constructive Fix': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  'Security Warning': 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  'Performance Tip': 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
};

function dateLabel(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function PostDetailModal({ postId, user, onClose, onRequireAuth, onToast, onChanged, onDeleted }) {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackType, setFeedbackType] = useState('Constructive Fix');
  const [content, setContent] = useState('');
  const [codeSuggestion, setCodeSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const countdown = useCountdown(post?.expiresAt || new Date().toISOString(), post?.isExpired || false);
  const expired = Boolean(post && countdown.isExpired);

  async function loadDetail() {
    setLoading(true);
    setError('');
    try {
      const result = await api.get(`/posts/${postId}`);
      setPost(result.post);
      setComments(result.comments || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDetail(); }, [postId]);

  async function submitComment(event) {
    event.preventDefault();
    if (!user) { onRequireAuth(); return; }
    if (expired) return;
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const result = await api.post(`/posts/${postId}/comments`, { feedbackType, content, codeSuggestion });
      setComments((current) => [...current, result.comment]);
      setContent('');
      setCodeSuggestion('');
      onToast('Feedback posted', 'success');
      onChanged?.();
    } catch (requestError) {
      if (requestError.status === 401) onRequireAuth();
      onToast(requestError.message, 'error');
      if (requestError.status === 409) loadDetail();
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePostVote() {
    if (!user) { onRequireAuth(); return; }
    try {
      await api.patch(`/posts/${postId}/upvote`);
      await loadDetail();
      onChanged?.();
    } catch (requestError) {
      if (requestError.status === 401) onRequireAuth();
      onToast(requestError.message, 'error');
    }
  }

  async function toggleCommentVote(commentId) {
    if (!user) { onRequireAuth(); return; }
    try {
      const result = await api.patch(`/comments/${commentId}/upvote`);
      setComments((current) => current.map((comment) => comment.id === commentId
        ? { ...comment, upvoteCount: result.upvoteCount, hasUpvoted: result.hasUpvoted }
        : comment));
    } catch (requestError) {
      if (requestError.status === 401) onRequireAuth();
      onToast(requestError.message, 'error');
    }
  }

  async function toggleResolved() {
    if (!post?.isOwner || actionBusy) return;
    setActionBusy(true);
    try {
      const result = await api.patch(`/posts/${postId}/resolve`);
      setPost((current) => ({ ...current, isResolved: result.isResolved }));
      onToast(result.isResolved ? 'Marked as resolved' : 'Resolution reopened', 'success');
      onChanged?.();
    } catch (requestError) {
      onToast(requestError.message, 'error');
    } finally {
      setActionBusy(false);
    }
  }

  async function deletePost() {
    if (!post?.isOwner || actionBusy) return;
    const confirmed = window.confirm('Delete this roast and all of its comments? This cannot be undone.');
    if (!confirmed) return;
    setActionBusy(true);
    try {
      await api.delete(`/posts/${postId}`);
      onToast('Post deleted', 'success');
      onDeleted?.();
    } catch (requestError) {
      onToast(requestError.message, 'error');
      setActionBusy(false);
    }
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-[50] flex items-center justify-center overflow-y-auto p-2 sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="my-auto flex max-h-[96vh] w-full max-w-[920px] animate-slide-up flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel dark:border-slate-800 dark:bg-[#111827]" role="dialog" aria-modal="true" aria-labelledby="post-detail-title">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800 sm:px-7">
          <div className="flex items-center gap-2 font-label text-[10px] uppercase tracking-[0.16em] text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> Roast details</div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white" aria-label="Close post details"><X size={18} /></button>
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-400">Loading roast...</div>
        ) : error || !post ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-5 text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{error || 'This roast could not be found.'}</p>
            <button type="button" onClick={onClose} className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Close</button>
          </div>
        ) : (
          <div className="custom-scrollbar grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1.12fr_0.88fr]">
            <div className="border-b border-slate-100 p-5 dark:border-slate-800 lg:border-b-0 lg:border-r sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                {expired ? <span className="rounded-md bg-slate-100 px-2 py-1 font-label text-[9px] tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">EXPIRED</span> : <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 font-label text-[9px] tracking-wider text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> LIVE</span>}
                {post.isResolved && <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 font-label text-[9px] tracking-wider text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"><ShieldCheck size={10} /> RESOLVED</span>}
                <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-slate-400"><Clock3 size={12} /><span className="font-label tabular-nums">{countdown.label}</span></span>
              </div>
              <h1 id="post-detail-title" className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">{post.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-500 dark:text-slate-400">{post.author?.label || 'Anonymous Dev'}</span>
                <span>Posted {dateLabel(post.createdAt)}</span>
              </div>
              <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{post.description}</p>
              {post.liveUrl && <a href={post.liveUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-orange-700 dark:hover:text-orange-300"><ExternalLink size={14} /> Open live project</a>}
              {post.codeSnippet && <div className="mt-5"><CodeBlock code={post.codeSnippet} language={post.codeLanguage} onToast={onToast} /></div>}
              {post.tags?.length > 0 && <div className="mt-5 flex flex-wrap gap-1.5">{post.tags.map((tag) => <span key={tag} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">{tag}</span>)}</div>}

              <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button type="button" onClick={togglePostVote} className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition ${post.hasUpvoted ? 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300' : 'border-slate-200 text-slate-500 hover:border-orange-200 hover:text-orange-600 dark:border-slate-700 dark:text-slate-400 dark:hover:text-orange-300'}`}><ArrowUp size={14} /> {post.upvoteCount} upvotes</button>
                <span className="inline-flex h-9 items-center gap-2 px-2 text-xs text-slate-400"><MessageSquare size={14} /> {comments.length} replies</span>
                {post.isOwner && <div className="ml-auto flex flex-wrap gap-2">
                  <button type="button" disabled={actionBusy} onClick={toggleResolved} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-sky-200 px-3 text-xs font-bold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50 dark:border-sky-900 dark:text-sky-300 dark:hover:bg-sky-950/40"><CheckCircle2 size={13} /> {post.isResolved ? 'Reopen' : 'Mark resolved'}</button>
                  <button type="button" disabled={actionBusy} onClick={deletePost} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"><Trash2 size={13} /> Delete</button>
                </div>}
              </div>
            </div>

            <aside className="flex min-h-[420px] flex-col p-5 sm:p-7">
              <div className="mb-4 flex items-center justify-between">
                <div><p className="text-sm font-extrabold text-slate-900 dark:text-white">The roast room</p><p className="mt-0.5 text-[11px] text-slate-400">Good feedback makes good developers.</p></div>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-label text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">{comments.length.toString().padStart(2, '0')}</span>
              </div>

              <div className="space-y-3">
                {comments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-700">
                    <MessageSquare size={20} className="mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">No feedback yet</p>
                    <p className="mt-1 text-[11px] text-slate-400">Be the first to leave a useful review.</p>
                  </div>
                ) : comments.map((comment) => (
                  <article key={comment.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0"><span className={`inline-flex rounded-md px-2 py-1 text-[9px] font-bold ${feedbackStyles[comment.feedbackType] || 'bg-slate-100 text-slate-600'}`}>{comment.feedbackType}</span><p className="mt-2 text-[10px] font-semibold text-slate-400">{comment.author?.label || 'Anonymous Dev'} · {dateLabel(comment.createdAt)}</p></div>
                      <button type="button" onClick={() => toggleCommentVote(comment.id)} className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition ${comment.hasUpvoted ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300' : 'text-slate-400 hover:bg-slate-200 hover:text-orange-600 dark:hover:bg-slate-800 dark:hover:text-orange-300'}`} aria-label={`${comment.hasUpvoted ? 'Remove helpful vote' : 'Mark as helpful'} feedback` }><ArrowUp size={11} />{comment.upvoteCount}</button>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600 dark:text-slate-300">{comment.content}</p>
                    {comment.codeSuggestion && <pre className="custom-scrollbar mt-3 max-h-40 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-[10px] leading-5 text-slate-200"><code>{comment.codeSuggestion}</code></pre>}
                  </article>
                ))}
              </div>

              <div className="mt-auto pt-5">
                {expired ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">This roast has expired. Replies are locked.</div>
                ) : user ? (
                  <form onSubmit={submitComment} className="space-y-3 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
                    <div className="flex items-center justify-between"><label htmlFor="feedback-type" className="text-xs font-bold text-slate-700 dark:text-slate-200">Add your feedback</label><span className="font-label text-[9px] text-slate-400">ANONYMOUS BY DEFAULT</span></div>
                    <select id="feedback-type" value={feedbackType} onChange={(event) => setFeedbackType(event.target.value)} className="form-input h-9 text-xs">{FEEDBACK_TYPES.map((type) => <option key={type}>{type}</option>)}</select>
                    <textarea required maxLength={3000} rows={3} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Be specific. Be useful. Be honest." className="form-input min-h-[82px] resize-y text-xs" />
                    <textarea maxLength={12000} rows={2} value={codeSuggestion} onChange={(event) => setCodeSuggestion(event.target.value)} placeholder="Optional: show a code-level fix..." className="form-input resize-y font-mono text-[11px]" />
                    <button type="submit" disabled={submitting || !content.trim()} className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 text-xs font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"><Send size={13} />{submitting ? 'Sending...' : 'Post feedback'}</button>
                  </form>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60"><p className="text-xs font-bold text-slate-800 dark:text-slate-100">Have a useful review?</p><p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Sign in to share feedback and vote on helpful comments.</p><button type="button" onClick={onRequireAuth} className="mt-3 h-9 w-full rounded-lg bg-orange-500 text-xs font-bold text-white hover:bg-orange-600">Sign in to reply</button></div>
                )}
              </div>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}
