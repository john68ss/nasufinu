import { z } from "zod";

/**
 * HiveOS API v2: GET /farms/{farmId}/workers/{workerId} -> Worker.
 * The official swagger only types `stats`, `gpu_stats`, `miners_summary` and `miners_stats` as
 * generic objects, so every field here is optional and unexpected types are dropped (never thrown).
 * Run `npm run inspect:hiveos` to compare against your own worker's real payload.
 */
const lenient = <T extends z.ZodType>(schema: T) => schema.nullish().catch(undefined);

const gpuStat = z.looseObject({
  bus_id: lenient(z.string()),
  bus_number: lenient(z.number()),
  hash: lenient(z.number()),
  temp: lenient(z.number()),
  memtemp: lenient(z.number()),
  fan: lenient(z.number()),
  power: lenient(z.number()),
});

const gpuInfo = z.looseObject({
  bus_id: lenient(z.string()),
  bus_number: lenient(z.number()),
  brand: lenient(z.string()),
  model: lenient(z.string()),
  short_name: lenient(z.string()),
  index: lenient(z.number()),
});

const shares = z.looseObject({
  accepted: lenient(z.number()),
  rejected: lenient(z.number()),
  invalid: lenient(z.number()),
});

const minerHashrate = z.looseObject({
  miner: lenient(z.string()),
  algo: lenient(z.string()),
  coin: lenient(z.string()),
  shares: lenient(shares),
});

export const hiveosWorkerSchema = z.looseObject({
  id: lenient(z.number()),
  name: lenient(z.string()),
  stats: lenient(
    z.looseObject({
      online: lenient(z.boolean()),
      boot_time: lenient(z.number()),
      stats_time: lenient(z.number()),
      power_draw: lenient(z.number()),
    }),
  ),
  gpu_stats: lenient(z.array(gpuStat)),
  gpu_info: lenient(z.array(gpuInfo)),
  miners_summary: lenient(z.looseObject({ hashrates: lenient(z.array(minerHashrate)) })),
  miners_stats: lenient(z.looseObject({ hashrates: lenient(z.array(minerHashrate)) })),
  hardware_power_draw: lenient(z.number()),
});

export type HiveosWorkerRaw = z.infer<typeof hiveosWorkerSchema>;
