import { useEffect, useRef } from 'react';
import { ArrowUp, Clock3, MessageSquare, ShieldCheck, ExternalLink } from 'lucide-react';
import CodeBlock from './CodeBlock.jsx';
import { useCountdown } from './Countdown.jsx';

export default function PostCard({ post, onOpen, onUpvote, onToast, onExpired }) {
  const countdown = useCountdown(post.expiresAt, post.isExpired);
  const notified = useRef(false);
  const expired = countdown.isExpired;

  useEffect(() => {
    if (expired && !post.isExpired && !notified.current) {
      notified.current = true;
      onExpired?.();
    }
  }, [expired, post.isExpired, onExpired]);


  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(post.id)}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onOpen(post.id);
        }
      }}
      className="group box-border w-full min-w-0 max-w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-800 dark:bg-[#111827] dark:hover:border-slate-700 sm:p-5 sm:overflow-visible"
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:flex-nowrap sm:gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {expired ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 font-label text-[9px] font-medium tracking-[0.12em] text-slate-500 dark:bg-slate-800 dark:text-slate-400">EXPIRED</span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 font-label text-[9px] font-medium tracking-[0.12em] text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> LIVE</span>
          )}
          {post.isResolved && <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 font-label text-[9px] tracking-[0.1em] text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"><ShieldCheck size={10} /> RESOLVED</span>}
        </div>
        <div className={`inline-flex items-center gap-1.5 text-[10px] ${expired ? 'text-slate-400 dark:text-slate-500' : 'text-orange-600 dark:text-orange-300'}`}>
          <Clock3 size={12} /><span className="font-label tabular-nums">{countdown.label}</span>
        </div>
      </div>

      <div className="mt-4">
        <h2 className="mt-2 line-clamp-3 min-h-[60px] break-words text-[13px] leading-[1.65] text-slate-500 dark:text-slate-400">{post.title}</h2>
        <p className="mt-2 line-clamp-3 min-h-[60px] text-[13px] leading-[1.65] text-slate-500 dark:text-slate-400">{post.description}</p>
      </div>

      {post.codeSnippet && (
  <div
    className="mt-4 min-w-0 max-w-full overflow-hidden"
    onClick={(event) => event.stopPropagation()}
  >
    <CodeBlock
      code={post.codeSnippet}
      language={post.codeLanguage}
      compact
      onToast={onToast}
    />
  </div>
)}

      <div className="mt-4 flex min-h-6 flex-wrap items-center gap-1.5">
        {(post.tags || []).map((tag) => <span key={tag} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">{tag}</span>)}
        {post.liveUrl && <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400"><ExternalLink size={10} /> Demo</span>}
      </div>

      <div <div className="mt-4 flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <span className="max-w-[140px] truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">{post.author?.label || 'Anonymous Dev'}</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500"><MessageSquare size={13} />{post.commentsCount || 0}</span>
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onUpvote(post.id); }}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition focus:outline-none focus:ring-2 focus:ring-orange-400 ${post.hasUpvoted ? 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/70 dark:bg-orange-950/50 dark:text-orange-300' : 'border-slate-200 bg-white text-slate-500 hover:border-orange-200 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-orange-900 dark:hover:text-orange-300'}`}
            aria-label={`${post.hasUpvoted ? 'Remove upvote from' : 'Upvote'} ${post.title}`}
          ><ArrowUp size={13} />{post.upvoteCount || 0}</button>
        </div>
      </div>
    </article>
  );
}
