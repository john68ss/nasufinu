"use client";

import { timeAgo } from "@/lib/utils/time";
import type { ServiceResult } from "@/types/dashboard";
import { Unavailable } from "@/components/ui/stat";

/** Shown under a value when its integration is failing or not configured. */
export function ServiceNote({ result, now, className }: { result: ServiceResult<unknown>; now: number; className?: string }) {
  if (result.status === "ok") return null;
  if (result.status === "unconfigured") {
    return <p className={className ?? "text-[11px] text-subtle"}>Neconfigurat</p>;
  }
  if (result.fetchedAt == null) return null;
  return (
    <p className={className ?? "text-[11px] text-warn"}>
      Date temporar indisponibile · ultima actualizare {now ? timeAgo(result.fetchedAt, now) : "mai devreme"}
    </p>
  );
}

/** Replacement for a card body when there is no value at all. */
export function NoData({ result }: { result: ServiceResult<unknown> }) {
  if (result.status === "unconfigured") return <Unavailable label="Neconfigurat" />;
  if (result.status === "error") return <Unavailable label="Date temporar indisponibile" />;
  return <Unavailable />;
}
