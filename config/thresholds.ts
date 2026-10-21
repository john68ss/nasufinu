import type { Thresholds } from "@/types/dashboard";

/** Defaults; override with GPU_*_C environment variables (see .env.example). */
export const DEFAULT_THRESHOLDS: Thresholds = {
  tempWarnC: 70,
  tempCritC: 80,
  memTempWarnC: 90,
  memTempCritC: 100,
};

export const CACHE_SECONDS = {
  hiveos: 25,
  kryptex: 20,
  pearlPrice: 60,
  fx: 3600,
} as const;

/** Server cache TTL per price-history range, in seconds. */
export const HISTORY_CACHE_SECONDS = {
  "24h": 120,
  "7d": 600,
  "30d": 1800,
  "90d": 3600,
} as const;

/** Upstream request timeout and retry policy. */
export const HTTP_DEFAULTS = {
  timeoutMs: 8000,
  retries: 1,
} as const;

/** How long a failed upstream call is remembered before retrying (rate-limit awareness). */
export const ERROR_BACKOFF_SECONDS = 15;
