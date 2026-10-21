export interface PearlMarket {
  coinId: string;
  name: string | null;
  symbol: string | null;
  priceUsd: number | null;
  priceEur: number | null;
  change24hPct: number | null;
  high24hUsd: number | null;
  low24hUsd: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  /** Unix ms of CoinGecko's own last_updated. */
  sourceUpdatedAt: number | null;
}

export type HistoryRange = "24h" | "7d" | "30d" | "90d";

export interface PricePoint {
  t: number;
  price: number;
}

export interface PriceHistory {
  range: HistoryRange;
  points: PricePoint[];
}

export interface FxRates {
  /** RON per 1 USD. */
  ronPerUsd: number;
  /** RON per 1 EUR. */
  ronPerEur: number;
  /** EUR per 1 USD. */
  eurPerUsd: number;
  /** Reference date reported by the provider (YYYY-MM-DD). */
  date: string | null;
}
