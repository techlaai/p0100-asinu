import { NextRequest } from "next/server";
import { getSession } from "@/infrastructure/auth/session";
import { jsonError, jsonSuccess } from "@/lib/http/response";
import { getMobileDashboard } from "@/modules/mobile/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return jsonError("UNAUTHORIZED", { request: req });
  }

  const dashboard = await getMobileDashboard(session.user_id, session.display_name ?? undefined);
  return jsonSuccess(dashboard, { request: req, cacheControl: "no-store" });
}
