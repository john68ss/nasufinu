import "server-only";
import { getServerConfig, type HashrateUnit } from "@/config/app";
import { decryptSecret } from "./crypto";
import { readSettings } from "./store";

export interface HiveosCreds {
  token: string;
  farmId: string;
  workerId: string;
  hashrateUnit: HashrateUnit;
}

export interface KryptexCreds {
  address: string;
  coin: string;
  workerName: string | null;
}

/** Decrypted saved token, if any (used while picking a worker). */
export async function getSavedHiveosToken(): Promise<string | null> {
  const secret = getServerConfig().settingsSecret;
  const saved = (await readSettings()).hiveos;
  return secret && saved ? decryptSecret(saved.tokenEnc, secret) : null;
}

/** Settings saved in the UI take priority over environment variables. */
export async function resolveHiveos(): Promise<HiveosCreds | null> {
  const config = getServerConfig();
  const saved = (await readSettings()).hiveos;
  if (saved?.farmId && saved.workerId) {
    const token = config.settingsSecret ? decryptSecret(saved.tokenEnc, config.settingsSecret) : null;
    if (token) {
      return {
        token,
        farmId: saved.farmId,
        workerId: saved.workerId,
        hashrateUnit: config.hiveos?.hashrateUnit ?? "khs",
      };
    }
  }
  return config.hiveos;
}

export async function resolveKryptex(): Promise<KryptexCreds | null> {
  const saved = (await readSettings()).kryptex;
  return saved ?? getServerConfig().kryptex;
}
