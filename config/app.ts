import "server-only";
import { z } from "zod";
import { CACHE_SECONDS, DEFAULT_THRESHOLDS } from "@/config/thresholds";
import type { DisplayCurrency, PublicSettings, Thresholds } from "@/types/dashboard";

const blank = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const opt = <T extends z.ZodType>(schema: T) => z.preprocess(blank, schema.optional());
const withDefault = <T extends z.ZodType>(schema: T, value: z.output<T>) =>
  z.preprocess(blank, schema.default(value as never));
const num = (min: number, max: number) => z.coerce.number().min(min).max(max);

const shape = {
  AUTH_USERNAME: opt(z.string().min(1).max(128)),
  AUTH_PASSWORD_HASH: opt(z.string().regex(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/)),
  SESSION_SECRET: opt(z.string().min(32)),
  SESSION_MAX_AGE_HOURS: withDefault(num(1, 24 * 30), 72),

  HIVEOS_API_TOKEN: opt(z.string().min(10)),
  HIVEOS_FARM_ID: opt(z.string().regex(/^\d{1,12}$/)),
  HIVEOS_WORKER_ID: opt(z.string().regex(/^\d{1,12}$/)),
  HIVEOS_HASHRATE_UNIT: withDefault(z.enum(["hs", "khs", "mhs", "ghs"]), "khs"),

  KRYPTEX_WALLET_ADDRESS: opt(z.string().regex(/^[A-Za-z0-9._:-]{6,160}$/)),
  KRYPTEX_COIN: withDefault(z.string().regex(/^[a-z0-9-]{2,24}$/), "prl"),
  KRYPTEX_WORKER_NAME: opt(z.string().regex(/^[A-Za-z0-9._-]{1,64}$/)),

  COINGECKO_COIN_ID: opt(z.string().regex(/^[a-z0-9-]{1,64}$/)),
  COINGECKO_API_KEY: opt(z.string().min(5)),
  COINGECKO_API_PLAN: withDefault(z.enum(["demo", "pro"]), "demo"),

  ELECTRICITY_PRICE_RON_KWH: opt(num(0, 100)),
  DISPLAY_CURRENCY: withDefault(z.enum(["USD", "EUR", "RON"]), "RON"),
  REFRESH_INTERVAL_SECONDS: withDefault(num(15, 600), 30),
  EXPECTED_GPU_COUNT: withDefault(z.coerce.number().int().min(1).max(64), 10),

  GPU_TEMP_WARN_C: withDefault(num(30, 120), DEFAULT_THRESHOLDS.tempWarnC),
  GPU_TEMP_CRIT_C: withDefault(num(30, 130), DEFAULT_THRESHOLDS.tempCritC),
  GPU_MEM_TEMP_WARN_C: withDefault(num(30, 130), DEFAULT_THRESHOLDS.memTempWarnC),
  GPU_MEM_TEMP_CRIT_C: withDefault(num(30, 150), DEFAULT_THRESHOLDS.memTempCritC),

  USE_MOCK_DATA: withDefault(z.enum(["true", "false"]), "false"),
} satisfies Record<string, z.ZodType>;

type EnvValues = { [K in keyof typeof shape]?: z.output<(typeof shape)[K]> };

export type HashrateUnit = "hs" | "khs" | "mhs" | "ghs";

export interface ServerConfig {
  auth: {
    username: string;
    passwordHash: string;
    sessionSecret: string;
    sessionMaxAgeSeconds: number;
  } | null;
  hiveos: { token: string; farmId: string; workerId: string; hashrateUnit: HashrateUnit } | null;
  kryptex: { address: string; coin: string; workerName: string | null } | null;
  coingecko: { coinId: string; apiKey: string | null; plan: "demo" | "pro" } | null;
  mock: boolean;
  publicSettings: PublicSettings;
  /** Names of invalid variables (never their values). */
  invalidVars: string[];
}

function readEnv(): { values: EnvValues; invalid: string[] } {
  const values: Record<string, unknown> = {};
  const invalid: string[] = [];
  for (const key of Object.keys(shape) as (keyof typeof shape)[]) {
    const result = shape[key].safeParse(process.env[key]);
    if (result.success) values[key] = result.data;
    else invalid.push(key);
  }
  return { values: values as EnvValues, invalid };
}

function resolveThresholds(v: EnvValues, invalid: string[]): Thresholds {
  const t: Thresholds = {
    tempWarnC: v.GPU_TEMP_WARN_C ?? DEFAULT_THRESHOLDS.tempWarnC,
    tempCritC: v.GPU_TEMP_CRIT_C ?? DEFAULT_THRESHOLDS.tempCritC,
    memTempWarnC: v.GPU_MEM_TEMP_WARN_C ?? DEFAULT_THRESHOLDS.memTempWarnC,
    memTempCritC: v.GPU_MEM_TEMP_CRIT_C ?? DEFAULT_THRESHOLDS.memTempCritC,
  };
  if (t.tempWarnC >= t.tempCritC) {
    invalid.push("GPU_TEMP_WARN_C");
    t.tempWarnC = DEFAULT_THRESHOLDS.tempWarnC;
    t.tempCritC = DEFAULT_THRESHOLDS.tempCritC;
  }
  if (t.memTempWarnC >= t.memTempCritC) {
    invalid.push("GPU_MEM_TEMP_WARN_C");
    t.memTempWarnC = DEFAULT_THRESHOLDS.memTempWarnC;
    t.memTempCritC = DEFAULT_THRESHOLDS.memTempCritC;
  }
  return t;
}

let cached: ServerConfig | null = null;

export function getServerConfig(): ServerConfig {
  if (cached) return cached;

  const { values: v, invalid } = readEnv();
  const thresholds = resolveThresholds(v, invalid);
  const coin = v.KRYPTEX_COIN ?? "prl";

  cached = {
    auth:
      v.AUTH_USERNAME && v.AUTH_PASSWORD_HASH && v.SESSION_SECRET
        ? {
            username: v.AUTH_USERNAME,
            passwordHash: v.AUTH_PASSWORD_HASH,
            sessionSecret: v.SESSION_SECRET,
            sessionMaxAgeSeconds: Math.round((v.SESSION_MAX_AGE_HOURS ?? 72) * 3600),
          }
        : null,
    hiveos:
      v.HIVEOS_API_TOKEN && v.HIVEOS_FARM_ID && v.HIVEOS_WORKER_ID
        ? {
            token: v.HIVEOS_API_TOKEN,
            farmId: v.HIVEOS_FARM_ID,
            workerId: v.HIVEOS_WORKER_ID,
            hashrateUnit: v.HIVEOS_HASHRATE_UNIT ?? "khs",
          }
        : null,
    kryptex: v.KRYPTEX_WALLET_ADDRESS
      ? { address: v.KRYPTEX_WALLET_ADDRESS, coin, workerName: v.KRYPTEX_WORKER_NAME ?? null }
      : null,
    coingecko: v.COINGECKO_COIN_ID
      ? { coinId: v.COINGECKO_COIN_ID, apiKey: v.COINGECKO_API_KEY ?? null, plan: v.COINGECKO_API_PLAN ?? "demo" }
      : null,
    // Development-only fallback; can never be enabled in production.
    mock: v.USE_MOCK_DATA === "true" && process.env.NODE_ENV !== "production",
    invalidVars: invalid,
    publicSettings: {
      thresholds,
      displayCurrency: (v.DISPLAY_CURRENCY ?? "RON") as DisplayCurrency,
      electricityPriceRonKwh: v.ELECTRICITY_PRICE_RON_KWH ?? null,
      refreshIntervalSeconds: v.REFRESH_INTERVAL_SECONDS ?? 30,
      expectedGpuCount: v.EXPECTED_GPU_COUNT ?? 10,
      cacheSeconds: { ...CACHE_SECONDS },
      coingeckoCoinId: v.COINGECKO_COIN_ID ?? null,
      kryptexCoin: v.KRYPTEX_WALLET_ADDRESS ? coin : null,
    },
  };

  if (invalid.length > 0) console.warn(`[config] invalid environment variables: ${invalid.join(", ")}`);
  return cached;
}

export function getPublicSettings(): PublicSettings {
  return getServerConfig().publicSettings;
}
