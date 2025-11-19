import { NextRequest } from "next/server";
import { getSession } from "@/infrastructure/auth/session";
import { featureGateAll } from "@/lib/middleware/featureGate";
import { jsonError, jsonSuccess } from "@/lib/http/response";
import { getDonationSummary } from "@/modules/mobile/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const gate = featureGateAll("REWARDS_ENABLED", "DONATION_ENABLED");
  if (gate) return gate;

  const session = await getSession(req);
  if (!session) {
    return jsonError("UNAUTHORIZED", { request: req });
  }

  const summary = await getDonationSummary(session.user_id);
  return jsonSuccess(summary, { request: req, cacheControl: "no-store" });
}
