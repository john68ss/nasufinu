import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import { getServerConfig } from "@/config/app";

export interface StoredHiveos {
  /** Encrypted with getEncryptionSecret(); never leaves the server. */
  tokenEnc: string;
  farmId?: string;
  farmName?: string;
  workerId?: string;
  workerName?: string;
}

export interface StoredKryptex {
  address: string;
  coin: string;
  workerName: string | null;
}

export interface StoredSettings {
  hiveos?: StoredHiveos;
  kryptex?: StoredKryptex;
}

export type Persistence = "redis" | "file" | "none";

const KEY = "pearl-dashboard:settings:v1";
const FILE = path.join(process.cwd(), ".data", "settings.json");

// Vercel's Upstash integration writes <PREFIX>KV_REST_API_URL / <PREFIX>KV_REST_API_TOKEN, where the prefix
// (e.g. "STORAGE_") is chosen when connecting the database. Upstash's own naming is also supported.
const NAME_PAIRS = [
  { url: "UPSTASH_REDIS_REST_URL", token: "UPSTASH_REDIS_REST_TOKEN" },
  { url: "KV_REST_API_URL", token: "KV_REST_API_TOKEN" },
];

function redisConfig(): { url: string; token: string } | null {
  const env = process.env;
  for (const pair of NAME_PAIRS) {
    const names = Object.keys(env)
      .filter((name) => name.endsWith(pair.url) && env[name])
      .sort((a, b) => a.length - b.length);
    for (const name of names) {
      const token = env[`${name.slice(0, -pair.url.length)}${pair.token}`];
      if (token) return { url: env[name]!, token };
    }
  }
  return null;
}

let client: { key: string; redis: Redis } | null = null;

function getRedis(): Redis {
  const cfg = redisConfig();
  if (!cfg) throw new Error("redis not configured");
  const key = `${cfg.url}|${cfg.token}`;
  if (!client || client.key !== key) client = { key, redis: new Redis({ url: cfg.url, token: cfg.token }) };
  return client.redis;
}

/** Vercel's filesystem is read-only/ephemeral, so a database is required there. */
export function getPersistence(): Persistence {
  if (redisConfig()) return "redis";
  return process.env.VERCEL ? "none" : "file";
}

/** Key used to encrypt the saved HiveOS token: SETTINGS_SECRET if set, otherwise the server-side Redis token. */
export function getEncryptionSecret(): string | null {
  return getServerConfig().settingsSecret ?? redisConfig()?.token ?? null;
}

let memo: { value: StoredSettings; at: number } | null = null;
const MEMO_MS = 10_000;

export async function readSettings(): Promise<StoredSettings> {
  if (memo && Date.now() - memo.at < MEMO_MS) return memo.value;
  let value: StoredSettings = {};
  try {
    const mode = getPersistence();
    let raw: string | null = null;
    if (mode === "redis") {
      const stored = await getRedis().get<StoredSettings | string>(KEY);
      if (stored && typeof stored === "object") value = stored;
      else if (typeof stored === "string") raw = stored;
    } else if (mode === "file") raw = await fs.readFile(FILE, "utf8").catch(() => null);
    if (raw) value = JSON.parse(raw) as StoredSettings;
  } catch {
    console.error("[settings] could not read stored settings");
  }
  memo = { value, at: Date.now() };
  return value;
}

export async function updateSettings(update: (current: StoredSettings) => StoredSettings): Promise<void> {
  const mode = getPersistence();
  if (mode === "none") throw new Error("no persistent storage");
  memo = null;
  const next = update(await readSettings());
  if (mode === "redis") await getRedis().set(KEY, next);
  else {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(next), { encoding: "utf8", mode: 0o600 });
  }
  memo = { value: next, at: Date.now() };
}
