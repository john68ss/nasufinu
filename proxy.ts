import { NextResponse, type NextRequest } from "next/server";
import { LOGIN_PATH, SESSION_COOKIE } from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/session";

const isDev = process.env.NODE_ENV === "development";

function buildCsp(nonce: string): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // React/Recharts set inline style attributes; scripts stay nonce-locked.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "manifest-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  return directives.join("; ");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
    process.env.SESSION_SECRET,
  );

  if (!session) {
    if (isApi) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    if (pathname !== LOGIN_PATH) {
      const url = new URL(LOGIN_PATH, request.url);
      if (/^\/[A-Za-z0-9\-_/]*$/.test(pathname) && pathname !== "/") url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  } else if (pathname === LOGIN_PATH) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isApi) return NextResponse.next();

  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals and public PWA assets (no private data in those).
    "/((?!_next/static|_next/image|favicon.ico|logo.png|icons/|manifest.webmanifest).*)",
  ],
};
