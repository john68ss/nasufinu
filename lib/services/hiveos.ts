import "server-only";
import { getServerConfig } from "@/config/app";
import { CACHE_SECONDS } from "@/config/thresholds";
import { cachedService, unconfiguredResult } from "@/lib/cache/service-cache";
import { UpstreamError } from "@/lib/http/errors";
import { fetchJson } from "@/lib/http/fetch-json";
import { mockRig } from "@/lib/mock";
import { normalizeHiveosWorker } from "@/lib/normalizers/hiveos";
import { resolveHiveos } from "@/lib/settings/resolve";
import { hiveosWorkerSchema } from "@/types/hiveos";
import type { ServiceResult } from "@/types/dashboard";
import type { MiningRig } from "@/types/mining";

// Official docs: https://api2.hiveos.farm/api/v2 (Bearer token). Endpoint: GET /farms/{farmId}/workers/{workerId}.
const BASE_URL = "https://api2.hiveos.farm/api/v2";

export async function getRig(): Promise<ServiceResult<MiningRig>> {
  if (getServerConfig().mock) return { status: "ok", data: mockRig(), fetchedAt: Date.now(), error: null };

  const hiveos = await resolveHiveos();
  if (!hiveos) return unconfiguredResult();

  return cachedService(`hiveos:worker:${hiveos.farmId}:${hiveos.workerId}`, CACHE_SECONDS.hiveos, async () => {
    const url = `${BASE_URL}/farms/${encodeURIComponent(hiveos.farmId)}/workers/${encodeURIComponent(hiveos.workerId)}`;
    const json = await fetchJson(url, { headers: { Authorization: `Bearer ${hiveos.token}` } });
    const parsed = hiveosWorkerSchema.safeParse(json);
    if (!parsed.success) throw new UpstreamError("invalid_response");
    return normalizeHiveosWorker(parsed.data, hiveos.hashrateUnit);
  });
}
