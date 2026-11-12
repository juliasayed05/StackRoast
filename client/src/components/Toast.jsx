import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const styles = {
  success: { icon: CheckCircle2, classes: 'border-emerald-200 dark:border-emerald-900/70 text-emerald-700 dark:text-emerald-300' },
  error: { icon: AlertCircle, classes: 'border-rose-200 dark:border-rose-900/70 text-rose-700 dark:text-rose-300' },
  info: { icon: Info, classes: 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200' },
};

export default function Toast({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(92vw,380px)] flex-col gap-2">
      {toasts.map((toast) => {
        const config = styles[toast.type] || styles.info;
        const Icon = config.icon;
        return (
          <div key={toast.id} className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-white/95 px-4 py-3 shadow-panel backdrop-blur dark:bg-slate-900/95 ${config.classes} animate-slide-up`} role="status">
            <Icon size={17} className="mt-0.5 shrink-0" />
            <p className="text-sm font-medium leading-5 text-slate-800 dark:text-slate-100">{toast.message}</p>
          </div>
        );
      })}
    </div>
  );
}
