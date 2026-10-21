"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Unavailable } from "@/components/ui/stat";
import { formatHashrate } from "@/lib/utils/format";
import type { ServiceResult } from "@/types/dashboard";
import type { HashrateHistory, HashratePoint, HashrateRange } from "@/types/earnings";

const RANGES: { value: HashrateRange; label: string }[] = [
  { value: "day", label: "Zi" },
  { value: "week", label: "Săptămână" },
];

const REFETCH_AFTER_MS = 60_000;
const BLUE = "#3b82f6";
const GREEN = "#34d399";
const YELLOW = "#fbbf24";
const RED = "#f87171";

const timeFmt = new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("ro-RO", { month: "short", day: "numeric" });
const fullFmt = new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium", timeStyle: "short" });

type Loaded = { state: "ok"; data: HashrateHistory; stale: boolean } | { state: "error"; message: string };

function ChartTooltip({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload?: HashratePoint }> }) {
  const p = payload?.[0]?.payload;
  if (!active || !p) return null;
  return (
    <div className="rounded-xl border border-line-strong bg-surface-2 px-3 py-2 text-xs shadow-card">
      <div className="text-muted">{fullFmt.format(p.t)}</div>
      <div className="tabular mt-1 space-y-0.5">
        <div style={{ color: BLUE }}>30 min · {formatHashrate(p.hashrate30mHs)}</div>
        <div style={{ color: GREEN }}>3 h · {formatHashrate(p.hashrate3hHs)}</div>
        {p.stale > 0 ? <div style={{ color: YELLOW }}>Expirate · {p.stale}</div> : null}
        {p.invalid > 0 ? <div style={{ color: RED }}>Invalide · {p.invalid}</div> : null}
      </div>
    </div>
  );
}

export function HashrateChart() {
  const [range, setRange] = useState<HashrateRange>("day");
  const router = useRouter();
  const [results, setResults] = useState<Partial<Record<HashrateRange, Loaded>>>({});
  const fetchedAt = useRef<Partial<Record<HashrateRange, number>>>({});

  useEffect(() => {
    const last = fetchedAt.current[range];
    if (last && Date.now() - last < REFETCH_AFTER_MS) return;
    const abort = new AbortController();

    fetch(`/api/kryptex/chart?range=${range}`, { cache: "no-store", signal: abort.signal })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        const body = (await response.json()) as ServiceResult<HashrateHistory>;
        const loaded: Loaded =
          body.data && body.data.points.length > 1
            ? { state: "ok", data: body.data, stale: body.status !== "ok" }
            : { state: "error", message: body.status === "unconfigured" ? "Neconfigurat" : (body.error?.message ?? "Date indisponibile") };
        if (loaded.state === "ok") fetchedAt.current[range] = Date.now();
        setResults((prev) => ({ ...prev, [range]: loaded }));
      })
      .catch(() => {
        if (abort.signal.aborted) return;
        setResults((prev) =>
          prev[range]?.state === "ok" ? prev : { ...prev, [range]: { state: "error", message: "Date temporar indisponibile" } },
        );
      });
    return () => abort.abort();
  }, [range, router]);

  const current = results[range];
  const points = current?.state === "ok" ? current.data.points : null;
  const maxStale = points ? Math.max(1, ...points.map((p) => p.stale + p.invalid)) : 1;

  return (
    <Card className="p-2.5 sm:p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted">Hashrate</h3>
        <Segmented label="Interval hashrate" options={RANGES} value={range} onChange={setRange} />
      </div>
      <div className="h-40 w-full sm:h-52">
        {!current ? (
          <Skeleton className="h-full w-full" />
        ) : current.state === "error" || !points ? (
          <div className="flex h-full items-center justify-center">
            <Unavailable label={current.state === "error" ? current.message : "Date indisponibile"} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="#1b2a48" strokeDasharray="3 3" />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(t: number) => (range === "day" ? timeFmt.format(t) : dayFmt.format(t))}
                tick={{ fill: "#8ea3c4", fontSize: 11 }}
                tickCount={4}
                minTickGap={40}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="h"
                orientation="right"
                domain={[0, "auto"]}
                tickFormatter={(v: number) => formatHashrate(v).replace(/\/s$/, "")}
                tick={{ fill: "#8ea3c4", fontSize: 11 }}
                width={58}
                tickCount={4}
                axisLine={false}
                tickLine={false}
              />
              <YAxis yAxisId="s" hide domain={[0, maxStale * 12]} />
              <Tooltip content={(props) => <ChartTooltip {...(props as { active?: boolean; payload?: ReadonlyArray<{ payload?: HashratePoint }> })} />} cursor={{ stroke: "#28406b" }} />
              <Bar yAxisId="s" dataKey="stale" stackId="s" fill={YELLOW} isAnimationActive={false} maxBarSize={4} />
              <Bar yAxisId="s" dataKey="invalid" stackId="s" fill={RED} isAnimationActive={false} maxBarSize={4} />
              <Line yAxisId="h" type="monotone" dataKey="hashrate30mHs" stroke={BLUE} strokeWidth={1.75} dot={false} connectNulls isAnimationActive={false} />
              <Line yAxisId="h" type="monotone" dataKey="hashrate3hHs" stroke={GREEN} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted">
        <Legend color={BLUE} label="Hashrate (30m)" />
        <Legend color={GREEN} label="Hashrate (3h)" />
        <Legend color={YELLOW} label="Expirate" square />
        <Legend color={RED} label="Invalide" square />
      </div>
      {current?.state === "ok" && current.stale ? (
        <p className="mt-2 px-1 text-[11px] text-warn">Date temporar indisponibile — se afișează ultimul grafic valid.</p>
      ) : null}
    </Card>
  );
}

function Legend({ color, label, square }: { color: string; label: string; square?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={square ? "size-2 rounded-[2px]" : "h-0.5 w-3 rounded-full"} style={{ background: color }} />
      {label}
    </span>
  );
}
