"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Section } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Unavailable } from "@/components/ui/stat";
import { cn } from "@/lib/utils/cn";
import { formatMoney, formatSignedPercent } from "@/lib/utils/format";
import type { ServiceResult } from "@/types/dashboard";
import type { HistoryRange, PriceHistory, PricePoint } from "@/types/market";

const RANGES: { value: HistoryRange; label: string }[] = [
  { value: "24h", label: "24H" },
  { value: "7d", label: "7Z" },
  { value: "30d", label: "30Z" },
  { value: "90d", label: "90Z" },
];

const REFETCH_AFTER_MS = 120_000;
const ACCENT = "#3b82f6";

const timeFmt = new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("ro-RO", { month: "short", day: "numeric" });
const fullFmt = new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium", timeStyle: "short" });

type Loaded = { state: "ok"; data: PriceHistory; stale: boolean } | { state: "error"; message: string };

interface TooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: PricePoint }>;
  base: number | null;
}

function PriceTooltip({ active, payload, base }: TooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  const change = base ? ((point.price - base) / base) * 100 : null;
  return (
    <div className="rounded-xl border border-line-strong bg-surface-2 px-3 py-2 text-xs shadow-card">
      <div className="text-muted">{fullFmt.format(point.t)}</div>
      <div className="tabular text-sm font-semibold">{formatMoney(point.price, "USD", 4)}</div>
      <div className={cn("tabular", change != null && change >= 0 ? "text-ok" : "text-danger")}>
        {formatSignedPercent(change)} față de început
      </div>
    </div>
  );
}

export function PriceChart() {
  const [range, setRange] = useState<HistoryRange>("7d");
  const router = useRouter();
  const [results, setResults] = useState<Partial<Record<HistoryRange, Loaded>>>({});
  const fetchedAt = useRef<Partial<Record<HistoryRange, number>>>({});

  useEffect(() => {
    const last = fetchedAt.current[range];
    if (last && Date.now() - last < REFETCH_AFTER_MS) return;
    const abort = new AbortController();

    fetch(`/api/pearl/history?range=${range}`, { cache: "no-store", signal: abort.signal })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        const body = (await response.json()) as ServiceResult<PriceHistory>;
        const loaded: Loaded =
          body.data && body.data.points.length > 1
            ? { state: "ok", data: body.data, stale: body.status !== "ok" }
            : { state: "error", message: body.error?.message ?? "Date indisponibile" };
        if (loaded.state === "ok") fetchedAt.current[range] = Date.now();
        setResults((prev) => ({ ...prev, [range]: loaded }));
      })
      .catch(() => {
        if (abort.signal.aborted) return;
        setResults((prev) => (prev[range]?.state === "ok" ? prev : { ...prev, [range]: { state: "error", message: "Date temporar indisponibile" } }));
      });
    return () => abort.abort();
  }, [range, router]);

  const current = results[range];
  const points = current?.state === "ok" ? current.data.points : null;
  const base = points?.[0]?.price ?? null;
  const last = points?.[points.length - 1]?.price ?? null;
  const change = base && last != null ? ((last - base) / base) * 100 : null;

  const domain = useMemo<[number, number] | undefined>(() => {
    if (!points) return undefined;
    const prices = points.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const pad = (max - min || max * 0.02) * 0.15;
    return [Math.max(0, min - pad), max + pad];
  }, [points]);

  return (
    <Section
      id="price"
      title="Preț PEARL"
      action={<Segmented label="Interval preț" options={RANGES} value={range} onChange={setRange} />}
    >
      <Card className="p-2.5 sm:p-3">
        <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
          <div className="tabular text-base font-semibold">{last != null ? formatMoney(last, "USD", 4) : "—"}</div>
          <div className={cn("tabular text-sm font-medium", change != null && change >= 0 ? "text-ok" : "text-danger")}>
            {change != null ? `${formatSignedPercent(change)} · ${RANGES.find((r) => r.value === range)?.label}` : null}
          </div>
        </div>
        <div className="h-48 w-full sm:h-60">
          {!current ? (
            <Skeleton className="h-full w-full" />
          ) : current.state === "error" || !points ? (
            <div className="flex h-full items-center justify-center">
              <Unavailable label={current.state === "error" ? current.message : "Date indisponibile"} />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#1b2a48" strokeDasharray="3 3" />
                <XAxis
                  dataKey="t"
                  type="number"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(t: number) => (range === "24h" ? timeFmt.format(t) : dayFmt.format(t))}
                  tick={{ fill: "#8ea3c4", fontSize: 11 }}
                  tickCount={4}
                  minTickGap={40}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={domain}
                  tickFormatter={(v: number) => `$${v.toFixed(v < 10 ? 2 : 1)}`}
                  tick={{ fill: "#8ea3c4", fontSize: 11 }}
                  width={46}
                  tickCount={4}
                  axisLine={false}
                  tickLine={false}
                  orientation="right"
                />
                <Tooltip content={(props) => <PriceTooltip {...(props as Omit<TooltipProps, "base">)} base={base} />} cursor={{ stroke: "#28406b" }} />
                <Area type="monotone" dataKey="price" stroke={ACCENT} strokeWidth={2} fill="url(#priceFill)" dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        {current?.state === "ok" && current.stale ? (
          <p className="mt-2 px-1 text-[11px] text-warn">Date temporar indisponibile — se afișează ultimul istoric valid.</p>
        ) : null}
      </Card>
    </Section>
  );
}
