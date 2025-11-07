import crypto from "crypto";
import type { NextRequest } from "next/server";
import { cookies as nextCookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  type SessionPayload,
  verifySessionValue,
} from "@/lib/auth/session";

const SESSION_SECRET =
  process.env.AUTH_SECRET ||
  process.env.SESSION_SECRET ||
  "PLEASE_ROTATE_AUTH_SECRET";
const SESSION_COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
const SESSION_COOKIE_SECURE = process.env.NODE_ENV === "production";
const SESSION_COOKIE_SAMESITE = (process.env.SAMESITE || "Lax").toLowerCase() as
  | "lax"
  | "strict"
  | "none";
const SESSION_MAX_AGE = Number(process.env.SESSION_TTL_SECONDS || 7 * 24 * 60 * 60);

function signSession(data: SessionPayload) {
  const json = JSON.stringify(data);
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(json).digest("hex");
  return `${Buffer.from(json).toString("base64")}.${signature}`;
}

function readRawCookie(req?: NextRequest) {
  if (req) {
    return req.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
  }
  try {
    return nextCookies().get(SESSION_COOKIE_NAME)?.value ?? null;
  } catch {
    return null;
  }
}

export async function getSession(req?: NextRequest): Promise<SessionPayload | null> {
  return verifySessionValue(readRawCookie(req));
}

export function setSession(res: any, session: SessionPayload) {
  const value = signSession(session);
  res.cookies.set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    secure: SESSION_COOKIE_SECURE,
    sameSite: SESSION_COOKIE_SAMESITE,
    path: "/",
    domain: SESSION_COOKIE_DOMAIN,
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSession(res: any) {
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: SESSION_COOKIE_SECURE,
    sameSite: SESSION_COOKIE_SAMESITE,
    path: "/",
    domain: SESSION_COOKIE_DOMAIN,
    maxAge: 0,
  });
}

export function hasSessionCookie(req: NextRequest) {
  return Boolean(readRawCookie(req));
}

export async function verifySessionCookie(req: NextRequest) {
  const session = await verifySessionValue(readRawCookie(req));
  if (!session) {
    return { valid: false as const, session: null };
  }
  return { valid: true as const, session };
}
