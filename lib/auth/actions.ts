"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getServerConfig } from "@/config/app";
import { HOME_PATH, LOGIN_PATH, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth/constants";
import { verifyCredentials } from "@/lib/auth/password";
import { checkLoginAllowed, clearLoginFailures, recordLoginFailure } from "@/lib/auth/rate-limit";
import { createSessionToken } from "@/lib/auth/session";

export interface LoginState {
  error: string | null;
}

const GENERIC_ERROR = "Utilizator sau parolă invalide.";

const loginSchema = z.object({
  username: z.string().min(1).max(128),
  password: z.string().min(1).max(256),
  next: z.string().max(200).optional(),
});

/** Only same-site, absolute app paths; blocks open redirects such as //evil.com. */
function safeNextPath(value: string | undefined): string {
  if (!value || !/^\/[A-Za-z0-9\-_/]*$/.test(value) || value.startsWith("//") || value === LOGIN_PATH) {
    return HOME_PATH;
  }
  return value;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const config = getServerConfig();
  if (!config.auth) {
    console.error("[auth] AUTH_USERNAME, AUTH_PASSWORD_HASH and SESSION_SECRET must be configured");
    return { error: "Autentificarea nu este disponibilă momentan." };
  }

  const ip = await clientIp();
  const limit = checkLoginAllowed(ip);
  if (!limit.allowed) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
    return { error: `Prea multe încercări. Încearcă din nou peste ${minutes} min.` };
  }

  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    recordLoginFailure(ip);
    await sleep(500);
    return { error: GENERIC_ERROR };
  }

  const ok = await verifyCredentials(parsed.data, {
    username: config.auth.username,
    passwordHash: config.auth.passwordHash,
  });
  if (!ok) {
    recordLoginFailure(ip);
    await sleep(500);
    return { error: GENERIC_ERROR };
  }

  clearLoginFailures(ip);
  const token = await createSessionToken(config.auth.sessionSecret, config.auth.sessionMaxAgeSeconds);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { ...SESSION_COOKIE_OPTIONS, maxAge: config.auth.sessionMaxAgeSeconds });
  redirect(safeNextPath(parsed.data.next));
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  redirect(LOGIN_PATH);
}
