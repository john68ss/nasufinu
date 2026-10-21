"use client";

import type { ReactNode } from "react";
import { Banknote, CalendarDays, CalendarRange, Clock3, PiggyBank, TrendingUp, Wallet, Target } from "lucide-react";
import { TONE_TEXT, type Tone } from "@/components/ui/badge";
import { Section } from "@/components/ui/card";
import { moneyFromUsd } from "@/lib/calculations/economics";
import { cn } from "@/lib/utils/cn";
import { DASH, formatCoin } from "@/lib/utils/format";
import { formatMoneyIn } from "@/lib/utils/money";
import type { DashboardData } from "@/types/dashboard";
import { ServiceNote } from "./service-note";

const amount = (v: number | null | undefined) => (v == null ? DASH : formatCoin(v, "").trim());

function Window({
  label,
  icon,
  value,
  sub,
  tone,
  className,
  children,
}: {
  label: string;
  icon: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5 rounded-xl border border-line bg-surface p-3 shadow-card", className)}>
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted">
        <span className="text-accent [&>svg]:size-3.5">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className={cn("tabular text-xl font-semibold leading-tight tracking-tight", tone ? TONE_TEXT[tone] : null)}>{value}</div>
      {sub ? <div className="tabular text-[11px] leading-snug text-muted">{sub}</div> : null}
      {children}
    </div>
  );
}

const Unit = () => <span className="ml-1 text-xs font-medium text-muted">PEARL</span>;

export function EarningsWindows({ data, now }: { data: DashboardData; now: number }) {
  const { kryptex, market, fx, earnings, settings } = data;
  const cur = settings.displayCurrency;
  const k = kryptex.data;
  const price = market.data?.priceUsd ?? null;

  /** "≈ 21.08 USD · 100.1 RON" style line in the display currency, then USD. */
  const fiat = (prl: number | null | undefined): string | undefined => {
    if (prl == null || price == null) return undefined;
    const money = moneyFromUsd(prl * price, fx.data);
    const main = formatMoneyIn(money, cur);
    const second = cur === "USD" ? formatMoneyIn(money, "EUR") : formatMoneyIn(money, "USD");
    return `≈ ${main} · ${second}`;
  };

  const balance = k?.balance ?? null;
  const pct = balance ? Math.min(100, Math.max(0, balance.reachedPct ?? (balance.threshold ? ((balance.total ?? 0) / balance.threshold) * 100 : 0))) : 0;
  const todayUtc = new Date(now || data.generatedAt).toISOString().slice(0, 10);

  if (!k) return null;

  return (
    <Section id="earnings-windows" title="Câștiguri și sold" description={`Sume în PEARL, convertite la prețul curent · „azi” = ziua UTC (${todayUtc})`}>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Window
          label="Câștigat azi"
          icon={<Banknote />}
          tone="ok"
          value={
            earnings?.todayPrl != null ? (
              <>
                {amount(earnings.todayPrl)}
                <Unit />
              </>
            ) : (
              <span className="text-sm text-subtle">Neraportat încă</span>
            )
          }
          sub={fiat(earnings?.todayPrl)}
        />
        <Window
          label="Sold"
          icon={<Wallet />}
          tone="accent"
          value={
            balance?.total != null ? (
              <>
                {amount(balance.total)}
                <Unit />
              </>
            ) : (
              DASH
            )
          }
          sub={fiat(balance?.total)}
        >
          {balance ? (
            <div className="tabular text-[11px] text-muted">
              Confirmat {amount(balance.confirmed)} · În așteptare {amount(balance.unconfirmed)}
            </div>
          ) : null}
        </Window>
        <Window label="Ieri" icon={<Clock3 />} value={<>{amount(earnings?.yesterdayPrl)}<Unit /></>} sub={fiat(earnings?.yesterdayPrl)} />
        <Window label="Estimat / lună" icon={<TrendingUp />} value={<>{amount(earnings?.estMonthlyPrl)}<Unit /></>} sub={fiat(earnings?.estMonthlyPrl)}>
          <div className="text-[11px] text-subtle">media ultimelor 7 zile complete × 30</div>
        </Window>
        <Window label="Ultimele 7 zile" icon={<CalendarDays />} value={<>{amount(earnings?.last7dPrl)}<Unit /></>} sub={fiat(earnings?.last7dPrl)} />
        <Window label="Ultimele 30 zile" icon={<CalendarRange />} value={<>{amount(earnings?.last30dPrl)}<Unit /></>} sub={fiat(earnings?.last30dPrl)} />
        <Window label="Total plătit" icon={<PiggyBank />} value={<>{amount(k.paid)}<Unit /></>} sub={fiat(k.paid)} />
        <Window
          label="Următoarea plată"
          icon={<Target />}
          value={balance?.threshold != null ? `${Math.round(pct)}%` : DASH}
          sub={balance?.threshold != null ? `Prag ${formatCoin(balance.threshold)}` : undefined}
        >
          {balance?.threshold != null ? (
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
            </div>
          ) : null}
        </Window>
      </div>
      <ServiceNote result={kryptex} now={now} />
    </Section>
  );
}
