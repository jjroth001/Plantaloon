/** Calendar dates are local `YYYY-MM-DD` strings throughout, so time zones never shift them. */

export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** `YYYY-MM-DD` → `Date` at local midnight. */
export function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayString(now: Date = new Date()): string {
  return toLocalDateString(now);
}

export function dateOf(ms: number): string {
  return toLocalDateString(new Date(ms));
}

/** DST-safe: moves by calendar days, not 24-hour steps. */
export function addDays(date: string, days: number): string {
  const d = parseLocalDate(date);
  return toLocalDateString(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));
}

/** Whole calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  const a = parseLocalDate(from);
  const b = parseLocalDate(to);
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}

/** 1–12. */
export function monthOf(date: string): number {
  return Number(date.slice(5, 7));
}

export function formatLongDate(date: string): string {
  return parseLocalDate(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(date: string, today: string = todayString()): string {
  const sameYear = date.slice(0, 4) === today.slice(0, 4);
  return parseLocalDate(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** "Today", "Yesterday", "3 days ago", or a date for anything older than a week. */
export function formatRelativeDay(date: string, today: string = todayString()): string {
  const diff = daysBetween(date, today);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff === -1) return 'Tomorrow';
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  if (diff < -1 && diff > -7) return `In ${-diff} days`;
  return formatShortDate(date, today);
}
