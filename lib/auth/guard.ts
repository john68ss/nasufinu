import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerConfig } from "@/config/app";
import { LOGIN_PATH, SESSION_COOKIE } from "./constants";
import { verifySessionToken, type SessionPayload } from "./session";

export async function getSession(): Promise<SessionPayload | null> {
  const config = getServerConfig();
  if (!config.auth) return null;
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value, config.auth.sessionSecret);
}

/** For pages/layouts: defence in depth on top of proxy.ts. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect(LOGIN_PATH);
  return session;
}
