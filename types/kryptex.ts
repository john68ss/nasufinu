import { z } from "zod";

/**
 * Kryptex Pool public API (https://pool.kryptex.com/api). No API key; keyed by wallet address.
 * The live responses differ from openapi.yaml (verified against a real address), so the schemas follow the live shape:
 * reward-chart uses `timestamp`, payout `date` is a numeric string, and workers expose `avg_hashrate_*` instead of `hashrate`.
 */
const looseNumber = z
  .union([z.number(), z.string().transform((s) => (s.trim() === "" ? Number.NaN : Number(s)))])
  .nullish()
  .catch(undefined);
const text = z.string().nullish().catch(undefined);

export const kryptexBalanceSchema = z.looseObject({
  total: looseNumber,
  threshold: looseNumber,
  reached_pct: looseNumber,
  unconfirmed: looseNumber,
  confirmed: looseNumber,
  last_active: looseNumber,
});

export const kryptexRewardChartSchema = z.array(
  z.looseObject({ timestamp: looseNumber, date: looseNumber, reward: looseNumber }),
);

export const kryptexPayoutStatsSchema = z.looseObject({
  paid: looseNumber,
  unpaid: looseNumber,
  reward: z.looseObject({ week: looseNumber, month: looseNumber }).nullish().catch(undefined),
});

export const kryptexPayoutsSchema = z.looseObject({
  count: looseNumber,
  results: z.array(
    z.looseObject({
      date: looseNumber,
      received: looseNumber,
      txid: text,
      status: text,
    }),
  ),
});

export const kryptexWorkersSchema = z.looseObject({
  results: z.array(
    z.looseObject({
      worker: z.string(),
      scheme: text,
      status: text,
      valid: looseNumber,
      stale: looseNumber,
      invalid: looseNumber,
      avg_hashrate_30m: looseNumber,
      avg_hashrate_3h: looseNumber,
      avg_hashrate_24h: looseNumber,
      agent: text,
      latest_agent: text,
      last_share: looseNumber,
    }),
  ),
});

export const kryptexHashrateChartSchema = z.array(
  z.looseObject({
    timestamp: looseNumber,
    valid: looseNumber,
    stale: looseNumber,
    invalid: looseNumber,
    hashrate: looseNumber,
    avg_hashrate_3h: looseNumber,
    avg_hashrate_30m: looseNumber,
  }),
);

export type KryptexBalanceRaw = z.infer<typeof kryptexBalanceSchema>;
export type KryptexRewardChartRaw = z.infer<typeof kryptexRewardChartSchema>;
export type KryptexPayoutStatsRaw = z.infer<typeof kryptexPayoutStatsSchema>;
export type KryptexPayoutsRaw = z.infer<typeof kryptexPayoutsSchema>;
export type KryptexWorkersRaw = z.infer<typeof kryptexWorkersSchema>;
export type KryptexHashrateChartRaw = z.infer<typeof kryptexHashrateChartSchema>;
