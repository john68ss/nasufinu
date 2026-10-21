import type { CoingeckoCoinRaw, CoingeckoMarketChartRaw } from "@/types/coingecko";
import type { PearlMarket, PricePoint } from "@/types/market";

const pick = (map: Record<string, number | null> | null | undefined, key: string): number | null => {
  const v = map?.[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
};

export function normalizeMarket(raw: CoingeckoCoinRaw, coinId: string): PearlMarket {
  const m = raw.market_data;
  const change = m.price_change_percentage_24h;
  const updated = raw.last_updated ? Date.parse(raw.last_updated) : NaN;
  return {
    coinId,
    name: raw.name ?? null,
    symbol: raw.symbol ? raw.symbol.toUpperCase() : null,
    priceUsd: pick(m.current_price, "usd"),
    priceEur: pick(m.current_price, "eur"),
    change24hPct: typeof change === "number" && Number.isFinite(change) ? change : null,
    high24hUsd: pick(m.high_24h, "usd"),
    low24hUsd: pick(m.low_24h, "usd"),
    marketCapUsd: pick(m.market_cap, "usd"),
    volume24hUsd: pick(m.total_volume, "usd"),
    sourceUpdatedAt: Number.isNaN(updated) ? null : updated,
  };
}

/** Evenly thins long series (e.g. 2k hourly points for 90D) so mobile charts stay light. */
export function normalizeHistory(raw: CoingeckoMarketChartRaw, maxPoints = 200): PricePoint[] {
  const all = raw.prices.map(([t, price]) => ({ t, price }));
  if (all.length <= maxPoints) return all;
  const step = (all.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, i) => all[Math.round(i * step)]);
}
