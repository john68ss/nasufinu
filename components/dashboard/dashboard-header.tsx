"use client";

import { RefreshCw } from "lucide-react";
import { Badge, StatusDot, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils/time";
import type { DashboardData } from "@/types/dashboard";

export function DashboardHeader({
  data,
  now,
  lastSyncAt,
  refreshing,
  onRefresh,
}: {
  data: DashboardData;
  now: number;
  lastSyncAt: number;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const rig = data.rig.data;
  const gpuCount = rig?.gpus.length ?? null;
  const online = rig?.online;
  const tone: Tone = online === true ? "ok" : online === false ? "danger" : "neutral";
  const label = online === true ? "ONLINE" : online === false ? "OFFLINE" : data.rig.status === "unconfigured" ? "NECONFIGURAT" : "NECUNOSCUT";

  return (
    <header className="animate-fade-in flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">Panou de control</h1>
        <p className="tabular flex flex-wrap items-center gap-x-2 text-[11px] text-muted">
          <span>Rig de minat{gpuCount != null ? ` • ${gpuCount} GPU-uri` : ""}</span>
          <span aria-live="off">Actualizat {now ? timeAgo(lastSyncAt, now) : "…"}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge tone={tone} className="px-2 py-0.5 text-[10px] font-semibold tracking-wide" aria-label={`Rig ${label.toLowerCase()}`}>
          <StatusDot tone={tone} pulse={online === true} />
          {label}
        </Badge>
        <Button onClick={onRefresh} disabled={refreshing} aria-label="Actualizează datele" className="px-2.5">
          <RefreshCw className={refreshing ? "size-3.5 animate-spin" : "size-3.5"} />
          <span className="hidden sm:inline">Actualizează</span>
        </Button>
      </div>
    </header>
  );
}
