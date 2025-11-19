import { NextRequest } from "next/server";
import { getSession } from "@/infrastructure/auth/session";
import { featureGateAll } from "@/lib/middleware/featureGate";
import { jsonError, jsonSuccess } from "@/lib/http/response";
import { getMobileRewardsCatalog } from "@/modules/mobile/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const gate = featureGateAll("TREE_ENABLED", "REWARDS_ENABLED");
  if (gate) return gate;

  const session = await getSession(req);
  if (!session) {
    return jsonError("UNAUTHORIZED", { request: req });
  }

  const catalog = await getMobileRewardsCatalog(session.user_id);
  return jsonSuccess(catalog, { request: req, cacheControl: "no-store" });
}
