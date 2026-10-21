"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, Section } from "@/components/ui/card";
import { summarizeGpus } from "@/lib/calculations/gpu";
import type { DashboardData } from "@/types/dashboard";
import { NoData, ServiceNote } from "@/components/dashboard/service-note";
import { GpuCard } from "./gpu-card";

export function GpuMonitor({ data, now }: { data: DashboardData; now: number }) {
  const { rig, settings } = data;
  const rigData = rig.data;
  const summary = rigData ? summarizeGpus(rigData, settings.thresholds) : null;
  const missing = rigData ? Math.max(0, settings.expectedGpuCount - rigData.gpus.length) : 0;

  return (
    <Section
      id="gpus"
      title="Monitorizare GPU"
      description={rigData ? `${rigData.gpus.length} GPU-uri raportează` : undefined}
      action={
        summary && summary.total > 0 ? (
          <div className="flex flex-wrap justify-end gap-1.5">
            <Badge tone="ok">{summary.ok} OK</Badge>
            {summary.warning + summary.idle > 0 ? <Badge tone="warn">{summary.warning + summary.idle} Atenție</Badge> : null}
            {summary.critical > 0 ? <Badge tone="danger">{summary.critical} Critice</Badge> : null}
          </div>
        ) : null
      }
    >
      <ServiceNote result={rig} now={now} className="px-1 text-xs text-warn" />
      {missing > 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn">
          <AlertTriangle className="size-4 shrink-0" />
          {rigData?.gpus.length} din {settings.expectedGpuCount} GPU-uri așteptate raportează.
        </div>
      ) : null}
      {rigData && rigData.gpus.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rigData.gpus.map((gpu) => (
            <GpuCard key={gpu.busId ?? gpu.index} gpu={gpu} rigOnline={rigData.online} thresholds={settings.thresholds} />
          ))}
        </div>
      ) : (
        <Card>
          <NoData result={rig} />
        </Card>
      )}
    </Section>
  );
}
