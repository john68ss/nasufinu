"use client";

import { RotateCcw } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, Section } from "@/components/ui/card";
import { TONE_TEXT, type Tone } from "@/components/ui/badge";
import { Unavailable } from "@/components/ui/stat";
import { computeEconomics } from "@/lib/calculations/economics";
import { cn } from "@/lib/utils/cn";
import { formatMoneyIn, pickMoney } from "@/lib/utils/money";
import type { DashboardData, Money } from "@/types/dashboard";

interface Fields {
  price: string;
  prl: string;
  electricity: string;
  power: string;
}

const toText = (v: number | null, digits = 4) => (v == null ? "" : String(Number(v.toFixed(digits))));

function liveFields(data: DashboardData): Fields {
  const i = data.economics.inputs;
  return {
    price: toText(i.priceUsd),
    prl: toText(data.earnings?.avgDailyPrl ?? null),
    electricity: toText(i.electricityRonKwh),
    power: toText(i.powerW != null ? Math.round(i.powerW) : null, 0),
  };
}

const parse = (text: string): number | null => {
  const value = Number(text.trim().replace(",", "."));
  return text.trim() !== "" && Number.isFinite(value) && value >= 0 ? value : null;
};

function Field({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-xs text-muted">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block min-h-12 w-full rounded-xl border border-line-strong bg-surface-2 pr-16 pl-3.5 text-base text-foreground focus:border-accent focus:outline-2 focus:outline-accent/40"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs text-subtle">{unit}</span>
      </div>
    </div>
  );
}

function Result({ label, money, currency }: { label: string; money: Money; currency: DashboardData["settings"]["displayCurrency"] }) {
  const value = pickMoney(money, currency);
  const tone: Tone = value == null ? "neutral" : value >= 0 ? "ok" : "danger";
  const others = (["RON", "EUR", "USD"] as const).filter((c) => c !== currency);
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      {value == null ? (
        <Unavailable className="text-xs" />
      ) : (
        <>
          <div className={cn("tabular text-base font-semibold", TONE_TEXT[tone])}>{formatMoneyIn(money, currency)}</div>
          <div className="tabular text-[11px] text-subtle">{others.map((c) => formatMoneyIn(money, c)).join(" · ")}</div>
        </>
      )}
    </div>
  );
}

/** What-if scenarios only: local state, never written back to live data. */
export function ProfitCalculator({ data }: { data: DashboardData }) {
  const [fields, setFields] = useState<Fields>(() => liveFields(data));
  const fx = data.fx.data;
  const currency = data.settings.displayCurrency;

  const result = useMemo(
    () =>
      computeEconomics({
        priceUsd: parse(fields.price),
        priceEur: null,
        dailyPrl: parse(fields.prl),
        powerW: parse(fields.power),
        electricityRonKwh: parse(fields.electricity),
        fx,
      }),
    [fields, fx],
  );

  const set = (key: keyof Fields) => (value: string) => setFields((f) => ({ ...f, [key]: value }));

  return (
    <Section
      id="calculator"
      title="Calculator de profit"
      description="Doar scenariu — nu modifică datele tale reale"
      action={
        <Button variant="ghost" onClick={() => setFields(liveFields(data))} aria-label="Revino la valorile live">
          <RotateCcw className="size-4" />
          <span className="hidden sm:inline">Resetează</span>
        </Button>
      }
    >
      <Card className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Preț PEARL" unit="USD" value={fields.price} onChange={set("price")} />
          <Field label="PEARL minat zilnic" unit="PEARL" value={fields.prl} onChange={set("prl")} />
          <Field label="Preț electricitate" unit="RON/kWh" value={fields.electricity} onChange={set("electricity")} />
          <Field label="Putere rig" unit="W" value={fields.power} onChange={set("power")} />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Result label="Profit zilnic" money={result.dailyProfit} currency={currency} />
          <Result label="Profit lunar" money={result.monthlyProfit} currency={currency} />
          <Result label="Profit anual" money={result.yearlyProfit} currency={currency} />
        </div>
        {result.dailyProfit.ron == null ? (
          <p className="text-[11px] text-subtle">
            {fx ? "Completează toate cele patru câmpuri pentru a vedea rezultatul." : "Cursurile valutare sunt indisponibile, deci profitul nu poate fi calculat acum."}
          </p>
        ) : null}
      </Card>
    </Section>
  );
}
