import "server-only";
import { DAY_MS, utcDayStart } from "@/lib/utils/time";
import type { HashrateHistory, KryptexData } from "@/types/earnings";
import type { FxRates, HistoryRange, PearlMarket, PriceHistory } from "@/types/market";
import type { Gpu, MiningRig } from "@/types/mining";

// Development-only sample data (USE_MOCK_DATA=true). Ignored in production builds (see config/app.ts).

const MODELS = ["RTX 3090", "RTX 3090", "RTX 3080 Ti", "RTX 3080 Ti", "RTX 3090", "RTX 3070", "RTX 3070", "RTX 3090", "RTX 3080", "RTX 3080"];

export function mockRig(): MiningRig {
  const wobble = (seed: number, amp: number) => Math.sin(Date.now() / 20_000 + seed) * amp;
  const gpus: Gpu[] = MODELS.map((model, i) => {
    const hashrateHs = i === 6 ? 0 : (110 + i * 3 + wobble(i, 2)) * 1e6;
    const powerW = i === 6 ? 62 : 270 + i * 4 + wobble(i, 4);
    return {
      index: i,
      busId: `0${i}:00.0`,
      model,
      brand: "nvidia",
      hashrateHs,
      tempC: i === 3 ? 74 : i === 8 ? 83 : 56 + (i % 5) * 2 + wobble(i, 1),
      memTempC: i === 5 ? 96 : i === 8 ? 102 : 78 + (i % 4) * 3 + wobble(i, 1),
      fanPercent: 62 + (i % 4) * 5,
      powerW,
      efficiency: powerW > 0 ? hashrateHs / powerW : null,
    };
  });
  const totalHashrateHs = gpus.reduce((a, g) => a + (g.hashrateHs ?? 0), 0);
  const gpuPowerW = gpus.reduce((a, g) => a + (g.powerW ?? 0), 0);
  const totalPowerW = gpuPowerW + 140;
  return {
    workerId: 1234567,
    name: "rig-01",
    online: true,
    uptimeSeconds: 3 * 86400 + 5 * 3600 + 20 * 60,
    statsTime: Date.now() - 12_000,
    miner: "sample-miner",
    algo: "PearlHash",
    coin: "PRL",
    totalHashrateHs,
    totalPowerW,
    gpuPowerW,
    efficiency: totalHashrateHs / totalPowerW,
    shares: { accepted: 18342, rejected: 41, invalid: 3 },
    gpus,
  };
}

export function mockKryptex(): KryptexData {
  const today = utcDayStart(Date.now());
  const dailyRewards = Array.from({ length: 31 }, (_, i) => ({
    day: today - (30 - i) * DAY_MS,
    reward: 7.2 + Math.sin(i / 3) * 0.9 + (i % 5) * 0.1,
  }));
  return {
    coin: "prl",
    balance: { total: 3.82, confirmed: 3.1, unconfirmed: 0.72, threshold: 1, reachedPct: 100 },
    paid: 142.6,
    unpaid: 3.82,
    rewardWeek: 51.9,
    rewardMonth: 224.3,
    dailyRewards,
    payouts: [
      { date: Date.now() - 2 * DAY_MS, received: 12.4, status: "paid", txid: null },
      { date: Date.now() - 5 * DAY_MS, received: 11.8, status: "paid", txid: null },
    ],
    pool: {
      workersOnline: 1,
      workersOffline: 0,
      hashrate30mHs: 7.8e14,
      hashrate3hHs: 8.5e14,
      hashrate24hHs: 8.3e14,
      lastShareAt: Date.now() - 8000,
      workers: [
        {
          name: "sample-worker",
          online: true,
          scheme: "pps",
          hashrate30mHs: 7.8e14,
          hashrate3hHs: 8.5e14,
          hashrate24hHs: 8.3e14,
          valid: 4013,
          stale: 7,
          invalid: 0,
          agent: "SampleMiner/1.0",
          outdated: true,
          lastShareAt: Date.now() - 8000,
        },
      ],
    },
    unavailable: [],
  };
}

export function mockMarket(): PearlMarket {
  return {
    coinId: "pearl-2",
    name: "Pearl",
    symbol: "PEARL",
    priceUsd: 2.34,
    priceEur: 2.09,
    change24hPct: 7.05,
    high24hUsd: 2.46,
    low24hUsd: 2.08,
    marketCapUsd: 827_000_000,
    volume24hUsd: 14_200_000,
    sourceUpdatedAt: Date.now() - 30_000,
  };
}

export function mockHistory(range: HistoryRange): PriceHistory {
  const hours = { "24h": 24, "7d": 168, "30d": 720, "90d": 2160 }[range];
  const count = 120;
  const now = Date.now();
  const points = Array.from({ length: count }, (_, i) => {
    const t = now - ((count - 1 - i) / (count - 1)) * hours * 3_600_000;
    return { t, price: 2.1 + Math.sin(i / 9) * 0.12 + i * 0.002 };
  });
  return { range, points };
}

export function mockFx(): FxRates {
  return { ronPerUsd: 4.75, ronPerEur: 5.33, eurPerUsd: 0.89, date: null };
}

export function mockHashrateHistory(range: "day" | "week"): HashrateHistory {
  const count = 144;
  const span = (range === "day" ? 24 : 168) * 3_600_000;
  const now = Date.now();
  const points = Array.from({ length: count }, (_, i) => ({
    t: now - ((count - 1 - i) / (count - 1)) * span,
    hashrate30mHs: (8 + Math.sin(i / 6) * 1.4) * 1e14,
    hashrate3hHs: (8.4 + Math.sin(i / 14) * 0.7) * 1e14,
    stale: i % 37 === 0 ? 1 : 0,
    invalid: 0,
  }));
  return { range, points };
}
