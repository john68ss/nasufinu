"use client";

import { Card, Section } from "@/components/ui/card";
import { StatusDot, type Tone } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils/time";
import type { ApiState, DashboardData } from "@/types/dashboard";

const VIEW: Record<ApiState, { label: string; tone: Tone }> = {
  connected: { label: "Conectat", tone: "ok" },
  error: { label: "Eroare", tone: "danger" },
  unconfigured: { label: "Neconfigurat", tone: "neutral" },
};

export function ApiStatus({ data, now }: { data: DashboardData; now: number }) {
  return (
    <Section id="status" title="Stare API">
      <Card className="divide-y divide-line p-0">
        {data.apiStatus.map((entry) => {
          const view = VIEW[entry.state];
          return (
            <div key={entry.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <div className="font-medium">{entry.label}</div>
                {entry.state !== "connected" && entry.message ? <div className="truncate text-[11px] text-subtle">{entry.message}</div> : null}
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className="inline-flex items-center gap-2">
                  <StatusDot tone={view.tone} />
                  {view.label}
                </span>
                {entry.lastSuccessAt != null && now ? (
                  <span className="text-[11px] text-subtle">actualizat {timeAgo(entry.lastSuccessAt, now)}</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </Card>
    </Section>
  );
}
