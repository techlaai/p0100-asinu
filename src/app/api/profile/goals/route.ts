import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/getUserId";
import { ProfilesRepo } from "@/infrastructure/repositories/ProfilesRepo";
import { jsonError, jsonSuccess } from "@/lib/http/response";

const goalsSchema = z.object({
  primaryGoal: z.string(),
  targetWeight: z.number().min(1).max(300),
  targetHbA1c: z.number().min(1).max(20),
  dailySteps: z.number().min(0),
  waterCups: z.number().min(0),
});

export async function POST(req: NextRequest) {
  const userId = await requireAuth(req).catch(() => null);
  if (!userId) {
    return jsonError("UNAUTHORIZED", { request: req });
  }

  const json = await req.json().catch(() => null);
  const parsed = goalsSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", { request: req, details: parsed.error.flatten() });
  }

  try {
    const repo = new ProfilesRepo();
    const updated = await repo.update(userId, { prefs: { goals: parsed.data } as any });
    return jsonSuccess(updated.prefs?.goals ?? parsed.data, {
      request: req,
      cacheControl: "no-store",
    });
  } catch (error) {
    console.error("POST /api/profile/goals failed", error);
    return jsonError("INTERNAL_ERROR", { request: req });
  }
}

export async function GET(req: NextRequest) {
  const userId = await requireAuth(req).catch(() => null);
  if (!userId) {
    return jsonError("UNAUTHORIZED", { request: req });
  }

  try {
    const repo = new ProfilesRepo();
    const profile = await repo.getById(userId);
    const goals = profile?.prefs?.goals;
    if (!goals) {
      return jsonError("NOT_FOUND", { request: req, message: "Goals not found." });
    }
    return jsonSuccess(goals, { request: req });
  } catch (error) {
    console.error("GET /api/profile/goals failed", error);
    return jsonError("INTERNAL_ERROR", { request: req });
  }
}
