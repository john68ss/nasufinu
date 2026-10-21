import "server-only";

// In-memory limiter: per serverless instance. Pair with a Vercel Firewall rate-limit rule (see README).
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_IP = 5;
const MAX_FAILURES_GLOBAL = 40;
const MAX_TRACKED = 5000;

const failures = new Map<string, number[]>();
const GLOBAL_KEY = "*";

function recent(key: string, now: number): number[] {
  const list = (failures.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length > 0) failures.set(key, list);
  else failures.delete(key);
  return list;
}

export interface RateLimitState {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkLoginAllowed(ip: string, now = Date.now()): RateLimitState {
  for (const [key, limit] of [
    [ip, MAX_FAILURES_PER_IP],
    [GLOBAL_KEY, MAX_FAILURES_GLOBAL],
  ] as const) {
    const list = recent(key, now);
    if (list.length >= limit) {
      const retryAfterMs = WINDOW_MS - (now - list[0]);
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
    }
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordLoginFailure(ip: string, now = Date.now()) {
  if (failures.size > MAX_TRACKED) failures.clear();
  for (const key of [ip, GLOBAL_KEY]) failures.set(key, [...recent(key, now), now]);
}

export function clearLoginFailures(ip: string) {
  failures.delete(ip);
}
