import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/getUserId';
import { generateRequestId, trackTipShown } from '@/lib/analytics/eventTracker';
import { FeatureStoreRepo } from '@/modules/meal/infrastructure/FeatureStoreRepo';
import { generateMealTip, formatTip, type MealData, type UserFeatures } from '@/modules/ai/rulesEngine';
import { validateAndSanitize } from '@/modules/ai/qcFilter';
import { transformWithPersona, extractPersonaPrefs } from '@/modules/ai/persona';
import { ProfilesRepo } from '@/infrastructure/repositories/ProfilesRepo';
import { query } from '@/lib/db_client';

/**
 * POST /api/ai/meal-tip
 * Generate meal tip based on rules (MVP - no LLM)
 *
 * Request body:
 * {
 *   "items": [{ "food": "cơm gạo lứt", "kcal": 180, "carb_g": 38, "protein_g": 4, "fat_g": 1 }]
 * }
 *
 * Response:
 * {
 *   "tip": "string (≤800 chars)",
 *   "meta": {
 *     "request_id": "uuid",
 *     "source": "rule-based",
 *     "length": 220,
 *     "time": "ISO timestamp"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = generateRequestId();

  try {
    // Authenticate
    const userId = await requireAuth(request);

    // Parse request body
    const body = await request.json();
    const { items = [] } = body;

    // Build meal data from items
    const mealData: MealData = {
      items,
      kcal: items.reduce((sum: number, item: any) => sum + (item.kcal || 0), 0),
      carb_g: items.reduce((sum: number, item: any) => sum + (item.carb_g || 0), 0),
      protein_g: items.reduce((sum: number, item: any) => sum + (item.protein_g || 0), 0),
      fat_g: items.reduce((sum: number, item: any) => sum + (item.fat_g || 0), 0)
    };

    // Fetch user features from Feature Store
    const featureRepo = new FeatureStoreRepo();
    const dailyFeatures = await featureRepo.getFeaturesWithFallback(userId);

    // Get latest BG
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

    // Generate tip using rules
    let tip = generateMealTip(mealData, userFeatures);

    // Apply persona transformation (with safe defaults)
    const profilesRepo = new ProfilesRepo();
    const profile = await profilesRepo.getById(userId);
    const prefs = extractPersonaPrefs(profile?.prefs);
    tip = transformWithPersona(tip, prefs);

    // Format as string
    let tipText = formatTip(tip);

    // QC validation and sanitization
    const qcResult = validateAndSanitize(tipText);
    tipText = qcResult.sanitized;

    if (qcResult.violations.length > 0) {
      console.warn('QC violations detected:', qcResult.violations);
    }

    // Track event (fire-and-forget) - payload minimal, no PII
    trackTipShown(userId, requestId, {
      source: 'rule-based',
      length: tipText.length,
      suggestion_count: tip.suggestions.length
    }).catch(err => console.error('Failed to track tip.shown:', err));

    // Console log for monitoring (request_id tracing)
    console.info({ request_id: requestId, source: 'rule-based', user_id: userId });

    // Response
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      tip: tipText,
      meta: {
        request_id: requestId,
        source: 'rule-based',
        length: tipText.length,
        time: new Date().toISOString(),
        response_time_ms: responseTime
      }
    }, { status: 200 });

  } catch (err: any) {
    console.error('Error in /api/ai/meal-tip:', err);

    // Fallback tip on error
    const fallbackTip = 'Bữa ăn được ghi nhận. Cân bằng rau, đạm, tinh bột theo tỷ lệ 2:1:1. Tiếp tục duy trì nhé!';

    return NextResponse.json({
      tip: fallbackTip,
      meta: {
        request_id: requestId,
        source: 'fallback',
        length: fallbackTip.length,
        time: new Date().toISOString(),
        error: err.message
      }
    }, { status: 200 });
  }
}
