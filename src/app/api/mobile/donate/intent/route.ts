import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/infrastructure/auth/session";
import { featureGateAll } from "@/lib/middleware/featureGate";
import { jsonError, jsonSuccess } from "@/lib/http/response";
import { createMobileDonation } from "@/modules/mobile/service";
import { RewardServiceError } from "@/modules/rewards/errors";

const BodySchema = z.object({
  provider: z.string().min(2).max(64),
  amount_points: z.number().int().min(0).optional(),
  amount_vnd: z.number().int().min(0).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const gate = featureGateAll("REWARDS_ENABLED", "DONATION_ENABLED");
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
    const donation = await createMobileDonation(session.user_id, parsed.data);
    return jsonSuccess(donation, { request: req, cacheControl: "no-store", status: 201 });
  } catch (error: any) {
    if (error instanceof RewardServiceError) {
      return jsonError(error.status === 409 ? "CONFLICT" : "BAD_REQUEST", {
        request: req,
        message: error.message,
        status: error.status,
        details: error.meta,
      });
    }
    console.error("[mobile] donate intent failed", error);
    return jsonError("INTERNAL_ERROR", { request: req });
  }
}
