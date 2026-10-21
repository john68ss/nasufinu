import "server-only";
import { getServerConfig } from "@/config/app";
import { CACHE_SECONDS } from "@/config/thresholds";
import { cachedService, unconfiguredResult } from "@/lib/cache/service-cache";
import { UpstreamError } from "@/lib/http/errors";
import { fetchJson } from "@/lib/http/fetch-json";
import { mockHashrateHistory, mockKryptex } from "@/lib/mock";
import { resolveKryptex } from "@/lib/settings/resolve";
import {
  normalizeBalance,
  normalizeHashrateChart,
  normalizePayoutStats,
  normalizePayouts,
  normalizeRewardChart,
  normalizeWorkers,
} from "@/lib/normalizers/kryptex";
import {
  kryptexBalanceSchema,
  kryptexHashrateChartSchema,
  kryptexPayoutStatsSchema,
  kryptexPayoutsSchema,
  kryptexRewardChartSchema,
  kryptexWorkersSchema,
} from "@/types/kryptex";
import type { ZodType } from "zod";
import type { ServiceResult } from "@/types/dashboard";
import type { KryptexData, HashrateHistory, HashrateRange } from "@/types/earnings";

// Kryptex Pool public API (https://pool.kryptex.com/api). It has no API key/secret: data is keyed by wallet address.
const BASE_URL = "https://pool.kryptex.com";

async function get<T>(url: string, schema: ZodType<T>): Promise<T> {
  const parsed = schema.safeParse(await fetchJson(url));
  if (!parsed.success) throw new UpstreamError("invalid_response");
  return parsed.data;
}

export async function getKryptex(): Promise<ServiceResult<KryptexData>> {
  if (getServerConfig().mock) return { status: "ok", data: mockKryptex(), fetchedAt: Date.now(), error: null };

  const kryptex = await resolveKryptex();
  if (!kryptex) return unconfiguredResult();

  const cacheKey = `kryptex:miner:${kryptex.coin}:${kryptex.address}:${kryptex.workerName ?? ""}`;
  return cachedService(cacheKey, CACHE_SECONDS.kryptex, async () => {
    const miner = `${BASE_URL}/${kryptex.coin}/api/v1/miner`;
    const address = encodeURIComponent(kryptex.address);

    const [balance, rewards, stats, payouts, workers] = await Promise.allSettled([
      get(`${miner}/balance/${address}`, kryptexBalanceSchema),
      get(`${miner}/reward-chart/${address}`, kryptexRewardChartSchema),
      get(`${miner}/payouts/${address}/stats`, kryptexPayoutStatsSchema),
      get(`${miner}/payouts/${address}`, kryptexPayoutsSchema),
      get(`${BASE_URL}/${kryptex.coin}/api/v3/miner/workers/${address}`, kryptexWorkersSchema),
    ]);

    const all = [balance, rewards, stats, payouts, workers];
    if (all.every((r) => r.status === "rejected")) throw (all[0] as PromiseRejectedResult).reason;

    const unavailable: string[] = [];
    const ok = <T>(name: string, r: PromiseSettledResult<T>): T | null => {
      if (r.status === "fulfilled") return r.value;
      unavailable.push(name);
      return null;
    };

    const balanceRaw = ok("sold", balance);
    const rewardsRaw = ok("istoric câștiguri", rewards);
    const statsRaw = ok("statistici plăți", stats);
    const payoutsRaw = ok("plăți", payouts);
    const workersRaw = ok("hashrate workeri", workers);
    const payoutStats = statsRaw ? normalizePayoutStats(statsRaw) : null;

    return {
      coin: kryptex.coin,
      balance: balanceRaw ? normalizeBalance(balanceRaw) : null,
      paid: payoutStats?.paid ?? null,
      unpaid: payoutStats?.unpaid ?? null,
      rewardWeek: payoutStats?.rewardWeek ?? null,
      rewardMonth: payoutStats?.rewardMonth ?? null,
      dailyRewards: rewardsRaw ? normalizeRewardChart(rewardsRaw) : null,
      payouts: payoutsRaw ? normalizePayouts(payoutsRaw) : null,
      pool: workersRaw ? normalizeWorkers(workersRaw, kryptex.workerName) : null,
      unavailable,
    } satisfies KryptexData;
  });
}

/** Pool-side hashrate chart (10-minute buckets, downsampled). `week` asks the pool for 7 days. */
export async function getKryptexHashrate(range: HashrateRange): Promise<ServiceResult<HashrateHistory>> {
  if (getServerConfig().mock) {
    return { status: "ok", data: mockHashrateHistory(range), fetchedAt: Date.now(), error: null };
  }
  const kryptex = await resolveKryptex();
  if (!kryptex) return unconfiguredResult();

  return cachedService(`kryptex:chart:${kryptex.coin}:${kryptex.address}:${range}`, 60, async () => {
    const query = range === "week" ? "?days=7" : "";
    const url = `${BASE_URL}/${kryptex.coin}/api/v1/miner/chart/${encodeURIComponent(kryptex.address)}${query}`;
    const raw = await get(url, kryptexHashrateChartSchema);
    return { range, points: normalizeHashrateChart(raw) };
  });
}
