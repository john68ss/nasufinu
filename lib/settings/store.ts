import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

export interface StoredHiveos {
  /** Encrypted with SESSION_SECRET; never leaves the server. */
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

function redisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

/** Vercel's filesystem is read-only/ephemeral, so a database is required there. */
export function getPersistence(): Persistence {
  if (redisConfig()) return "redis";
  return process.env.VERCEL ? "none" : "file";
}

async function redis(command: string[]): Promise<unknown> {
  const cfg = redisConfig();
  if (!cfg) throw new Error("redis not configured");
  const response = await fetch(cfg.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error(`redis http ${response.status}`);
  return ((await response.json()) as { result?: unknown }).result;
}

let memo: { value: StoredSettings; at: number } | null = null;
const MEMO_MS = 10_000;

export async function readSettings(): Promise<StoredSettings> {
  if (memo && Date.now() - memo.at < MEMO_MS) return memo.value;
  let value: StoredSettings = {};
  try {
    const mode = getPersistence();
    let raw: string | null = null;
    if (mode === "redis") raw = ((await redis(["GET", KEY])) as string | null) ?? null;
    else if (mode === "file") raw = await fs.readFile(FILE, "utf8").catch(() => null);
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
  const raw = JSON.stringify(next);
  if (mode === "redis") await redis(["SET", KEY, raw]);
  else {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, raw, { encoding: "utf8", mode: 0o600 });
  }
  memo = { value: next, at: Date.now() };
}
