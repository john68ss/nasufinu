import "server-only";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/guard";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

export function jsonResponse(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export function unauthorized(): NextResponse {
  return jsonResponse({ error: "unauthorized" }, 401);
}

/** Wraps a route handler so it always requires a valid session and never leaks internals. */
export function withAuth(handler: (request: Request) => Promise<NextResponse>) {
  return async (request: Request): Promise<NextResponse> => {
    if (!(await getSession())) return unauthorized();
    try {
      return await handler(request);
    } catch {
      return jsonResponse({ error: "internal_error" }, 500);
    }
  };
}
