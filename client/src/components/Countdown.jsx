import { useEffect, useState } from 'react';

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export function useCountdown(expiresAt, alreadyExpired = false) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const expiryTime = new Date(expiresAt).getTime();
  const remaining = alreadyExpired || !Number.isFinite(expiryTime) ? 0 : Math.max(0, expiryTime - now);
  return { remaining, isExpired: alreadyExpired || remaining <= 0, label: formatCountdown(remaining) };
}

export default function Countdown({ expiresAt, isExpired = false, compact = false }) {
  const countdown = useCountdown(expiresAt, isExpired);
  return (
    <span className={`font-label tabular-nums ${compact ? 'text-[10px]' : 'text-xs'} ${countdown.isExpired ? 'text-slate-400 dark:text-slate-500' : 'text-orange-600 dark:text-orange-300'}`}>
      {countdown.label}
    </span>
  );
}
