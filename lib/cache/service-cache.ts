import "server-only";
import { ERROR_BACKOFF_SECONDS } from "@/config/thresholds";
import { publicError, toPublicError, UpstreamError } from "@/lib/http/errors";
import type { PublicError, ServiceResult } from "@/types/dashboard";

interface Entry<T> {
  data: T;
  fetchedAt: number;
}

interface Failure {
  error: PublicError;
  until: number;
}

// Per server instance. Keeps the last valid value so a failing API never blanks the UI.
const good = new Map<string, Entry<unknown>>();
const failures = new Map<string, Failure>();
const inflight = new Map<string, Promise<ServiceResult<unknown>>>();

/**
 * Returns a fresh value (within ttl), otherwise loads it once (concurrent callers share the request).
 * On failure returns the last valid value flagged as an error, and backs off before retrying.
 */
export function cachedService<T>(
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>,
): Promise<ServiceResult<T>> {
  const now = Date.now();
  const hit = good.get(key) as Entry<T> | undefined;
  if (hit && now - hit.fetchedAt < ttlSeconds * 1000) {
    return Promise.resolve({ status: "ok", data: hit.data, fetchedAt: hit.fetchedAt, error: null });
  }

  const failure = failures.get(key);
  if (failure && now < failure.until) {
    return Promise.resolve({
      status: "error",
      data: hit?.data ?? null,
      fetchedAt: hit?.fetchedAt ?? null,
      error: failure.error,
    });
  }

  const running = inflight.get(key) as Promise<ServiceResult<T>> | undefined;
  if (running) return running;

  const promise = (async (): Promise<ServiceResult<T>> => {
    try {
      const data = await load();
      const fetchedAt = Date.now();
      good.set(key, { data, fetchedAt });
      failures.delete(key);
      return { status: "ok", data, fetchedAt, error: null };
    } catch (error) {
      const publicErr = toPublicError(error);
      const backoffMs =
        error instanceof UpstreamError && error.retryAfterMs != null
          ? Math.max(error.retryAfterMs, 5000)
          : ERROR_BACKOFF_SECONDS * 1000;
      failures.set(key, { error: publicErr, until: Date.now() + backoffMs });
      // Log kind/status only; never URLs with secrets, headers or bodies.
      console.error(`[service:${key.split(":")[0]}] ${publicErr.kind}${error instanceof UpstreamError && error.status ? ` (${error.status})` : ""}`);
      const last = good.get(key) as Entry<T> | undefined;
      return { status: "error", data: last?.data ?? null, fetchedAt: last?.fetchedAt ?? null, error: publicErr };
    }
  })();

  inflight.set(key, promise as Promise<ServiceResult<unknown>>);
  void promise.finally(() => inflight.delete(key));
  return promise;
}

export function unconfiguredResult<T>(): ServiceResult<T> {
  return { status: "unconfigured", data: null, fetchedAt: null, error: publicError("unconfigured") };
}

/** Drops cached values and error backoffs for keys starting with `prefix` (after settings change). */
export function clearServiceCache(prefix: string): void {
  for (const map of [good, failures, inflight] as Map<string, unknown>[]) {
    for (const key of map.keys()) if (key.startsWith(prefix)) map.delete(key);
  }
}
