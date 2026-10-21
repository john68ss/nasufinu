"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DashboardData } from "@/types/dashboard";

const MAX_BACKOFF_MS = 300_000;

export interface DashboardState {
  data: DashboardData;
  refreshing: boolean;
  /** The browser could not reach our own API (offline, session expired...). */
  networkError: boolean;
  /** Unix ms of the last successful round-trip to /api/dashboard. */
  lastSyncAt: number;
  refresh: () => Promise<void>;
}

/**
 * Polls the aggregated endpoint. Pauses while the tab is hidden, refreshes when it becomes visible
 * again, and backs off exponentially on consecutive failures. Upstream rate limits are protected
 * separately by the server-side TTL cache.
 */
export function useDashboard(initial: DashboardData): DashboardState {
  const intervalMs = initial.settings.refreshIntervalSeconds * 1000;
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [refreshing, setRefreshing] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(initial.generatedAt);

  const failures = useRef(0);
  const lastSync = useRef(initial.generatedAt);
  const controller = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setRefreshing(true);
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store", signal: abort.signal });
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok) throw new Error("bad_status");
      const next = (await response.json()) as DashboardData;
      setData(next);
      lastSync.current = Date.now();
      setLastSyncAt(lastSync.current);
      failures.current = 0;
      setNetworkError(false);
    } catch {
      if (abort.signal.aborted) return;
      failures.current += 1;
      setNetworkError(true);
    } finally {
      if (controller.current === abort) {
        controller.current = null;
        setRefreshing(false);
      }
    }
  }, [router]);

  useEffect(() => {
    let timer: number | undefined;
    let stopped = false;

    const schedule = () => {
      window.clearTimeout(timer);
      if (stopped || document.hidden) return;
      const delay = Math.min(intervalMs * 2 ** Math.min(failures.current, 4), MAX_BACKOFF_MS);
      timer = window.setTimeout(async () => {
        await refresh();
        schedule();
      }, delay);
    };

    const onVisibility = async () => {
      if (document.hidden) {
        window.clearTimeout(timer);
        return;
      }
      if (Date.now() - lastSync.current >= intervalMs) await refresh();
      schedule();
    };

    const onOnline = async () => {
      await refresh();
      schedule();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      controller.current?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, [intervalMs, refresh]);

  return { data, refreshing, networkError, lastSyncAt, refresh };
}
