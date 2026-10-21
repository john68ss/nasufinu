"use client";

import { AlertTriangle, WifiOff } from "lucide-react";
import { ApiStatus } from "@/components/dashboard/api-status";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EarningsWindows } from "@/components/dashboard/earnings-windows";
import { MiningEconomics } from "@/components/dashboard/mining-economics";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { PoolStats } from "@/components/dashboard/pool-stats";
import { ProfitCalculator } from "@/components/dashboard/profit-calculator";
import { EarningsChartLazy, PriceChartLazy } from "@/components/charts/lazy-charts";
import { GpuMonitor } from "@/components/gpu/gpu-monitor";
import { useDashboard } from "@/hooks/use-dashboard";
import { useNow } from "@/hooks/use-now";
import type { DashboardData } from "@/types/dashboard";

function Banner({ tone, icon, children }: { tone: "danger" | "warn"; icon: React.ReactNode; children: React.ReactNode }) {
  const style = tone === "danger" ? "border-danger/40 bg-danger/10 text-danger" : "border-warn/30 bg-warn/10 text-warn";
  return (
    <div role="status" className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${style} [&>svg]:size-4 [&>svg]:shrink-0`}>
      {icon}
      {children}
    </div>
  );
}

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const { data, refreshing, networkError, lastSyncAt, refresh } = useDashboard(initialData);
  const now = useNow();

  return (
    <div className="space-y-4">
      <DashboardHeader data={data} now={now} lastSyncAt={lastSyncAt} refreshing={refreshing} onRefresh={refresh} />

      {data.rig.data?.online === false ? (
        <Banner tone="danger" icon={<AlertTriangle />}>
          Rig-ul este offline. Valorile de mai jos sunt ultimele raportate.
        </Banner>
      ) : null}
      {networkError ? (
        <Banner tone="warn" icon={<WifiOff />}>
          Serverul nu poate fi contactat. Se afișează ultimele date încărcate; se reîncearcă automat.
        </Banner>
      ) : null}

      <OverviewCards data={data} now={now} />
      <EarningsWindows data={data} now={now} />
      <PoolStats data={data} now={now} />
      <GpuMonitor data={data} now={now} />
      <PriceChartLazy />
      <EarningsChartLazy data={data} now={now} />
      <MiningEconomics data={data} />
      <ProfitCalculator data={data} />
      <ApiStatus data={data} now={now} />
    </div>
  );
}
