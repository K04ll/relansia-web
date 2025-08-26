// lib/worker/backoff.ts
/** Exponential backoff with full jitter (min 30s, cap 6h). */
export function nextBackoffMs(attempts: number, baseMs = 30_000, maxMs = 21_600_000) {
  const exp = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempts));
  const jitter = 0.5 + Math.random(); // 0.5..1.5
  return Math.min(maxMs, Math.round(exp * jitter));
}
