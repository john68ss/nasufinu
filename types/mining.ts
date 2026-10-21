/** Internal, API-agnostic mining rig model. Hashrate is always in H/s. */

export interface Gpu {
  index: number;
  busId: string | null;
  model: string | null;
  brand: string | null;
  hashrateHs: number | null;
  tempC: number | null;
  memTempC: number | null;
  fanPercent: number | null;
  powerW: number | null;
  /** H/s per watt. */
  efficiency: number | null;
}

export interface ShareStats {
  accepted: number | null;
  rejected: number | null;
  invalid: number | null;
}

export interface MiningRig {
  workerId: number | null;
  name: string | null;
  /** null = HiveOS did not report an online flag. */
  online: boolean | null;
  uptimeSeconds: number | null;
  /** Unix ms of the last stats packet the worker sent to HiveOS. */
  statsTime: number | null;
  miner: string | null;
  algo: string | null;
  coin: string | null;
  totalHashrateHs: number | null;
  totalPowerW: number | null;
  gpuPowerW: number | null;
  /** Efficiency in H/s per watt (total hashrate / total power). */
  efficiency: number | null;
  shares: ShareStats | null;
  gpus: Gpu[];
}

export type GpuLevel = "ok" | "warning" | "critical" | "unknown";
export type GpuStatus = "ok" | "warning" | "critical" | "idle" | "offline";
