import "server-only";
import { getServerConfig } from "@/config/app";
import { getPersistence, readSettings } from "./store";

/** Non-secret summary for the settings page. */
export async function getIntegrationSummary() {
  const stored = await readSettings();
  const env = getServerConfig();
  return {
    persistence: getPersistence(),
    hiveos: {
      hasToken: Boolean(stored.hiveos?.tokenEnc),
      farmName: stored.hiveos?.farmName ?? null,
      workerName: stored.hiveos?.workerName ?? null,
      selected: Boolean(stored.hiveos?.workerId),
      fromEnv: !stored.hiveos?.workerId && Boolean(env.hiveos),
    },
    kryptex: {
      address: stored.kryptex?.address ?? env.kryptex?.address ?? "",
      coin: stored.kryptex?.coin ?? env.kryptex?.coin ?? "prl",
      workerName: stored.kryptex ? (stored.kryptex.workerName ?? "") : (env.kryptex?.workerName ?? ""),
      saved: Boolean(stored.kryptex),
      fromEnv: !stored.kryptex && Boolean(env.kryptex),
    },
  };
}

export type IntegrationSummary = Awaited<ReturnType<typeof getIntegrationSummary>>;
