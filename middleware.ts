import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/callback",
  "/privacy",
  "/terms",
  "/medical-disclaimer",
  "/about",
  "/api/qa/selftest",
  "/healthz",
]);

const STATIC_PREFIXES = [
  "/_next",
  "/static",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/icon.png",
  "/apple-icon.png",
  "/assets",
];

const PROTECTED_PREFIXES = ["/dashboard", "/data", "/profile", "/settings", "/chart", "/learn"];

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "asinu.sid";
const SESSION_SECRET =
  process.env.AUTH_SECRET ||
  process.env.SESSION_SECRET ||
  "PLEASE_ROTATE_AUTH_SECRET";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function requiresAuth(pathname: string) {
  if (pathname === "/") return true;
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isDevBypass(req: NextRequest) {
  if (process.env.AUTH_DEV_MODE !== "true") return false;
  const host = req.headers.get("host") || "";
  return host.includes("localhost") || host.startsWith("127.0.0.1");
}

function decodeBase64ToString(b64: string): string | null {
  try {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(b64, "base64").toString("utf8");
    }
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return decoder.decode(bytes);
  } catch {
    return null;
  }
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const byte = Number.parseInt(hex.slice(i, i + 2), 16);
    if (Number.isNaN(byte)) {
      return null;
    }
    bytes[i / 2] = byte;
  }
  return bytes;
}

async function computeHmac(secret: string, value: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return new Uint8Array(signature);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function hasValidSessionCookie(req: NextRequest) {
  const raw = req.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
  if (!raw) return false;

  const [b64, signature] = raw.split(".");
  if (!b64 || !signature) return false;

  const json = decodeBase64ToString(b64);
  if (!json) return false;

  const expected = await computeHmac(SESSION_SECRET, json);
  const provided = hexToBytes(signature);
  if (!provided) return false;

  if (!timingSafeEqual(expected, provided)) {
    return false;
  }

  try {
    const payload = JSON.parse(json);
    return Boolean(payload?.user_id);
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname) || !requiresAuth(pathname) || isDevBypass(req)) {
    return NextResponse.next();
  }

  const validSession = await hasValidSessionCookie(req);
  if (!validSession) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl, { status: 302 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/data/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/chart/:path*",
    "/learn/:path*",
  ],
};
