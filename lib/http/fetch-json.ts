import "server-only";
import { HTTP_DEFAULTS } from "@/config/thresholds";
import { UpstreamError } from "./errors";

export interface FetchJsonOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds, 300) * 1000;
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.min(Math.max(date - Date.now(), 0), 300_000);
}

/**
 * GET JSON with timeout and limited retries (network errors, timeouts, 5xx).
 * 401/403/404/429 are never retried. Only a sanitized UpstreamError escapes.
 */
export async function fetchJson(url: string, options: FetchJsonOptions = {}): Promise<unknown> {
  const { headers = {}, timeoutMs = HTTP_DEFAULTS.timeoutMs, retries = HTTP_DEFAULTS.retries } = options;
  let lastError: UpstreamError = new UpstreamError("unavailable");

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(300 * attempt);
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json", ...headers },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.status === 401 || response.status === 403) throw new UpstreamError("auth", response.status);
      if (response.status === 404) throw new UpstreamError("not_found", 404);
      if (response.status === 429) {
        throw new UpstreamError("rate_limit", 429, parseRetryAfter(response.headers.get("retry-after")));
      }
      if (!response.ok) {
        lastError = new UpstreamError("unavailable", response.status);
        if (response.status >= 500) continue;
        throw lastError;
      }

      try {
        return await response.json();
      } catch {
        throw new UpstreamError("invalid_response", response.status);
      }
    } catch (error) {
      if (error instanceof UpstreamError) {
        if (error.kind !== "unavailable" || (error.status != null && error.status < 500)) throw error;
        lastError = error;
        continue;
      }
      const name = error instanceof Error ? error.name : "";
      lastError = new UpstreamError(name === "TimeoutError" || name === "AbortError" ? "timeout" : "unavailable");
    }
  }
  throw lastError;
}
