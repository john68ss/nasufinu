const HASH_UNITS = ["H/s", "kH/s", "MH/s", "GH/s", "TH/s", "PH/s", "EH/s", "ZH/s"] as const;
const HASH_PREFIX = ["H", "kH", "MH", "GH", "TH", "PH", "EH", "ZH"] as const;

export const DASH = "—";

function trimDecimals(value: number, digits: number) {
  return value.toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

export function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return DASH;
  return value.toLocaleString("ro-RO", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function scaleHash(valueHs: number): { value: number; index: number } {
  let value = Math.abs(valueHs);
  let index = 0;
  while (value >= 1000 && index < HASH_UNITS.length - 1) {
    value /= 1000;
    index += 1;
  }
  return { value: valueHs < 0 ? -value : value, index };
}

/** Auto-scaled SI hashrate, e.g. 1.23e9 -> "1.23 GH/s". */
export function formatHashrate(valueHs: number | null | undefined): string {
  if (valueHs == null || !Number.isFinite(valueHs)) return DASH;
  if (valueHs === 0) return "0 H/s";
  const { value, index } = scaleHash(valueHs);
  return `${trimDecimals(value, value >= 100 ? 1 : 2)} ${HASH_UNITS[index]}`;
}

/** Hashrate per watt with an auto-scaled prefix, e.g. "420 kH/W". */
export function formatEfficiency(hsPerW: number | null | undefined): string {
  if (hsPerW == null || !Number.isFinite(hsPerW)) return DASH;
  if (hsPerW === 0) return "0 H/W";
  const { value, index } = scaleHash(hsPerW);
  return `${trimDecimals(value, value >= 100 ? 1 : 2)} ${HASH_PREFIX[index]}/W`;
}

export function formatTemp(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return DASH;
  return `${Math.round(value)}°C`;
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return DASH;
  return `${formatNumber(value, digits)}%`;
}

export function formatSignedPercent(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return DASH;
  return `${value > 0 ? "+" : ""}${formatNumber(value, digits)}%`;
}

export function formatWatts(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return DASH;
  return `${Math.round(value).toLocaleString("ro-RO")} W`;
}

export function formatKwh(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return DASH;
  return `${formatNumber(value, 2)} kWh`;
}

/** Amounts of the mined coin; keeps enough precision for small values. */
export function formatCoin(value: number | null | undefined, symbol = "PEARL"): string {
  if (value == null || !Number.isFinite(value)) return DASH;
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 2 : abs >= 1 ? 3 : 5;
  return `${formatNumber(value, digits)} ${symbol}`;
}

const SYMBOL: Record<string, string> = { USD: "$", EUR: "€", RON: "RON" };

export function formatMoney(value: number | null | undefined, currency: "USD" | "EUR" | "RON", digits?: number): string {
  if (value == null || !Number.isFinite(value)) return DASH;
  const abs = Math.abs(value);
  const d = digits ?? (abs > 0 && abs < 1 ? 4 : 2);
  const text = formatNumber(Math.abs(value), d);
  const sign = value < 0 ? "-" : "";
  return currency === "RON" ? `${sign}${text} RON` : `${sign}${SYMBOL[currency]}${text}`;
}

export function formatCompactMoney(value: number | null | undefined, currency: "USD" | "EUR" = "USD"): string {
  if (value == null || !Number.isFinite(value)) return DASH;
  const text = new Intl.NumberFormat("ro-RO", { notation: "compact", maximumFractionDigits: 2 }).format(value);
  return `${SYMBOL[currency]}${text}`;
}

export function formatUptime(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return DASH;
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}z ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
