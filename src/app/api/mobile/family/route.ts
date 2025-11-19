import { NextRequest } from "next/server";
import { getSession } from "@/infrastructure/auth/session";
import { featureGate } from "@/lib/middleware/featureGate";
import { jsonError, jsonSuccess } from "@/lib/http/response";
import { getMobileFamilyOverview } from "@/modules/mobile/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const gate = featureGate("RELATIVE_ENABLED");
  if (gate) return gate;

  const session = await getSession(req);
  if (!session) {
    return jsonError("UNAUTHORIZED", { request: req });
  }

  const overview = await getMobileFamilyOverview(session.user_id);
  return jsonSuccess(overview, { request: req, cacheControl: "no-store" });
}
