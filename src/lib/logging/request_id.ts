const REQUEST_ID_HEADER = "x-request-id";

type HeaderSource = Pick<Request, "headers"> | { headers: Headers } | null | undefined;

function hasSubtleRandomUUID(): boolean {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function";
}

function generateRandomId(): string {
  if (hasSubtleRandomUUID()) {
    return crypto.randomUUID();
  }
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i += 1) {
    const index = Math.floor(Math.random() * alphabet.length);
    result += alphabet[index];
  }
  return result;
}

export function readRequestId(source?: HeaderSource): string | null {
  if (!source) return null;
  return source.headers.get(REQUEST_ID_HEADER) ?? null;
}

export function ensureRequestId(source?: HeaderSource, fallback?: string): string {
  return readRequestId(source) ?? fallback ?? generateRandomId();
}

export function withRequestIdHeader(
  headers: HeadersInit | undefined,
  requestId: string,
): Headers {
  const nextHeaders = new Headers(headers ?? undefined);
  nextHeaders.set("X-Request-Id", requestId);
  return nextHeaders;
}
