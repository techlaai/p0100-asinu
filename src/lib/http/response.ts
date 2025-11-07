import { NextResponse, type NextRequest } from "next/server";
import { ensureRequestId, withRequestIdHeader } from "@/lib/logging/request_id";
import type { ErrorCode } from "@/lib/errors/codes";
import { getErrorCodeMeta } from "@/lib/errors/codes";

type BaseInit = {
  request?: NextRequest | Request;
  requestId?: string;
  headers?: HeadersInit;
  cacheControl?: string | null;
};

type SuccessInit = BaseInit & {
  status?: number;
};

type ErrorInit = BaseInit & {
  status?: number;
  message?: string;
  details?: Record<string, unknown>;
};

const DEFAULT_CACHE_CONTROL = "no-store";

function buildHeaders(init: BaseInit, requestId: string): Headers {
  const headers = withRequestIdHeader(init.headers, requestId);
  if (init.cacheControl) {
    headers.set("Cache-Control", init.cacheControl);
  }
  return headers;
}

export function jsonSuccess<T>(data: T, init: SuccessInit = {}) {
  const requestId = init.requestId ?? ensureRequestId(init.request);
  const headers = buildHeaders(init, requestId);
  return NextResponse.json(
    { ok: true, data, request_id: requestId },
    { status: init.status ?? 200, headers },
  );
}

export function jsonError(code: ErrorCode, init: ErrorInit = {}) {
  const meta = getErrorCodeMeta(code);
  const status = init.status ?? meta.status;
  const requestId = init.requestId ?? ensureRequestId(init.request);
  const headers = buildHeaders(
    { ...init, cacheControl: init.cacheControl ?? DEFAULT_CACHE_CONTROL },
    requestId,
  );
  return NextResponse.json(
    {
      ok: false,
      code,
      message: init.message ?? meta.message,
      request_id: requestId,
      ...(init.details ? { details: init.details } : {}),
    },
    { status, headers },
  );
}
