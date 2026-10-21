import type { Thresholds } from "@/types/dashboard";
import type { Gpu, GpuLevel, GpuStatus, MiningRig } from "@/types/mining";

export function levelFor(value: number | null, warn: number, crit: number): GpuLevel {
  if (value == null || !Number.isFinite(value)) return "unknown";
  if (value >= crit) return "critical";
  if (value >= warn) return "warning";
  return "ok";
}

export const tempLevel = (value: number | null, t: Thresholds) => levelFor(value, t.tempWarnC, t.tempCritC);
export const memTempLevel = (value: number | null, t: Thresholds) => levelFor(value, t.memTempWarnC, t.memTempCritC);

const RANK: Record<GpuLevel, number> = { unknown: 0, ok: 0, warning: 1, critical: 2 };

export function gpuStatus(gpu: Gpu, rigOnline: boolean | null, t: Thresholds): GpuStatus {
  if (rigOnline === false) return "offline";
  const worst = RANK[tempLevel(gpu.tempC, t)] >= RANK[memTempLevel(gpu.memTempC, t)]
    ? tempLevel(gpu.tempC, t)
    : memTempLevel(gpu.memTempC, t);
  if (worst === "critical") return "critical";
  if (worst === "warning") return "warning";
  if (gpu.hashrateHs === 0) return "idle";
  return "ok";
}

export interface GpuSummary {
  total: number;
  ok: number;
  warning: number;
  critical: number;
  idle: number;
  offline: number;
}

export function summarizeGpus(rig: MiningRig, t: Thresholds): GpuSummary {
  const summary: GpuSummary = { total: rig.gpus.length, ok: 0, warning: 0, critical: 0, idle: 0, offline: 0 };
  for (const gpu of rig.gpus) summary[gpuStatus(gpu, rig.online, t)] += 1;
  return summary;
}
