import type { EarningsSummary, KryptexData } from "./earnings";
import type { FxRates, PearlMarket } from "./market";
import type { MiningRig } from "./mining";

export type ErrorKind =
  | "unconfigured"
  | "timeout"
  | "rate_limit"
  | "auth"
  | "not_found"
  | "unavailable"
  | "invalid_response";

/** Safe to send to the browser: never contains upstream bodies or secrets. */
export interface PublicError {
  kind: ErrorKind;
  message: string;
}

export type ServiceStatus = "ok" | "error" | "unconfigured";

/** When status is "error", `data` may still hold the last valid value (stale). */
export interface ServiceResult<T> {
  status: ServiceStatus;
  data: T | null;
  /** Unix ms when `data` was fetched from the upstream API. */
  fetchedAt: number | null;
  error: PublicError | null;
}

export interface Thresholds {
  tempWarnC: number;
  tempCritC: number;
  memTempWarnC: number;
  memTempCritC: number;
}

export type DisplayCurrency = "USD" | "EUR" | "RON";

/** Non-sensitive settings that are safe to expose to the browser. */
export interface PublicSettings {
  thresholds: Thresholds;
  displayCurrency: DisplayCurrency;
  electricityPriceRonKwh: number | null;
  refreshIntervalSeconds: number;
  expectedGpuCount: number;
  cacheSeconds: { hiveos: number; kryptex: number; pearlPrice: number; fx: number };
  coingeckoCoinId: string | null;
  kryptexCoin: string | null;
}

export interface Money {
  usd: number | null;
  eur: number | null;
  ron: number | null;
}

export interface EconomicsInputs {
  priceUsd: number | null;
  priceEur: number | null;
  dailyPrl: number | null;
  powerW: number | null;
  electricityRonKwh: number | null;
  fx: FxRates | null;
}

export interface Economics {
  inputs: EconomicsInputs;
  dailyKwh: number | null;
  dailyRevenue: Money;
  monthlyRevenue: Money;
  dailyElectricity: Money;
  monthlyElectricity: Money;
  dailyProfit: Money;
  monthlyProfit: Money;
  yearlyProfit: Money;
  /** Why revenue is missing, if it is. */
  revenueNote: string | null;
}

export type ApiState = "connected" | "error" | "unconfigured";

export interface ApiStatusEntry {
  id: "hiveos" | "kryptex" | "coingecko" | "fx";
  label: string;
  state: ApiState;
  message: string | null;
  lastSuccessAt: number | null;
}

export interface DashboardData {
  generatedAt: number;
  settings: PublicSettings;
  rig: ServiceResult<MiningRig>;
  kryptex: ServiceResult<KryptexData>;
  market: ServiceResult<PearlMarket>;
  fx: ServiceResult<FxRates>;
  earnings: EarningsSummary | null;
  economics: Economics;
  apiStatus: ApiStatusEntry[];
}
