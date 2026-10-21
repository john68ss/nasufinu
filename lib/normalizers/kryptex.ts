import type { DailyReward, HashratePoint, KryptexBalance, KryptexPool, KryptexWorker, Payout } from "@/types/earnings";
import type {
  KryptexBalanceRaw,
  KryptexHashrateChartRaw,
  KryptexPayoutStatsRaw,
  KryptexPayoutsRaw,
  KryptexRewardChartRaw,
  KryptexWorkersRaw,
} from "@/types/kryptex";
import { toMillis, utcDayStart } from "@/lib/utils/time";

const num = (v: number | null | undefined): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function normalizeBalance(raw: KryptexBalanceRaw): KryptexBalance {
  return {
    total: num(raw.total),
    confirmed: num(raw.confirmed),
    unconfirmed: num(raw.unconfirmed),
    threshold: num(raw.threshold),
    reachedPct: num(raw.reached_pct),
  };
}

/** Merges points that fall on the same UTC day, sorted oldest first. */
export function normalizeRewardChart(raw: KryptexRewardChartRaw): DailyReward[] {
  const byDay = new Map<number, number>();
  for (const point of raw) {
    const stamp = num(point.timestamp) ?? num(point.date);
    const reward = num(point.reward);
    if (stamp == null || reward == null) continue;
    const day = utcDayStart(toMillis(stamp));
    byDay.set(day, (byDay.get(day) ?? 0) + reward);
  }
  return [...byDay.entries()].sort((a, b) => a[0] - b[0]).map(([day, reward]) => ({ day, reward }));
}

export function normalizePayoutStats(raw: KryptexPayoutStatsRaw) {
  return {
    paid: num(raw.paid),
    unpaid: num(raw.unpaid),
    rewardWeek: num(raw.reward?.week),
    rewardMonth: num(raw.reward?.month),
  };
}

export function normalizePayouts(raw: KryptexPayoutsRaw, limit = 5): Payout[] {
  const payouts: Payout[] = [];
  for (const p of raw.results) {
    const date = num(p.date);
    const received = num(p.received);
    if (date == null || received == null) continue;
    payouts.push({ date: toMillis(date), received, status: p.status ?? null, txid: p.txid || null });
  }
  return payouts.sort((a, b) => b.date - a.date).slice(0, limit);
}

const sumOrNull = (values: (number | null)[]) => {
  const present = values.filter((v): v is number => v != null);
  return present.length > 0 ? present.reduce((a, b) => a + b, 0) : null;
};

export function normalizeWorkers(raw: KryptexWorkersRaw, workerName: string | null): KryptexPool {
  const matching = workerName ? raw.results.filter((w) => w.worker === workerName) : raw.results;
  // A name that matches nothing (e.g. the HiveOS rig name) must not hide the pool's real workers.
  const rows = matching.length > 0 ? matching : raw.results;

  const workers: KryptexWorker[] = rows.map((w) => {
    const agent = w.agent ?? null;
    const latest = w.latest_agent ?? null;
    return {
      name: w.worker,
      online: w.status ? w.status.toLowerCase() === "online" : true,
      scheme: w.scheme ?? null,
      hashrate30mHs: num(w.avg_hashrate_30m),
      hashrate3hHs: num(w.avg_hashrate_3h),
      hashrate24hHs: num(w.avg_hashrate_24h),
      valid: num(w.valid),
      stale: num(w.stale),
      invalid: num(w.invalid),
      agent,
      outdated: agent != null && latest != null && agent !== latest,
      lastShareAt: num(w.last_share) ? toMillis(num(w.last_share) as number) : null,
    };
  });

  const lastShares = workers.map((w) => w.lastShareAt).filter((v): v is number => v != null);
  return {
    workersOnline: workers.filter((w) => w.online).length,
    workersOffline: workers.filter((w) => !w.online).length,
    hashrate30mHs: sumOrNull(workers.map((w) => w.hashrate30mHs)),
    hashrate3hHs: sumOrNull(workers.map((w) => w.hashrate3hHs)),
    hashrate24hHs: sumOrNull(workers.map((w) => w.hashrate24hHs)),
    lastShareAt: lastShares.length > 0 ? Math.max(...lastShares) : null,
    workers,
  };
}

/** Averages raw 10-minute buckets down to at most `maxPoints` points. */
export function normalizeHashrateChart(raw: KryptexHashrateChartRaw, maxPoints = 180): HashratePoint[] {
  const rows = raw
    .map((p) => ({
      t: num(p.timestamp),
      h30: num(p.avg_hashrate_30m),
      h3: num(p.avg_hashrate_3h),
      stale: num(p.stale) ?? 0,
      invalid: num(p.invalid) ?? 0,
    }))
    .filter((p): p is { t: number; h30: number | null; h3: number | null; stale: number; invalid: number } => p.t != null)
    .sort((a, b) => a.t - b.t);

  const size = Math.max(1, Math.ceil(rows.length / maxPoints));
  const avg = (values: (number | null)[]) => {
    const present = values.filter((v): v is number => v != null);
    return present.length > 0 ? present.reduce((a, b) => a + b, 0) / present.length : null;
  };
  const points: HashratePoint[] = [];
  for (let i = 0; i < rows.length; i += size) {
    const bucket = rows.slice(i, i + size);
    points.push({
      t: bucket[bucket.length - 1].t,
      hashrate30mHs: avg(bucket.map((b) => b.h30)),
      hashrate3hHs: avg(bucket.map((b) => b.h3)),
      stale: bucket.reduce((a, b) => a + b.stale, 0),
      invalid: bucket.reduce((a, b) => a + b.invalid, 0),
    });
  }
  return points;
}
