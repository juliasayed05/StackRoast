import { useMemo, useState } from 'react';
import hljs from 'highlight.js/lib/common';
import { Check, Copy } from 'lucide-react';

const LANGUAGE_MAP = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  sql: 'sql',
  'html-css': 'xml',
  java: 'java',
};

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character]);
}

export default function CodeBlock({ code, language = 'javascript', compact = false, onToast }) {
  const [copied, setCopied] = useState(false);
  const highlighted = useMemo(() => {
    if (!code) return '';
    const targetLanguage = LANGUAGE_MAP[language] || 'javascript';
    try {
      return hljs.highlight(code, { language: targetLanguage }).value;
    } catch {
      return escapeHtml(code);
    }
  }, [code, language]);

  async function copyCode(event) {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onToast?.('Copied to clipboard', 'success');
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      onToast?.('Clipboard access was blocked by this browser.', 'error');
    }
  }

  if (!code) return null;
  return (
    <div className={`group relative overflow-hidden rounded-xl border border-slate-200 bg-[#101827] dark:border-slate-700/80 ${compact ? 'max-h-40' : ''}`}>
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="font-label text-[10px] uppercase tracking-[0.14em] text-slate-400">{language.replace('-', ' / ')}</span>
        <button type="button" onClick={copyCode} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-400" aria-label="Copy code">
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </div>
      <pre className={`custom-scrollbar overflow-x-auto px-4 py-3 font-mono text-[11px] leading-[1.7] text-slate-100 ${compact ? 'max-h-28' : 'max-h-[420px]'}`}><code className="hljs" dangerouslySetInnerHTML={{ __html: highlighted }} /></pre>
    </div>
  );
}
