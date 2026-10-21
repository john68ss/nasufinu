import "server-only";
import { getServerConfig } from "@/config/app";
import { CACHE_SECONDS } from "@/config/thresholds";
import { cachedService } from "@/lib/cache/service-cache";
import { UpstreamError } from "@/lib/http/errors";
import { fetchJson } from "@/lib/http/fetch-json";
import { mockFx } from "@/lib/mock";
import { frankfurterRatesSchema } from "@/types/coingecko";
import type { ServiceResult } from "@/types/dashboard";
import type { FxRates } from "@/types/market";

// Frankfurter (ECB-based, no API key): https://frankfurter.dev — GET /v2/rates?base=USD&quotes=RON,EUR
const RATES_URL = "https://api.frankfurter.dev/v2/rates?base=USD&quotes=RON,EUR";

export function getFxRates(): Promise<ServiceResult<FxRates>> {
  if (getServerConfig().mock) return Promise.resolve({ status: "ok", data: mockFx(), fetchedAt: Date.now(), error: null });

  return cachedService("fx:usd", CACHE_SECONDS.fx, async () => {
    const parsed = frankfurterRatesSchema.safeParse(await fetchJson(RATES_URL));
    if (!parsed.success) throw new UpstreamError("invalid_response");
    const ron = parsed.data.find((r) => r.quote === "RON");
    const eur = parsed.data.find((r) => r.quote === "EUR");
    if (!ron || !eur || ron.rate <= 0 || eur.rate <= 0) throw new UpstreamError("invalid_response");
    return {
      ronPerUsd: ron.rate,
      eurPerUsd: eur.rate,
      ronPerEur: ron.rate / eur.rate,
      date: ron.date ?? null,
    };
  });
}
