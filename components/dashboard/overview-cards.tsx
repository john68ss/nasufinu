"use client";

import type { ReactNode } from "react";
import { Activity, ArrowDownRight, Banknote, ArrowUpRight, Coins, Gauge, TrendingUp, Zap } from "lucide-react";
import { StatusDot, TONE_TEXT, type Tone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Unavailable } from "@/components/ui/stat";
import { moneyFromUsd } from "@/lib/calculations/economics";
import { cn } from "@/lib/utils/cn";
import {
  DASH,
  formatCoin,
  formatEfficiency,
  formatHashrate,
  formatKwh,
  formatMoney,
  formatSignedPercent,
  formatUptime,
  formatWatts,
} from "@/lib/utils/format";
import { formatMoneyIn, pickMoney } from "@/lib/utils/money";
import type { DashboardData } from "@/types/dashboard";
import { NoData, ServiceNote } from "./service-note";

function MetricCard({
  label,
  icon,
  children,
  className,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col gap-0.5 p-3 sm:p-3", className)}>
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted">
        <span className="text-accent [&>svg]:size-3.5">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      {children}
    </Card>
  );
}

const Value = ({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) => (
  <div className={cn("tabular text-lg font-semibold leading-tight tracking-tight", TONE_TEXT[tone])}>{children}</div>
);

const Hint = ({ children, tone }: { children: ReactNode; tone?: Tone }) => (
  <div className={cn("tabular truncate text-[11px] leading-snug", tone ? TONE_TEXT[tone] : "text-muted")}>{children}</div>
);

export function OverviewCards({ data, now }: { data: DashboardData; now: number }) {
  const { rig, kryptex, market, economics, settings } = data;
  const cur = settings.displayCurrency;
  const rigData = rig.data;
  const m = market.data;
  const pool = kryptex.data?.pool ?? null;

  const online = rigData?.online;
  const rigTone: Tone = online === true ? "ok" : online === false ? "danger" : "neutral";
  const rigLabel = online === true ? "ONLINE" : online === false ? "OFFLINE" : "NECUNOSCUT";

  const change = m?.change24hPct ?? null;
  const changeTone: Tone = change == null ? "neutral" : change >= 0 ? "ok" : "danger";

  const profit = pickMoney(economics.dailyProfit, cur);
  const profitTone: Tone = profit == null ? "neutral" : profit >= 0 ? "ok" : "danger";

  const earnedToday = data.earnings?.todayPrl ?? null;
  const balance = kryptex.data?.balance ?? null;
  const paid = kryptex.data?.paid ?? null;
  const pending = balance?.unconfirmed ?? null;
  const unpaid = balance?.total ?? (balance?.confirmed != null ? balance.confirmed + (pending ?? 0) : (kryptex.data?.unpaid ?? null));
  const totalEarned = paid != null || unpaid != null ? (paid ?? 0) + (unpaid ?? 0) : null;
  const price = m?.priceUsd ?? null;
  const fiat = (prl: number | null) => (prl == null || price == null ? null : formatMoneyIn(moneyFromUsd(prl * price, data.fx.data), cur));

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
      <MetricCard label="Câștig total" icon={<Banknote />} className="col-span-2 lg:col-span-5">
        {kryptex.data ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted">Total pe zi (azi, UTC)</div>
              <Value tone="ok">{earnedToday != null ? formatCoin(earnedToday) : DASH}</Value>
              <Hint>{fiat(earnedToday) ? `≈ ${fiat(earnedToday)}` : "Neraportat încă"}</Hint>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted">Total (plătit + sold + în așteptare)</div>
              <Value tone="accent">{totalEarned != null ? formatCoin(totalEarned) : DASH}</Value>
              <Hint>
                {fiat(totalEarned) ? `≈ ${fiat(totalEarned)} · ` : ""}din care în așteptare {pending != null ? formatCoin(pending) : DASH}
                {" "}(neconfirmat)
              </Hint>
            </div>
          </div>
        ) : (
          <NoData result={kryptex} />
        )}
        <ServiceNote result={kryptex} now={now} />
      </MetricCard>

      <MetricCard label="Stare rig" icon={<Activity />} className="col-span-2 lg:col-span-1">
        {rigData ? (
          <>
            <Value tone={rigTone}>
              <span className="inline-flex items-center gap-2">
                <StatusDot tone={rigTone} pulse={online === true} className="size-2" />
                {rigLabel}
              </span>
            </Value>
            <Hint>
              Activ {formatUptime(rigData.uptimeSeconds)} · {rigData.name ?? DASH}
            </Hint>
          </>
        ) : (
          <NoData result={rig} />
        )}
        <ServiceNote result={rig} now={now} />
      </MetricCard>

      <MetricCard label="Hashrate" icon={<Gauge />}>
        {rigData?.totalHashrateHs != null ? (
          <>
            <Value>{formatHashrate(rigData.totalHashrateHs)}</Value>
            <Hint>Pool 30m {pool?.hashrate30mHs != null ? formatHashrate(pool.hashrate30mHs) : "n/d"}</Hint>
          </>
        ) : pool?.hashrate30mHs != null ? (
          <>
            <Value>{formatHashrate(pool.hashrate30mHs)}</Value>
            <Hint>Pool · 24h {formatHashrate(pool.hashrate24hHs)}</Hint>
          </>
        ) : (
          <NoData result={rig} />
        )}
      </MetricCard>

      <MetricCard label="Putere" icon={<Zap />}>
        {rigData?.totalPowerW != null ? (
          <>
            <Value>{formatWatts(rigData.totalPowerW)}</Value>
            <Hint>
              {rigData.efficiency != null ? formatEfficiency(rigData.efficiency) : "Eficiență n/d"} · {formatKwh(economics.dailyKwh)}/zi
            </Hint>
          </>
        ) : (
          <NoData result={rig} />
        )}
      </MetricCard>

      <MetricCard label="Preț PEARL" icon={<Coins />}>
        {m?.priceUsd != null ? (
          <>
            <Value>{formatMoney(m.priceUsd, "USD", m.priceUsd < 10 ? 3 : 2)}</Value>
            <Hint tone={changeTone}>
              <span className="inline-flex items-center gap-0.5">
                {change != null && (change >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />)}
                {formatSignedPercent(change)} 24h
              </span>
              {m.priceEur != null ? <span className="text-muted"> · {formatMoney(m.priceEur, "EUR", 3)}</span> : null}
            </Hint>
          </>
        ) : (
          <NoData result={market} />
        )}
        <ServiceNote result={market} now={now} />
      </MetricCard>

      <MetricCard label="Profit / zi" icon={<TrendingUp />}>
        {profit != null ? (
          <>
            <Value tone={profitTone}>{formatMoneyIn(economics.dailyProfit, cur)}</Value>
            <Hint>{formatMoneyIn(economics.monthlyProfit, cur, 0)} / lună</Hint>
          </>
        ) : (
          <>
            <Unavailable />
            {economics.revenueNote ? <Hint>{economics.revenueNote}</Hint> : null}
          </>
        )}
      </MetricCard>
    </div>
  );
}
