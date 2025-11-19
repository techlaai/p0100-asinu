import { NextRequest } from "next/server";
import { clearSession } from "@/infrastructure/auth/session";
import { jsonSuccess } from "@/lib/http/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const response = jsonSuccess({ ok: true }, { request: req });
  await clearSession(response, req);
  return response;
}
