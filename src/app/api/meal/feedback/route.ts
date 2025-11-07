import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/getUserId";
import { trackTipShown } from "@/lib/analytics/eventTracker";
import { jsonError, jsonSuccess } from "@/lib/http/response";
import { ensureRequestId } from "@/lib/logging/request_id";
import { FeatureStoreRepo } from "@/modules/meal/infrastructure/FeatureStoreRepo";
import { generateMealTip, formatTip, type MealData, type UserFeatures } from "@/modules/ai/rulesEngine";
import { validateAndSanitize } from "@/modules/ai/qcFilter";
import { transformWithPersona, extractPersonaPrefs } from "@/modules/ai/persona";
import { ProfilesRepo } from "@/infrastructure/repositories/ProfilesRepo";
import { query } from "@/lib/db_client";

const itemSchema = z.object({
  name: z.string().min(1),
  kcal: z.number().optional(),
  carb_g: z.number().optional(),
  protein_g: z.number().optional(),
  fat_g: z.number().optional(),
  photo: z.string().optional(),
});

const requestSchema = z
  .object({
    meal_log_id: z.union([z.string(), z.number()]).optional(),
    items: z.array(itemSchema).optional(),
  })
  .refine(
    (value) => Boolean(value.meal_log_id) || Boolean(value.items && value.items.length > 0),
    { message: "Provide meal_log_id or items." },
  );

/**
 * POST /api/meal/feedback
 *
 * Generate 3-sentence feedback after meal logging:
 * 1. Summary (what was logged)
 * 2. 1-2 tips (based on rules)
 * 3. Conclusion (persona-based encouragement)
 *
 * Request body:
 * {
 *   "meal_log_id": "uuid" (optional - if provided, fetch meal data from DB)
 *   "items": [...] (optional - if no meal_log_id, use items directly)
 * }
 *
 * Response:
 * {
 *   "feedback": "3-sentence feedback string",
 *   "meta": { ... }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = ensureRequestId(request);
  const userId = await requireAuth(request).catch(() => null);
  if (!userId) {
    return jsonError("UNAUTHORIZED", { request: request, requestId });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", {
      request: request,
      requestId,
      details: parsed.error.flatten(),
    });
  }
  const { meal_log_id, items } = parsed.data;

  try {
    let mealData: MealData;

    if (meal_log_id) {
      const mealResult = await query<{
        notes: string | null;
        carb_g: number | null;
        protein_g: number | null;
        fat_g: number | null;
        kcal: number | null;
        title: string | null;
        photo_key: string | null;
      }>(
        `SELECT notes, carb_g, protein_g, fat_g, kcal, title, photo_key
         FROM log_meal
         WHERE id = $1 AND user_id = $2
         LIMIT 1`,
        [meal_log_id, userId],
      );

      const mealLog = mealResult.rows[0];
      if (!mealLog) {
        return jsonError("NOT_FOUND", {
          request: request,
          requestId,
          message: "Meal log not found.",
        });
      }

      let notePayload: Record<string, any> = {};
      if (mealLog.notes) {
        try {
          notePayload = JSON.parse(mealLog.notes);
        } catch {
          notePayload = { notes: mealLog.notes };
        }
      }
      const itemsFromNotes = Array.isArray(notePayload.items) ? notePayload.items : [];
      const fallbackName = notePayload.notes ?? mealLog.title ?? "Meal";

      mealData = {
        items:
          itemsFromNotes.length > 0
            ? itemsFromNotes
            : [{ name: fallbackName, photo: mealLog.photo_key ?? undefined }],
        kcal: mealLog.kcal ?? undefined,
        carb_g: mealLog.carb_g ?? undefined,
        protein_g: mealLog.protein_g ?? undefined,
        fat_g: mealLog.fat_g ?? undefined,
        meal_type: notePayload.meal_type,
        cooking_method: notePayload.cooking_method,
      };
    } else {
      mealData = {
        items,
        kcal: items.reduce((sum: number, item: any) => sum + (item.kcal || 0), 0),
        carb_g: items.reduce((sum: number, item: any) => sum + (item.carb_g || 0), 0),
        protein_g: items.reduce((sum: number, item: any) => sum + (item.protein_g || 0), 0),
        fat_g: items.reduce((sum: number, item: any) => sum + (item.fat_g || 0), 0),
      };
    }

    const featureRepo = new FeatureStoreRepo();
    const dailyFeatures = await featureRepo.getFeaturesWithFallback(userId);

    const bgResult = await query<{ value_mgdl: number | null }>(
      `SELECT value_mgdl
       FROM log_bg
       WHERE user_id = $1
       ORDER BY noted_at DESC
       LIMIT 1`,
      [userId],
    );
    const bgData = bgResult.rows[0];

    const userFeatures: UserFeatures = {
      carb_g_total_yesterday: dailyFeatures.carb_g_total ?? undefined,
      protein_g_total_yesterday: dailyFeatures.protein_g_total ?? undefined,
      fat_g_total_yesterday: dailyFeatures.fat_g_total ?? undefined,
      fried_count_7d: dailyFeatures.fried_count ?? undefined,
      latest_bg: bgData?.value_mgdl ?? undefined,
    };

    let tip = generateMealTip(mealData, userFeatures);

    const profilesRepo = new ProfilesRepo();
    const profile = await profilesRepo.getById(userId);
    const prefs = extractPersonaPrefs(profile?.prefs);
    tip = transformWithPersona(tip, prefs);

    let feedback = formatTip(tip);

    const qcResult = validateAndSanitize(feedback);
    feedback = qcResult.sanitized;

    if (qcResult.violations.length > 0) {
      console.warn("QC violations in feedback:", qcResult.violations);
    }

    trackTipShown(userId, requestId, {
      source: "rule-based",
      length: feedback.length,
      suggestion_count: tip.suggestions.length,
    }).catch((err) => console.error("Failed to track feedback:", err));

    console.info({
      request_id: requestId,
      source: "rule-based",
      user_id: userId,
      feedback_length: feedback.length,
    });

    const responseTime = Date.now() - startTime;

    return jsonSuccess(
      {
        feedback,
        meta: {
          request_id: requestId,
          source: "rule-based",
          length: feedback.length,
          time: new Date().toISOString(),
          response_time_ms: responseTime,
        },
      },
      { request: request, requestId },
    );
  } catch (err: any) {
    console.error("Error in /api/meal/feedback:", err);

    const fallbackFeedback =
      "Bữa ăn được ghi nhận. Cân bằng rau, đạm, tinh bột theo tỷ lệ 2:1:1. Tiếp tục duy trì nhé!";

    return jsonError("INTERNAL_ERROR", {
      request: request,
      requestId,
      message: "Unable to generate meal feedback.",
      details: {
        fallback_feedback: fallbackFeedback,
        error: err instanceof Error ? err.message : "unknown",
      },
    });
  }
}
