import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPublicSettings } from "@/config/app";
import { Card, Section } from "@/components/ui/card";
import { IntegrationsPanel } from "@/components/settings/integrations";
import { requireSession } from "@/lib/auth/guard";
import { getIntegrationSummary } from "@/lib/settings/summary";

export const metadata: Metadata = { title: "Setări" };
export const dynamic = "force-dynamic";

function Item({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="min-w-0">
        <div className="text-xs text-foreground">{label}</div>
        {hint ? <div className="font-mono text-[10px] text-subtle">{hint}</div> : null}
      </div>
      <div className="tabular shrink-0 text-right text-xs font-semibold">{value}</div>
    </div>
  );
}

export default async function SettingsPage() {
  await requireSession();
  const s = getPublicSettings();
  const summary = await getIntegrationSummary();

  return (
    <div className="space-y-4">
      <div>
        <Link href="/" className="inline-flex min-h-9 items-center gap-1.5 text-xs text-muted hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          Panou
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">Setări</h1>
        <p className="mt-0.5 text-xs text-muted">
          Conectează-ți conturile mai jos. Restul valorilor sunt doar pentru citire: modifică-le în variabilele de mediu (Vercel → Settings → Environment Variables) și redeploy.
        </p>
      </div>

      <Section title="Conexiuni" description="Salvate pe server și păstrate după repornire">
        <IntegrationsPanel summary={summary} />
      </Section>

      <Section title="Economia minatului">
        <Card className="divide-y divide-line py-1">
          <Item
            label="Preț electricitate"
            hint="ELECTRICITY_PRICE_RON_KWH"
            value={s.electricityPriceRonKwh != null ? `${s.electricityPriceRonKwh} RON/kWh` : "Nesetat"}
          />
          <Item label="Moneda afișată" hint="DISPLAY_CURRENCY" value={s.displayCurrency} />
        </Card>
      </Section>

      <Section title="Praguri de temperatură">
        <Card className="divide-y divide-line py-1">
          <Item label="GPU avertizare" hint="GPU_TEMP_WARN_C" value={`${s.thresholds.tempWarnC}°C`} />
          <Item label="GPU critic" hint="GPU_TEMP_CRIT_C" value={`${s.thresholds.tempCritC}°C`} />
          <Item label="Memorie avertizare" hint="GPU_MEM_TEMP_WARN_C" value={`${s.thresholds.memTempWarnC}°C`} />
          <Item label="Memorie critic" hint="GPU_MEM_TEMP_CRIT_C" value={`${s.thresholds.memTempCritC}°C`} />
          <Item label="Număr GPU așteptat" hint="EXPECTED_GPU_COUNT" value={String(s.expectedGpuCount)} />
        </Card>
      </Section>

      <Section title="Intervale de actualizare" description="API-urile externe sunt memorate pe server pentru a respecta limitele de cereri">
        <Card className="divide-y divide-line py-1">
          <Item label="Actualizare panou (tab vizibil)" hint="REFRESH_INTERVAL_SECONDS" value={`${s.refreshIntervalSeconds} s`} />
          <Item label="Cache HiveOS" value={`${s.cacheSeconds.hiveos} s`} />
          <Item label="Cache preț PEARL" value={`${s.cacheSeconds.pearlPrice} s`} />
          <Item label="Cache Kryptex" value={`${s.cacheSeconds.kryptex} s`} />
          <Item label="Cache cursuri valutare" value={`${s.cacheSeconds.fx / 60} min`} />
        </Card>
        <p className="px-0.5 text-[11px] text-subtle">Actualizarea se oprește cât timp tabul este ascuns și încetinește după erori.</p>
      </Section>

      <Section title="Surse de date">
        <Card className="divide-y divide-line py-1">
          <Item label="ID monedă CoinGecko" hint="COINGECKO_COIN_ID" value={s.coingeckoCoinId ?? "Nesetat"} />
          <Item label="Moneda pool Kryptex" value={summary.kryptex.address ? summary.kryptex.coin : "Neconfigurat"} />
        </Card>
      </Section>
    </div>
  );
}
