import type { HashrateUnit } from "@/config/app";
import type { HiveosWorkerRaw } from "@/types/hiveos";
import type { Gpu, MiningRig, ShareStats } from "@/types/mining";

const UNIT_TO_HS: Record<HashrateUnit, number> = { hs: 1, khs: 1e3, mhs: 1e6, ghs: 1e9 };
const ONLINE_FRESHNESS_SECONDS = 300;

const num = (v: number | null | undefined): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

function cleanModel(model: string | null | undefined): string | null {
  if (!model) return null;
  return model.replace(/^(NVIDIA|AMD|ATI)\s+(GeForce\s+|Radeon\s+)?/i, "").trim() || null;
}

function sum(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v != null);
  return present.length > 0 ? present.reduce((a, b) => a + b, 0) : null;
}

function normalizeGpus(raw: HiveosWorkerRaw, unit: number): Gpu[] {
  const stats = raw.gpu_stats ?? [];
  const info = raw.gpu_info ?? [];
  const rows = stats.length > 0 ? stats : info.map(() => ({}) as (typeof stats)[number]);

  return rows.map((stat, i) => {
    const meta =
      info.find((g) => (stat.bus_id && g.bus_id === stat.bus_id) || (stat.bus_number != null && g.bus_number === stat.bus_number)) ??
      info[i];
    const hash = num(stat.hash);
    const power = num(stat.power);
    const hashrateHs = hash != null ? hash * unit : null;
    return {
      index: i,
      busId: stat.bus_id ?? meta?.bus_id ?? null,
      model: cleanModel(meta?.model ?? meta?.short_name),
      brand: meta?.brand ?? null,
      hashrateHs,
      tempC: num(stat.temp),
      memTempC: num(stat.memtemp),
      fanPercent: num(stat.fan),
      powerW: power,
      efficiency: hashrateHs != null && power != null && power > 0 ? hashrateHs / power : null,
    };
  });
}

function normalizeShares(raw: HiveosWorkerRaw): ShareStats | null {
  const lists = raw.miners_stats?.hashrates ?? raw.miners_summary?.hashrates ?? [];
  const withShares = lists.map((h) => h.shares).filter((s) => s != null);
  if (withShares.length === 0) return null;
  return {
    accepted: sum(withShares.map((s) => num(s?.accepted))),
    rejected: sum(withShares.map((s) => num(s?.rejected))),
    invalid: sum(withShares.map((s) => num(s?.invalid))),
  };
}

export function normalizeHiveosWorker(raw: HiveosWorkerRaw, hashrateUnit: HashrateUnit, now = Date.now()): MiningRig {
  const unit = UNIT_TO_HS[hashrateUnit];
  const gpus = normalizeGpus(raw, unit);
  const stats = raw.stats ?? undefined;

  const bootTime = num(stats?.boot_time);
  const statsTimeMs = num(stats?.stats_time) != null ? (stats?.stats_time as number) * 1000 : null;
  const online =
    typeof stats?.online === "boolean"
      ? stats.online
      : statsTimeMs != null
        ? now - statsTimeMs < ONLINE_FRESHNESS_SECONDS * 1000
        : null;

  const gpuHash = sum(gpus.map((g) => g.hashrateHs));
  const gpuPower = sum(gpus.map((g) => g.powerW));
  const hardwarePower = num(raw.hardware_power_draw);
  const reportedPower = num(stats?.power_draw);
  const totalPowerW = reportedPower ?? (gpuPower != null ? gpuPower + (hardwarePower ?? 0) : null);
  const totalHashrateHs = online === false ? 0 : gpuHash;

  const miner = raw.miners_summary?.hashrates?.[0];

  return {
    workerId: num(raw.id),
    name: raw.name ?? null,
    online,
    uptimeSeconds: online !== false && bootTime != null ? Math.max(0, Math.floor(now / 1000 - bootTime)) : null,
    statsTime: statsTimeMs,
    miner: miner?.miner ?? null,
    algo: miner?.algo ?? null,
    coin: miner?.coin ?? null,
    totalHashrateHs,
    totalPowerW,
    gpuPowerW: gpuPower,
    efficiency:
      totalHashrateHs != null && totalHashrateHs > 0 && totalPowerW != null && totalPowerW > 0
        ? totalHashrateHs / totalPowerW
        : null,
    shares: normalizeShares(raw),
    gpus,
  };
}
