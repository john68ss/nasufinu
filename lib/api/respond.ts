import "server-only";
import { NextResponse } from "next/server";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

export function jsonResponse(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

/** Wraps a route handler so it never leaks internals. */
export function withErrorHandling(handler: (request: Request) => Promise<NextResponse>) {
  return async (request: Request): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch {
      return jsonResponse({ error: "internal_error" }, 500);
    }
  };
}
