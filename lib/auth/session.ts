import { SignJWT, jwtVerify } from "jose";

// Kept free of server-only imports so proxy.ts can use it.
const ISSUER = "pearl-mining-dashboard";
const AUDIENCE = "dashboard";

export interface SessionPayload {
  sub: string;
  exp: number;
}

const encode = (secret: string) => new TextEncoder().encode(secret);

export async function createSessionToken(secret: string, maxAgeSeconds: number): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("owner")
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(encode(secret));
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
): Promise<SessionPayload | null> {
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, encode(secret), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (payload.sub !== "owner" || typeof payload.exp !== "number") return null;
    return { sub: payload.sub, exp: payload.exp };
  } catch {
    return null;
  }
}
