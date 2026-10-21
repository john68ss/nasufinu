import type { ErrorKind, PublicError } from "@/types/dashboard";

const PUBLIC_MESSAGES: Record<ErrorKind, string> = {
  unconfigured: "Neconfigurat",
  timeout: "Cererea a expirat",
  rate_limit: "Limită de cereri atinsă la furnizor",
  auth: "Autentificare respinsă (verifică tokenul)",
  not_found: "Resursă negăsită (verifică ID-urile configurate)",
  unavailable: "Serviciu indisponibil temporar",
  invalid_response: "Format de răspuns neașteptat",
};

/** Internal error; its message is never sent to the browser, only `toPublic()`. */
export class UpstreamError extends Error {
  constructor(
    readonly kind: ErrorKind,
    readonly status?: number,
    readonly retryAfterMs?: number,
  ) {
    super(kind);
    this.name = "UpstreamError";
  }

  toPublic(): PublicError {
    return { kind: this.kind, message: PUBLIC_MESSAGES[this.kind] };
  }
}

export function toPublicError(error: unknown): PublicError {
  if (error instanceof UpstreamError) return error.toPublic();
  return { kind: "unavailable", message: PUBLIC_MESSAGES.unavailable };
}

export function publicError(kind: ErrorKind): PublicError {
  return { kind, message: PUBLIC_MESSAGES[kind] };
}
