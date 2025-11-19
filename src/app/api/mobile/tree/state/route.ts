import { NextRequest } from "next/server";
import { getSession } from "@/infrastructure/auth/session";
import { featureGate } from "@/lib/middleware/featureGate";
import { jsonError, jsonSuccess } from "@/lib/http/response";
import { getMobileTree } from "@/modules/mobile/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const gate = featureGate("TREE_ENABLED");
  if (gate) return gate;

  const session = await getSession(req);
  if (!session) {
    return jsonError("UNAUTHORIZED", { request: req });
  }

  const state = await getMobileTree(session.user_id);
  return jsonSuccess(state, { request: req, cacheControl: "no-store" });
}
