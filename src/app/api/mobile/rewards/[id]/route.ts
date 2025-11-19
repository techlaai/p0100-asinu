import { NextRequest } from "next/server";
import { getSession } from "@/infrastructure/auth/session";
import { featureGateAll } from "@/lib/middleware/featureGate";
import { jsonError, jsonSuccess } from "@/lib/http/response";
import { getMobileRewardDetail } from "@/modules/mobile/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = featureGateAll("TREE_ENABLED", "REWARDS_ENABLED");
  if (gate) return gate;

  const session = await getSession(req);
  if (!session) {
    return jsonError("UNAUTHORIZED", { request: req });
  }

  const detail = await getMobileRewardDetail(session.user_id, params.id);
  if (!detail) {
    return jsonError("NOT_FOUND", { request: req, message: "Reward not found." });
  }

  return jsonSuccess(detail, { request: req, cacheControl: "no-store" });
}
