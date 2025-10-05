export type AnyDate =
  | string
  | number
  | Date
  | { seconds: number; nanoseconds?: number }
  | null
  | undefined;

export function toJSDate(x: AnyDate): Date | null {
  if (!x) return null;
  if (x instanceof Date) return isNaN(x.getTime()) ? null : x;
  if (typeof x === 'number') {
    const d = new Date(x);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof x === 'string') {
    // Allow 'YYYY-MM-DD' or full ISO; ensure T00:00:00 for plain dates
    const s = /^\d{4}-\d{2}-\d{2}$/.test(x) ? `${x}T00:00:00` : x;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof x === 'object' && typeof (x as any).seconds === 'number') {
    const d = new Date((x as any).seconds * 1000);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function formatShort(x: AnyDate): string {
  const d = toJSDate(x);
  if (!d) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
}

export function coalesceDate(x: AnyDate, fallbackDays = 7): Date {
  const d = toJSDate(x);
  if (d) return d;
  const f = new Date();
  f.setDate(f.getDate() + fallbackDays);
  return f;
}
