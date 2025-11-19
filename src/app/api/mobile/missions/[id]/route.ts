import { NextRequest } from "next/server";
import { getSession } from "@/infrastructure/auth/session";
import { featureGate } from "@/lib/middleware/featureGate";
import { jsonError, jsonSuccess } from "@/lib/http/response";
import { getMobileMissionDetail } from "@/modules/mobile/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = featureGate("FEATURE_MISSION");
  if (gate) return gate;

  const session = await getSession(req);
  if (!session) {
    return jsonError("UNAUTHORIZED", { request: req });
  }

  const detail = await getMobileMissionDetail(session.user_id, params.id);
  if (!detail) {
    return jsonError("NOT_FOUND", { request: req, message: "Mission not found." });
  }
  return jsonSuccess(detail, { request: req, cacheControl: "no-store" });
}
