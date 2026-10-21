import "server-only";
import { getServerConfig, type HashrateUnit } from "@/config/app";
import { decryptSecret } from "./crypto";
import { getEncryptionSecret, readSettings } from "./store";

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
  const secret = getEncryptionSecret();
  const saved = (await readSettings()).hiveos;
  return secret && saved ? decryptSecret(saved.tokenEnc, secret) : null;
}

/** Settings saved in the UI take priority over environment variables. */
export async function resolveHiveos(): Promise<HiveosCreds | null> {
  const config = getServerConfig();
  const saved = (await readSettings()).hiveos;
  if (saved?.farmId && saved.workerId) {
    const secret = getEncryptionSecret();
    const token = secret ? decryptSecret(saved.tokenEnc, secret) : null;
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

/** Per field: a value saved in Redis wins; otherwise the environment variable is used. */
export async function resolveKryptex(): Promise<KryptexCreds | null> {
  const saved = (await readSettings()).kryptex;
  const env = getServerConfig().kryptex;
  const address = saved?.address ?? env?.address;
  if (!address) return null;
  return {
    address,
    coin: saved?.coin ?? env?.coin ?? "prl",
    workerName: saved ? saved.workerName : (env?.workerName ?? null),
  };
}
