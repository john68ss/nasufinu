/** Internal earnings model. Amounts are in PEARL (the pool coin) unless stated. */

export interface DailyReward {
  /** Unix ms of the UTC day start. */
  day: number;
  reward: number;
}

export interface Payout {
  date: number;
  received: number;
  status: string | null;
  txid: string | null;
}

export interface KryptexBalance {
  total: number | null;
  confirmed: number | null;
  unconfirmed: number | null;
  threshold: number | null;
  reachedPct: number | null;
}

export interface KryptexWorker {
  name: string;
  online: boolean;
  /** Payout scheme as the pool reports it, e.g. "pps". */
  scheme: string | null;
  hashrate30mHs: number | null;
  hashrate3hHs: number | null;
  hashrate24hHs: number | null;
  valid: number | null;
  stale: number | null;
  invalid: number | null;
  /** Mining software as seen by the pool. */
  agent: string | null;
  /** The pool reports a newer version of the mining software. */
  outdated: boolean;
  lastShareAt: number | null;
}

export interface KryptexPool {
  workersOnline: number;
  workersOffline: number;
  /** Hashrate sums across workers, in H/s, as averaged by the pool. */
  hashrate30mHs: number | null;
  hashrate3hHs: number | null;
  hashrate24hHs: number | null;
  /** Unix ms of the most recent share. */
  lastShareAt: number | null;
  workers: KryptexWorker[];
}

export type HashrateRange = "day" | "week";

export interface HashratePoint {
  t: number;
  hashrate30mHs: number | null;
  hashrate3hHs: number | null;
  stale: number;
  invalid: number;
}

export interface HashrateHistory {
  range: HashrateRange;
  points: HashratePoint[];
}

export interface KryptexData {
  coin: string;
  balance: KryptexBalance | null;
  paid: number | null;
  unpaid: number | null;
  rewardWeek: number | null;
  rewardMonth: number | null;
  dailyRewards: DailyReward[] | null;
  payouts: Payout[] | null;
  pool: KryptexPool | null;
  /** Sections the pool API could not deliver in this refresh. */
  unavailable: string[];
}

export interface EarningsSummary {
  todayPrl: number | null;
  yesterdayPrl: number | null;
  last7dPrl: number | null;
  last30dPrl: number | null;
  /** Mean of up to 7 completed UTC days. */
  avgDailyPrl: number | null;
  /** avgDailyPrl * 30 — an estimate, not a pool figure. */
  estMonthlyPrl: number | null;
}
