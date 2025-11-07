import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/getUserId";
import { ProfilesRepo } from "@/infrastructure/repositories/ProfilesRepo";
import { jsonError, jsonSuccess } from "@/lib/http/response";

// Define a schema for the incoming setupData
const setupDataSchema = z.object({
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  height: z.number().optional(),
  weight: z.number().optional(),
  conditions: z.array(z.string()).optional(),
  goals: z.object({
    primaryGoal: z.string(),
    targetWeight: z.number(),
    targetHbA1c: z.number(),
    dailySteps: z.number(),
    waterCups: z.number(),
  }).optional(),
  preferences: z.object({
    reminderTimes: z.array(z.string()).optional(),
    shareWithFamily: z.boolean().optional(),
    notifications: z.boolean().optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  const userId = await requireAuth(req).catch(() => null);
  if (!userId) {
    return jsonError("UNAUTHORIZED", { request: req });
  }

  const body = await req.json().catch(() => null);
  const setupPayload = body?.setupData;
  const parsed = setupDataSchema.safeParse(setupPayload);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", { request: req, details: parsed.error.flatten() });
  }

  try {
    const repo = new ProfilesRepo();
    const setupData = parsed.data;
    const updatedProfile = await repo.update(userId, {
      dob: setupData.birthDate,
      sex: setupData.gender?.toLowerCase() as any,
      height_cm: setupData.height,
      weight_kg: setupData.weight,
      conditions: setupData.conditions,
      prefs: {
        onboarded: true,
        goals: setupData.goals,
        preferences: setupData.preferences,
      },
    });

    return jsonSuccess(updatedProfile, { request: req, cacheControl: "no-store" });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return jsonError("INTERNAL_ERROR", { request: req });
  }
}
