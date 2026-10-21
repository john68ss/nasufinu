import "server-only";
import { getPublicSettings } from "@/config/app";
import { computeEconomics } from "@/lib/calculations/economics";
import { summarizeEarnings } from "@/lib/calculations/earnings";
import { publicError } from "@/lib/http/errors";
import { getPearlMarket } from "@/lib/services/coingecko";
import { getFxRates } from "@/lib/services/fx";
import { getRig } from "@/lib/services/hiveos";
import { getKryptex } from "@/lib/services/kryptex";
import type { ApiStatusEntry, DashboardData, ServiceResult } from "@/types/dashboard";

function settled<T>(result: PromiseSettledResult<ServiceResult<T>>): ServiceResult<T> {
  if (result.status === "fulfilled") return result.value;
  return { status: "error", data: null, fetchedAt: null, error: publicError("unavailable") };
}

function statusEntry(
  id: ApiStatusEntry["id"],
  label: string,
  result: ServiceResult<unknown>,
): ApiStatusEntry {
  return {
    id,
    label,
    state: result.status === "ok" ? "connected" : result.status === "unconfigured" ? "unconfigured" : "error",
    message: result.status === "ok" ? null : (result.error?.message ?? null),
    lastSuccessAt: result.fetchedAt,
  };
}

/** One aggregated, normalized snapshot. A failing integration never fails the whole dashboard. */
export async function getDashboardData(): Promise<DashboardData> {
  const settings = getPublicSettings();

  const [rigR, kryptexR, marketR, fxR] = await Promise.allSettled([
    getRig(),
    getKryptex(),
    getPearlMarket(),
    getFxRates(),
  ]);
  const rig = settled(rigR);
  const kryptex = settled(kryptexR);
  const market = settled(marketR);
  const fx = settled(fxR);

  const earnings = summarizeEarnings(kryptex.data);
  const economics = computeEconomics({
    priceUsd: market.data?.priceUsd ?? null,
    priceEur: market.data?.priceEur ?? null,
    dailyPrl: earnings?.avgDailyPrl ?? null,
    // An offline rig's last reading is not its current consumption.
    powerW: rig.data?.online === false ? null : (rig.data?.totalPowerW ?? null),
    electricityRonKwh: settings.electricityPriceRonKwh,
    fx: fx.data,
  });

  return {
    generatedAt: Date.now(),
    settings,
    rig,
    kryptex,
    market,
    fx,
    earnings,
    economics,
    apiStatus: [
      statusEntry("hiveos", "HiveOS", rig),
      statusEntry("kryptex", "Kryptex", kryptex),
      statusEntry("coingecko", "CoinGecko", market),
      statusEntry("fx", "Cursuri valutare", fx),
    ],
  };
}
