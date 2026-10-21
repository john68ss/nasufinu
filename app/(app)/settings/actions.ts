"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerConfig } from "@/config/app";
import { clearServiceCache } from "@/lib/cache/service-cache";
import { fetchJson } from "@/lib/http/fetch-json";
import { encryptSecret } from "@/lib/settings/crypto";
import { getSavedHiveosToken } from "@/lib/settings/resolve";
import { getPersistence, updateSettings } from "@/lib/settings/store";

const HIVEOS = "https://api2.hiveos.farm/api/v2";
const KRYPTEX = "https://pool.kryptex.com";

export interface FarmOption {
  id: string;
  name: string;
  workers: { id: string; name: string }[];
}

export interface FormState {
  error: string | null;
  message: string | null;
  farms: FarmOption[] | null;
}

const idle: FormState = { error: null, message: null, farms: null };
const fail = (error: string): FormState => ({ ...idle, error });
const done = (message: string, farms: FarmOption[] | null = null): FormState => ({ error: null, message, farms });

const STORAGE_ERROR =
  "Nu este disponibilă stocare persistentă. Pe Vercel, adaugă integrarea Upstash Redis (vezi README) pentru a putea salva setările.";

function refresh() {
  clearServiceCache("hiveos:");
  clearServiceCache("kryptex:");
  revalidatePath("/settings");
  revalidatePath("/");
}

const listSchema = z.object({
  data: z.array(z.object({ id: z.coerce.number(), name: z.string().nullish() })),
});

async function loadFarms(token: string): Promise<FarmOption[]> {
  const headers = { Authorization: `Bearer ${token}` };
  const farms = listSchema.parse(await fetchJson(`${HIVEOS}/farms`, { headers })).data.slice(0, 10);
  return Promise.all(
    farms.map(async (farm) => {
      const workers = listSchema.parse(await fetchJson(`${HIVEOS}/farms/${farm.id}/workers`, { headers })).data;
      return {
        id: String(farm.id),
        name: farm.name ?? `Fermă ${farm.id}`,
        workers: workers.slice(0, 100).map((w) => ({ id: String(w.id), name: w.name ?? `Worker ${w.id}` })),
      };
    }),
  );
}

function hiveosError(error: unknown): string {
  const kind = (error as { kind?: string } | null)?.kind;
  if (kind === "auth") return "HiveOS a respins acest token. Creează un Personal Access Token nou și încearcă din nou.";
  if (kind === "rate_limit") return "HiveOS limitează cererile. Așteaptă un minut și încearcă din nou.";
  if (kind === "timeout") return "HiveOS nu a răspuns la timp. Încearcă din nou.";
  return "Contul HiveOS nu a putut fi citit cu acest token.";
}

/** Verifies the token, saves it encrypted, and returns farms/workers to pick from. */
export async function connectHiveosAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const secret = getServerConfig().settingsSecret;
  if (!secret) return fail("Lipsește variabila de mediu SETTINGS_SECRET (minim 32 de caractere).");
  if (getPersistence() === "none") return fail(STORAGE_ERROR);

  const input = z.string().trim().max(4096).regex(/^[^\s]*$/).safeParse(formData.get("token") ?? "");
  if (!input.success) return fail("Tokenul nu trebuie să conțină spații.");
  const token = input.data || (await getSavedHiveosToken());
  if (!token) return fail("Lipește Personal Access Token-ul HiveOS.");

  let farms: FarmOption[];
  try {
    farms = await loadFarms(token);
  } catch (error) {
    return fail(hiveosError(error));
  }

  const only = farms.length === 1 && farms[0].workers.length === 1 ? { farm: farms[0], worker: farms[0].workers[0] } : null;
  try {
    await updateSettings((s) => ({
      ...s,
      hiveos: {
        tokenEnc: encryptSecret(token, secret),
        ...(only
          ? { farmId: only.farm.id, farmName: only.farm.name, workerId: only.worker.id, workerName: only.worker.name }
          : {}),
      },
    }));
  } catch {
    return fail(STORAGE_ERROR);
  }
  refresh();
  if (farms.every((f) => f.workers.length === 0)) return done("Conectat, dar acest cont nu are încă niciun worker.", farms);
  return done(only ? `Conectat la ${only.worker.name}.` : "Conectat. Alege workerul de monitorizat.", farms);
}

const selectSchema = z.object({ worker: z.string().regex(/^\d{1,12}:\d{1,12}$/) });

export async function selectHiveosWorkerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (getPersistence() === "none") return fail(STORAGE_ERROR);
  const parsed = selectSchema.safeParse({ worker: formData.get("worker") });
  if (!parsed.success) return fail("Alege un worker.");
  const [farmId, workerId] = parsed.data.worker.split(":");

  const token = await getSavedHiveosToken();
  if (!token) return fail("Conectează mai întai tokenul HiveOS.");

  let farms: FarmOption[];
  try {
    farms = await loadFarms(token);
  } catch (error) {
    return fail(hiveosError(error));
  }
  const farm = farms.find((f) => f.id === farmId);
  const worker = farm?.workers.find((w) => w.id === workerId);
  if (!farm || !worker) return fail("Workerul nu a fost găsit în contul tău.");

  try {
    await updateSettings((s) => ({
      ...s,
      hiveos: {
        tokenEnc: s.hiveos?.tokenEnc ?? "",
        farmId: farm.id,
        farmName: farm.name,
        workerId: worker.id,
        workerName: worker.name,
      },
    }));
  } catch {
    return fail(STORAGE_ERROR);
  }
  refresh();
  return done(`Se monitorizează acum ${worker.name}.`, farms);
}

export async function disconnectHiveosAction(): Promise<FormState> {
  try {
    await updateSettings((s) => ({ ...s, hiveos: undefined }));
  } catch {
    return fail(STORAGE_ERROR);
  }
  refresh();
  return done("HiveOS deconectat.");
}

const walletSchema = z.object({
  address: z.string().trim().regex(/^[A-Za-z0-9._:-]{6,160}$/, "Aceasta nu pare o adresă de portofel validă."),
  coin: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,24}$/, "Monedă invalidă."),
  workerName: z.string().trim().regex(/^[A-Za-z0-9._-]{0,64}$/, "Nume de worker invalid."),
});

export async function saveWalletAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (getPersistence() === "none") return fail(STORAGE_ERROR);
  const parsed = walletSchema.safeParse({
    address: formData.get("address") ?? "",
    coin: (formData.get("coin") as string | null) || "prl",
    workerName: formData.get("workerName") ?? "",
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Date invalide.");
  const { address, coin, workerName } = parsed.data;

  try {
    await updateSettings((s) => ({ ...s, kryptex: { address, coin, workerName: workerName || null } }));
  } catch {
    return fail(STORAGE_ERROR);
  }
  refresh();

  try {
    await fetchJson(`${KRYPTEX}/${coin}/api/v1/miner/balance/${encodeURIComponent(address)}`, { retries: 0 });
    return done("Portofel salvat. Kryptex a răspuns.");
  } catch {
    return done("Portofel salvat, dar Kryptex nu a returnat încă date pentru el. Verifică adresa și moneda.");
  }
}

export async function removeWalletAction(): Promise<FormState> {
  try {
    await updateSettings((s) => ({ ...s, kryptex: undefined }));
  } catch {
    return fail(STORAGE_ERROR);
  }
  refresh();
  return done("Portofel șters.");
}
