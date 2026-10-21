"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { HashrateChartLazy } from "@/components/charts/lazy-charts";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Card, Section } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { DASH, formatHashrate, formatNumber } from "@/lib/utils/format";
import { timeAgo } from "@/lib/utils/time";
import type { DashboardData } from "@/types/dashboard";
import type { KryptexWorker } from "@/types/earnings";
import { NoData, ServiceNote } from "./service-note";

function Tile({ label, children, tone }: { label: string; children: ReactNode; tone?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5">
      <div className="text-[10px] text-muted">{label}</div>
      <div className={cn("tabular text-sm font-semibold leading-tight", tone)}>{children}</div>
    </div>
  );
}

function WorkerRow({ worker, now }: { worker: KryptexWorker; now: number }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <StatusDot tone={worker.online ? "ok" : "danger"} pulse={worker.online} className="size-1.5" />
          <span className="truncate text-sm font-semibold">{worker.name}</span>
        </div>
        {worker.scheme ? (
          <Badge tone="accent" className="px-1.5 py-0 text-[10px]">
            {worker.scheme === "pps" ? "PPS+" : worker.scheme.toUpperCase()}
          </Badge>
        ) : null}
      </div>
      <dl className="mt-2 grid grid-cols-4 gap-2 text-xs">
        <div>
          <dt className="text-[10px] text-muted">30 min</dt>
          <dd className="tabular font-medium">{formatHashrate(worker.hashrate30mHs)}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-muted">24 h</dt>
          <dd className="tabular font-medium">{formatHashrate(worker.hashrate24hHs)}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-muted">Valid</dt>
          <dd className="tabular font-medium text-ok">{worker.valid != null ? formatNumber(worker.valid, 0) : DASH}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-muted">Exp./Inv.</dt>
          <dd className="tabular font-medium">
            <span className={worker.stale ? "text-warn" : undefined}>{worker.stale != null ? formatNumber(worker.stale, 0) : DASH}</span>
            {"/"}
            <span className={worker.invalid ? "text-danger" : undefined}>{worker.invalid != null ? formatNumber(worker.invalid, 0) : DASH}</span>
          </dd>
        </div>
      </dl>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 text-[10px] text-muted">
        <span className="inline-flex items-center gap-1">
          {worker.agent ?? DASH}
          {worker.outdated ? (
            <span className="inline-flex items-center gap-0.5 text-warn">
              <AlertTriangle className="size-3" />
              actualizare disponibilă
            </span>
          ) : null}
        </span>
        <span>Ultimul share {worker.lastShareAt != null && now ? timeAgo(worker.lastShareAt, now) : DASH}</span>
      </div>
    </div>
  );
}

export function PoolStats({ data, now }: { data: DashboardData; now: number }) {
  const { kryptex } = data;
  const k = kryptex.data;
  const pool = k?.pool ?? null;
  const outdated = pool?.workers.some((w) => w.outdated) ?? false;

  return (
    <Section id="pool" title="Pool Kryptex" description="Workeri și hashrate așa cum le raportează pool-ul">
      {!k ? (
        <Card>
          <NoData result={kryptex} />
          <ServiceNote result={kryptex} now={now} />
        </Card>
      ) : (
        <div className="grid gap-2 lg:grid-cols-2">
          <Card className="space-y-2">
            <h3 className="text-[10px] font-medium uppercase tracking-wider text-muted">Statistici</h3>
            {pool ? (
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                <Tile label="Online" tone="text-ok">
                  {pool.workersOnline}
                </Tile>
                <Tile label="Offline" tone={pool.workersOffline > 0 ? "text-danger" : undefined}>
                  {pool.workersOffline}
                </Tile>
                <Tile label="30 min">{formatHashrate(pool.hashrate30mHs)}</Tile>
                <Tile label="3 h">{formatHashrate(pool.hashrate3hHs)}</Tile>
                <Tile label="24 h">{formatHashrate(pool.hashrate24hHs)}</Tile>
              </div>
            ) : (
              <p className="text-xs text-subtle">Statisticile workerilor nu sunt disponibile momentan.</p>
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
              <h3 className="text-[10px] font-medium uppercase tracking-wider text-muted">Workeri</h3>
              {pool ? <span className="text-[10px] text-muted">{pool.workers.length} în total</span> : null}
            </div>
            {outdated ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-warn/30 bg-warn/10 px-2.5 py-1.5 text-xs text-warn">
                <AlertTriangle className="size-3.5 shrink-0" />
                Software de minat depășit
              </div>
            ) : null}
            {pool && pool.workers.length > 0 ? (
              <div className="space-y-2">
                {pool.workers.map((w) => (
                  <WorkerRow key={w.name} worker={w} now={now} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-subtle">Pool-ul nu a raportat încă niciun worker.</p>
            )}
            <ServiceNote result={kryptex} now={now} />
          </Card>

          <HashrateChartLazy />
        </div>
      )}
    </Section>
  );
}
