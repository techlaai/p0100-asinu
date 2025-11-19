import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/infrastructure/auth/session";
import { featureGate } from "@/lib/middleware/featureGate";
import { MissionLimitError, MissionNotFoundError, missionService } from "@/modules/mission/service";
import { jsonError, jsonSuccess } from "@/lib/http/response";

const BodySchema = z.object({
  mission_id: z.string().uuid(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const gate = featureGate("FEATURE_MISSION");
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
    const result = await missionService.checkinMission(session.user_id, parsed.data.mission_id);
    return jsonSuccess(result, { request: req, cacheControl: "no-store" });
  } catch (error: any) {
    if (error instanceof MissionNotFoundError) {
      return jsonError("NOT_FOUND", { request: req, message: "Mission not available." });
    }
    if (error instanceof MissionLimitError) {
      return jsonError("CONFLICT", { request: req, message: "Mission đã đạt giới hạn hôm nay." });
    }
    console.error("[mobile] mission checkin failed", error);
    return jsonError("INTERNAL_ERROR", { request: req });
  }
}
