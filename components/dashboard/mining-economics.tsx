"use client";

import type { ReactNode } from "react";
import { Card, Section } from "@/components/ui/card";
import { Unavailable } from "@/components/ui/stat";
import { TONE_TEXT, type Tone } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatCoin, formatKwh, formatMoney, formatWatts } from "@/lib/utils/format";
import { formatMoneyIn, pickMoney } from "@/lib/utils/money";
import type { DashboardData, DisplayCurrency, Money } from "@/types/dashboard";

function MoneyRow({
  label,
  money,
  currency,
  tone,
  strong,
}: {
  label: string;
  money: Money;
  currency: DisplayCurrency;
  tone?: Tone;
  strong?: boolean;
}) {
  const main = pickMoney(money, currency);
  const others = (["RON", "EUR", "USD"] as const).filter((c) => c !== currency);
  return (
    <Row label={label}>
      {main == null ? (
        <Unavailable />
      ) : (
        <div className="text-right">
          <div className={cn("tabular text-sm font-semibold", strong && "text-sm", tone && TONE_TEXT[tone])}>
            {formatMoneyIn(money, currency)}
          </div>
          <div className="tabular text-[11px] text-subtle">{others.map((c) => formatMoneyIn(money, c)).join(" · ")}</div>
        </div>
      )}
    </Row>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      {children}
    </div>
  );
}

export function MiningEconomics({ data }: { data: DashboardData }) {
  const { economics: e, settings, market, fx, earnings } = data;
  const cur = settings.displayCurrency;
  const profitTone = (m: Money): Tone | undefined => {
    const v = pickMoney(m, cur);
    return v == null ? undefined : v >= 0 ? "ok" : "danger";
  };

  return (
    <Section id="economics" title="Economia minatului" description={`Afișat în ${cur}; celelalte monede sub fiecare valoare`}>
      <Card className="divide-y divide-line py-1">
        <Row label="Preț curent PEARL">
          {market.data?.priceUsd != null ? (
            <div className="text-right">
              <div className="tabular text-sm font-semibold">{formatMoney(market.data.priceUsd, "USD", 4)}</div>
              <div className="tabular text-[11px] text-subtle">
                {market.data.priceEur != null ? formatMoney(market.data.priceEur, "EUR", 4) : "EUR indisponibil"}
              </div>
            </div>
          ) : (
            <Unavailable />
          )}
        </Row>
        <MoneyRow label="Venit zilnic" money={e.dailyRevenue} currency={cur} />
        <MoneyRow label="Venit lunar (×30)" money={e.monthlyRevenue} currency={cur} />
        <Row label="Consum de putere">
          {e.inputs.powerW != null ? (
            <div className="text-right">
              <div className="tabular text-sm font-semibold">{formatWatts(e.inputs.powerW)}</div>
              <div className="tabular text-[11px] text-subtle">{formatKwh(e.dailyKwh)} / zi</div>
            </div>
          ) : (
            <Unavailable />
          )}
        </Row>
        <MoneyRow label="Cost electricitate / zi" money={e.dailyElectricity} currency={cur} />
        <MoneyRow label="Cost electricitate / lună" money={e.monthlyElectricity} currency={cur} />
        <MoneyRow label="Profit estimat / zi" money={e.dailyProfit} currency={cur} tone={profitTone(e.dailyProfit)} strong />
        <MoneyRow label="Profit estimat / lună" money={e.monthlyProfit} currency={cur} tone={profitTone(e.monthlyProfit)} strong />
      </Card>
      <div className="space-y-1 px-1 text-[11px] leading-relaxed text-subtle">
        <p>
          Venit = media ultimelor zile complete ({earnings?.avgDailyPrl != null ? formatCoin(earnings.avgDailyPrl) : "indisponibil"} pe zi) × prețul
          curent. Este o estimare, nu o cifră din pool.
        </p>
        <p>
          Preț electricitate:{" "}
          {settings.electricityPriceRonKwh != null ? `${settings.electricityPriceRonKwh} RON/kWh` : "nesetat (ELECTRICITY_PRICE_RON_KWH)"}
          {fx.data ? ` · Curs: 1 USD = ${fx.data.ronPerUsd.toFixed(4)} RON${fx.data.date ? ` (${fx.data.date})` : ""}` : " · Curs indisponibil"}
        </p>
        {e.revenueNote ? <p className="text-warn">{e.revenueNote}</p> : null}
      </div>
    </Section>
  );
}
