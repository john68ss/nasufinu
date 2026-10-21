"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Section } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Unavailable } from "@/components/ui/stat";
import { NoData, ServiceNote } from "@/components/dashboard/service-note";
import { formatCoin, formatMoney, formatNumber } from "@/lib/utils/format";
import { utcDayStart } from "@/lib/utils/time";
import type { DashboardData } from "@/types/dashboard";

type Range = "7d" | "30d";
const OPTIONS: { value: Range; label: string }[] = [
  { value: "7d", label: "7Z" },
  { value: "30d", label: "30Z" },
];

const dayFmt = new Intl.DateTimeFormat("ro-RO", { month: "short", day: "numeric", timeZone: "UTC" });
const ACCENT = "#3b82f6";

interface Row {
  day: number;
  reward: number;
  partial: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: Row }>;
  priceUsd: number | null;
}

function EarningsTooltip({ active, payload, priceUsd }: TooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-xl border border-line-strong bg-surface-2 px-3 py-2 text-xs shadow-card">
      <div className="text-muted">
        {dayFmt.format(row.day)} (UTC){row.partial ? " · în curs" : ""}
      </div>
      <div className="tabular text-sm font-semibold">{formatCoin(row.reward)}</div>
      {priceUsd != null ? <div className="tabular text-muted">≈ {formatMoney(row.reward * priceUsd, "USD")} la prețul curent</div> : null}
    </div>
  );
}

export function EarningsChart({ data, now }: { data: DashboardData; now: number }) {
  const [range, setRange] = useState<Range>("7d");
  const { kryptex, market } = data;
  const all = kryptex.data?.dailyRewards ?? null;
  const priceUsd = market.data?.priceUsd ?? null;
  const today = utcDayStart(now || data.generatedAt);

  const rows = useMemo<Row[]>(() => {
    if (!all) return [];
    const count = range === "7d" ? 7 : 30;
    return all.slice(-count).map((d) => ({ day: d.day, reward: d.reward, partial: d.day >= today }));
  }, [all, range, today]);

  const total = rows.reduce((a, r) => a + r.reward, 0);

  return (
    <Section
      id="earnings"
      title="Câștiguri pe zi"
      description="Per zi UTC, așa cum le raportează pool-ul Kryptex"
      action={<Segmented label="Interval câștiguri" options={OPTIONS} value={range} onChange={setRange} />}
    >
      <Card className="p-2.5 sm:p-3">
        {rows.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-1">
            {kryptex.data ? <Unavailable label="Istoricul câștigurilor este indisponibil" /> : <NoData result={kryptex} />}
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
              <div>
                <div className="tabular text-base font-semibold">{formatCoin(total)}</div>
                <div className="text-[11px] text-muted">
                  ultimele {rows.length} zile{priceUsd != null ? ` · ≈ ${formatMoney(total * priceUsd, "USD")} la prețul curent` : ""}
                </div>
              </div>
              <div className="tabular text-right text-xs text-muted">
                medie {formatNumber(total / rows.length, 3)}
                <br />
                PEARL / zi
              </div>
            </div>
            <div className="h-40 w-full sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="#1b2a48" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    tickFormatter={(d: number) => dayFmt.format(d)}
                    tick={{ fill: "#8ea3c4", fontSize: 11 }}
                    interval="preserveStartEnd"
                    minTickGap={24}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatNumber(v, v < 10 ? 1 : 0)}
                    tick={{ fill: "#8ea3c4", fontSize: 11 }}
                    width={36}
                    tickCount={4}
                    axisLine={false}
                    tickLine={false}
                    orientation="right"
                  />
                  <Tooltip content={(props) => <EarningsTooltip {...(props as Omit<TooltipProps, "priceUsd">)} priceUsd={priceUsd} />} cursor={{ fill: "#14233f" }} />
                  <Bar dataKey="reward" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {rows.map((row) => (
                      <Cell key={row.day} fill={ACCENT} fillOpacity={row.partial ? 0.45 : 1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
        <ServiceNote result={kryptex} now={now} className="mt-2 px-1 text-[11px] text-warn" />
        {kryptex.data && kryptex.data.unavailable.length > 0 ? (
          <p className="mt-2 px-1 text-[11px] text-subtle">Indisponibile la această actualizare: {kryptex.data.unavailable.join(", ")}.</p>
        ) : null}
      </Card>

      {kryptex.data?.payouts && kryptex.data.payouts.length > 0 ? (
        <Card className="p-4">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Ultimele plăți</h3>
          <ul className="divide-y divide-line">
            {kryptex.data.payouts.map((p) => (
              <li key={`${p.date}-${p.txid ?? p.received}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-muted">{dayFmt.format(p.date)}</span>
                <span className="tabular font-medium">{formatCoin(p.received)}</span>
                <span className="text-xs text-subtle">{p.status ?? ""}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </Section>
  );
}
