import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/infrastructure/auth/session";
import { featureGateAll } from "@/lib/middleware/featureGate";
import { jsonError, jsonSuccess } from "@/lib/http/response";
import { redeemMobileReward } from "@/modules/mobile/service";
import { RewardServiceError } from "@/modules/rewards/errors";

const BodySchema = z.object({
  reward_id: z.string().min(1),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const gate = featureGateAll("TREE_ENABLED", "REWARDS_ENABLED");
  if (gate) return gate;

  const session = await getSession(req);
  if (!session) {
    return jsonError("UNAUTHORIZED", { request: req });
  }

  const payload = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", { request: req, details: parsed.error.flatten() });
  }

  try {
    const redemption = await redeemMobileReward(session.user_id, parsed.data.reward_id);
    return jsonSuccess(redemption, { request: req, cacheControl: "no-store", status: 201 });
  } catch (error: any) {
    if (error instanceof RewardServiceError) {
      return jsonError(error.status === 409 ? "CONFLICT" : "BAD_REQUEST", {
        request: req,
        message: error.message,
        status: error.status,
      });
    }
    console.error("[mobile] reward redeem failed", error);
    return jsonError("INTERNAL_ERROR", { request: req });
  }
}
