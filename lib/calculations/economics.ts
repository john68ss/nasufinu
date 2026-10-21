import type { Economics, EconomicsInputs, Money } from "@/types/dashboard";
import type { FxRates } from "@/types/market";

const EMPTY: Money = { usd: null, eur: null, ron: null };
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;

const mul = (a: number | null, b: number | null) => (a != null && b != null ? a * b : null);

export function moneyFromUsd(usd: number | null, fx: FxRates | null): Money {
  if (usd == null) return EMPTY;
  return { usd, eur: fx ? usd * fx.eurPerUsd : null, ron: fx ? usd * fx.ronPerUsd : null };
}

export function moneyFromRon(ron: number | null, fx: FxRates | null): Money {
  if (ron == null) return EMPTY;
  return { ron, usd: fx ? ron / fx.ronPerUsd : null, eur: fx ? ron / fx.ronPerEur : null };
}

const scale = (m: Money, factor: number): Money => ({
  usd: mul(m.usd, factor),
  eur: mul(m.eur, factor),
  ron: mul(m.ron, factor),
});

/** Profit is computed in RON (electricity is priced in RON) and converted with the live FX rates. */
function subtract(revenue: Money, cost: Money, fx: FxRates | null): Money {
  if (revenue.ron == null || cost.ron == null) return EMPTY;
  return moneyFromRon(revenue.ron - cost.ron, fx);
}

/**
 * Pure economics: used for the real figures (server) and the what-if calculator (browser).
 * Anything that cannot be computed from real inputs stays null — nothing is guessed.
 */
export function computeEconomics(inputs: EconomicsInputs): Economics {
  const { priceUsd, dailyPrl, powerW, electricityRonKwh, fx } = inputs;

  const dailyKwh = powerW != null ? (powerW * 24) / 1000 : null;
  const dailyRevenueUsd = mul(dailyPrl, priceUsd);
  const dailyRevenue = moneyFromUsd(dailyRevenueUsd, fx);
  // Prefer CoinGecko's own EUR quote over a derived one (the calculator passes priceEur = null).
  if (dailyRevenue.usd != null && inputs.priceEur != null && dailyPrl != null) {
    dailyRevenue.eur = dailyPrl * inputs.priceEur;
  }

  const dailyElectricity = moneyFromRon(mul(dailyKwh, electricityRonKwh), fx);
  const monthlyRevenue = scale(dailyRevenue, DAYS_PER_MONTH);
  const monthlyElectricity = scale(dailyElectricity, DAYS_PER_MONTH);
  const dailyProfit = subtract(dailyRevenue, dailyElectricity, fx);

  let revenueNote: string | null = null;
  if (dailyPrl == null) revenueNote = "Producția zilnică de PEARL nu este disponibilă de la pool.";
  else if (priceUsd == null) revenueNote = "Prețul PEARL nu este disponibil.";
  else if (!fx) revenueNote = "Cursurile valutare nu sunt disponibile, deci valorile în RON nu pot fi calculate.";
  else if (electricityRonKwh == null) revenueNote = "Setează ELECTRICITY_PRICE_RON_KWH pentru a calcula profitul.";

  return {
    inputs,
    dailyKwh,
    dailyRevenue,
    monthlyRevenue,
    dailyElectricity,
    monthlyElectricity,
    dailyProfit,
    monthlyProfit: scale(dailyProfit, DAYS_PER_MONTH),
    yearlyProfit: scale(dailyProfit, DAYS_PER_YEAR),
    revenueNote,
  };
}
