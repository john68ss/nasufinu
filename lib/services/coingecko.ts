import "server-only";
import { getServerConfig } from "@/config/app";
import { CACHE_SECONDS, HISTORY_CACHE_SECONDS } from "@/config/thresholds";
import { cachedService, unconfiguredResult } from "@/lib/cache/service-cache";
import { UpstreamError } from "@/lib/http/errors";
import { fetchJson } from "@/lib/http/fetch-json";
import { mockHistory, mockMarket } from "@/lib/mock";
import { normalizeHistory, normalizeMarket } from "@/lib/normalizers/coingecko";
import { coingeckoCoinSchema, coingeckoMarketChartSchema } from "@/types/coingecko";
import type { ServiceResult } from "@/types/dashboard";
import type { HistoryRange, PearlMarket, PriceHistory } from "@/types/market";

const DAYS: Record<HistoryRange, number> = { "24h": 1, "7d": 7, "30d": 30, "90d": 90 };

export const HISTORY_RANGES = Object.keys(DAYS) as HistoryRange[];

function request(path: string) {
  const config = getServerConfig().coingecko;
  if (!config) return null;
  // Demo keys use the public host + x-cg-demo-api-key; paid plans use pro-api + x-cg-pro-api-key.
  const pro = config.plan === "pro";
  const base = pro ? "https://pro-api.coingecko.com/api/v3" : "https://api.coingecko.com/api/v3";
  const headers: Record<string, string> = {};
  if (config.apiKey) headers[pro ? "x-cg-pro-api-key" : "x-cg-demo-api-key"] = config.apiKey;
  return { url: `${base}${path}`, headers, coinId: config.coinId };
}

export function getPearlMarket(): Promise<ServiceResult<PearlMarket>> {
  const config = getServerConfig();
  if (config.mock) return Promise.resolve({ status: "ok", data: mockMarket(), fetchedAt: Date.now(), error: null });
  const coin = config.coingecko;
  if (!coin) return Promise.resolve(unconfiguredResult());

  return cachedService(`coingecko:market:${coin.coinId}`, CACHE_SECONDS.pearlPrice, async () => {
    const query = "localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false";
    const req = request(`/coins/${encodeURIComponent(coin.coinId)}?${query}`);
    if (!req) throw new UpstreamError("unconfigured");
    const parsed = coingeckoCoinSchema.safeParse(await fetchJson(req.url, { headers: req.headers }));
    if (!parsed.success) throw new UpstreamError("invalid_response");
    return normalizeMarket(parsed.data, req.coinId);
  });
}

export function getPearlHistory(range: HistoryRange): Promise<ServiceResult<PriceHistory>> {
  const config = getServerConfig();
  if (config.mock) {
    return Promise.resolve({ status: "ok", data: mockHistory(range), fetchedAt: Date.now(), error: null });
  }
  const coin = config.coingecko;
  if (!coin) return Promise.resolve(unconfiguredResult());

  return cachedService(`coingecko:history:${coin.coinId}:${range}`, HISTORY_CACHE_SECONDS[range], async () => {
    const req = request(`/coins/${encodeURIComponent(coin.coinId)}/market_chart?vs_currency=usd&days=${DAYS[range]}`);
    if (!req) throw new UpstreamError("unconfigured");
    const parsed = coingeckoMarketChartSchema.safeParse(await fetchJson(req.url, { headers: req.headers }));
    if (!parsed.success) throw new UpstreamError("invalid_response");
    return { range, points: normalizeHistory(parsed.data) };
  });
}
