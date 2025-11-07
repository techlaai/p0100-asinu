import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/getUserId";
import { FeatureStoreRepo } from "@/modules/meal/infrastructure/FeatureStoreRepo";
import { query } from "@/lib/db_client";
import { ensureRequestId } from "@/lib/logging/request_id";
import { jsonError, jsonSuccess } from "@/lib/http/response";
export const dynamic = 'force-dynamic';

/**
 * In-memory cache for meal suggestions (15 minutes TTL)
 */
const suggestionCache = new Map<string, { data: any; expiry: number }>();

interface MealSuggestion {
  id: string;
  name: string;
  kcal: number;
  carb_g: number;
  protein_g: number;
  fat_g: number;
  confidence: number;
  adjustment_note?: string;
}

/**
 * GET /api/meal/suggest?mealType=breakfast|lunch|dinner
 *
 * Returns 3 quick suggestions + "copy yesterday" option + custom option
 * Cache: 15 minutes per user
 * Target: <200ms response time
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = ensureRequestId(request);
  const userId = await requireAuth(request).catch(() => null);
  if (!userId) {
    return jsonError("UNAUTHORIZED", { request: request, requestId });
  }

  try {
    const { searchParams } = new URL(request.url);
    const mealType = searchParams.get("mealType") || "lunch";

    // Check cache first
    const cacheKey = `${userId}:${mealType}`;
    const cached = suggestionCache.get(cacheKey);

    if (cached && cached.expiry > Date.now()) {
      console.info({
        request_id: requestId,
        source: "cache",
        user_id: userId,
        response_time_ms: Date.now() - startTime,
      });

      return jsonSuccess(
        {
          suggestions: cached.data.suggestions,
          copy_yesterday: cached.data.copy_yesterday,
          custom: cached.data.custom,
          meta: {
            request_id: requestId,
            source: "cache",
            meal_type: mealType,
            time: new Date().toISOString(),
            response_time_ms: Date.now() - startTime,
          },
        },
        { request: request, requestId },
      );
    }

    // Fetch from Feature Store
    const featureRepo = new FeatureStoreRepo();
    const patterns = await featureRepo.getMealPatterns(userId, mealType);

    // Get yesterday's meals for "copy yesterday" option
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdayMealsResult = await query<{
      notes: string | null;
      carb_g: number | null;
      protein_g: number | null;
      fat_g: number | null;
      kcal: number | null;
      title: string | null;
    }>(
      `SELECT notes, carb_g, protein_g, fat_g, kcal, title
       FROM log_meal
       WHERE user_id = $1
         AND noted_at BETWEEN $2 AND $3
       ORDER BY noted_at DESC
       LIMIT 1`,
      [userId, `${yesterdayStr}T00:00:00Z`, `${yesterdayStr}T23:59:59Z`],
    );
    const yesterdayMealRow = yesterdayMealsResult.rows[0];
    let yesterdayMeals: { items: any[]; carbs_g: number | null; protein_g: number | null; fat_g: number | null; kcal: number | null } | null = null;
    if (yesterdayMealRow) {
      let notesPayload: Record<string, any> = {};
      if (yesterdayMealRow.notes) {
        try {
          notesPayload = JSON.parse(yesterdayMealRow.notes);
        } catch {
          notesPayload = { notes: yesterdayMealRow.notes };
        }
      }
      const items = Array.isArray(notesPayload.items)
        ? notesPayload.items
        : [{ name: notesPayload.notes ?? yesterdayMealRow.title ?? 'Meal' }];

      yesterdayMeals = {
        items,
        carbs_g: yesterdayMealRow.carb_g,
        protein_g: yesterdayMealRow.protein_g,
        fat_g: yesterdayMealRow.fat_g,
        kcal: yesterdayMealRow.kcal,
      };
    }

    // Generate 3 quick suggestions based on patterns
    const suggestions: MealSuggestion[] = [];

    if (patterns.length > 0) {
      // Top 3 patterns
      for (let i = 0; i < Math.min(3, patterns.length); i++) {
        const pattern = patterns[i];
        suggestions.push({
          id: `pattern-${i}`,
          name: pattern.dish,
          kcal: Math.round(pattern.portion_avg * 2), // Rough estimate
          carb_g: Math.round(pattern.portion_avg * 0.5),
          protein_g: Math.round(pattern.portion_avg * 0.3),
          fat_g: Math.round(pattern.portion_avg * 0.2),
          confidence: pattern.freq_7d / 7, // Frequency as confidence
          adjustment_note: pattern.freq_7d > 5 ? 'Bạn ăn món này thường xuyên' : undefined
        });
      }
    }

    // Fallback to default suggestions if no patterns
    if (suggestions.length === 0) {
      const defaults = getDefaultSuggestions(mealType);
      suggestions.push(...defaults);
    }

    // "Copy yesterday" option
    const copyYesterday = yesterdayMeals ? {
      id: 'copy-yesterday',
      name: 'Ăn giống hôm qua',
      kcal: yesterdayMeals.kcal || 0,
      carb_g: yesterdayMeals.carbs_g || 0,
      protein_g: yesterdayMeals.protein_g || 0,
      fat_g: yesterdayMeals.fat_g || 0,
      items: yesterdayMeals.items || []
    } : null;

    // "Custom" option
    const custom = {
      id: 'custom',
      name: 'Tự nhập món ăn',
      kcal: 0,
      carb_g: 0,
      protein_g: 0,
      fat_g: 0
    };

    // Cache for 15 minutes
    const result = {
      suggestions: suggestions.slice(0, 3),
      copy_yesterday: copyYesterday,
      custom
    };

    suggestionCache.set(cacheKey, {
      data: result,
      expiry: Date.now() + 15 * 60 * 1000 // 15 minutes
    });

    // Clean up expired cache entries
    for (const [key, value] of suggestionCache.entries()) {
      if (value.expiry < Date.now()) {
        suggestionCache.delete(key);
      }
    }

    const responseTime = Date.now() - startTime;

    console.info({
      request_id: requestId,
      source: 'computed',
      user_id: userId,
      response_time_ms: responseTime
    });

    return jsonSuccess(
      {
        ...result,
        meta: {
          request_id: requestId,
          source: "computed",
          meal_type: mealType,
          time: new Date().toISOString(),
          response_time_ms: responseTime,
        },
      },
      { request: request, requestId },
    );

  } catch (err: any) {
    console.error('Error in /api/meal/suggest:', err);

    // Fallback suggestions on error
    const mealType = new URL(request.url).searchParams.get("mealType") || "lunch";
    const defaults = getDefaultSuggestions(mealType);

    return jsonSuccess(
      {
        suggestions: defaults,
        copy_yesterday: null,
        custom: {
          id: "custom",
          name: "Tự nhập món ăn",
          kcal: 0,
          carb_g: 0,
          protein_g: 0,
          fat_g: 0,
        },
        meta: {
          request_id: requestId,
          source: "fallback",
          meal_type: mealType,
          time: new Date().toISOString(),
          error: err instanceof Error ? err.message : "unknown",
        },
      },
      { request: request, requestId },
    );
  }
}

/**
 * Default suggestions when no patterns available
 */
function getDefaultSuggestions(mealType: string): MealSuggestion[] {
  const defaults: Record<string, MealSuggestion[]> = {
    breakfast: [
      {
        id: 'default-1',
        name: 'Trứng luộc + rau xanh',
        kcal: 180,
        carb_g: 8,
        protein_g: 15,
        fat_g: 10,
        confidence: 0.8
      },
      {
        id: 'default-2',
        name: 'Cháo gà + rau củ',
        kcal: 200,
        carb_g: 30,
        protein_g: 12,
        fat_g: 4,
        confidence: 0.7
      },
      {
        id: 'default-3',
        name: 'Yến mạch + hạt chia',
        kcal: 220,
        carb_g: 35,
        protein_g: 8,
        fat_g: 6,
        confidence: 0.6
      }
    ],
    lunch: [
      {
        id: 'default-1',
        name: 'Cơm gạo lứt + ức gà + rau',
        kcal: 350,
        carb_g: 45,
        protein_g: 25,
        fat_g: 8,
        confidence: 0.8
      },
      {
        id: 'default-2',
        name: 'Cá hấp + rau luộc',
        kcal: 280,
        carb_g: 20,
        protein_g: 30,
        fat_g: 6,
        confidence: 0.7
      },
      {
        id: 'default-3',
        name: 'Đậu phụ xào + salad',
        kcal: 250,
        carb_g: 25,
        protein_g: 18,
        fat_g: 10,
        confidence: 0.6
      }
    ],
    dinner: [
      {
        id: 'default-1',
        name: 'Súp rau củ + thịt nạc',
        kcal: 220,
        carb_g: 18,
        protein_g: 20,
        fat_g: 6,
        confidence: 0.8
      },
      {
        id: 'default-2',
        name: 'Canh chua cá + rau',
        kcal: 200,
        carb_g: 15,
        protein_g: 22,
        fat_g: 5,
        confidence: 0.7
      },
      {
        id: 'default-3',
        name: 'Salad + ức gà nướng',
        kcal: 240,
        carb_g: 12,
        protein_g: 25,
        fat_g: 8,
        confidence: 0.6
      }
    ]
  };

  return defaults[mealType] || defaults.lunch;
}
