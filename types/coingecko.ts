import { z } from "zod";

/** CoinGecko API v3: /coins/{id} (subset) and /coins/{id}/market_chart. */
const currencyMap = z.record(z.string(), z.number().nullable()).nullish().catch(undefined);
const n = z.number().nullish().catch(undefined);

export const coingeckoCoinSchema = z.looseObject({
  id: z.string(),
  symbol: z.string().nullish().catch(undefined),
  name: z.string().nullish().catch(undefined),
  last_updated: z.string().nullish().catch(undefined),
  market_data: z.looseObject({
    current_price: currencyMap,
    price_change_percentage_24h: n,
    high_24h: currencyMap,
    low_24h: currencyMap,
    market_cap: currencyMap,
    total_volume: currencyMap,
  }),
});

export const coingeckoMarketChartSchema = z.looseObject({
  prices: z.array(z.tuple([z.number(), z.number()])),
});

export type CoingeckoCoinRaw = z.infer<typeof coingeckoCoinSchema>;
export type CoingeckoMarketChartRaw = z.infer<typeof coingeckoMarketChartSchema>;

export const frankfurterRatesSchema = z.array(
  z.looseObject({ date: z.string().nullish().catch(undefined), base: z.string(), quote: z.string(), rate: z.number() }),
);
