import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/getUserId";
import { jsonError, jsonSuccess } from "@/lib/http/response";
import { getFeatureFlag } from "../../../../../config/feature-flags";
import { query } from "@/lib/db_client";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

const MealLogRequestBodySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  noted_at: z.string().datetime({ offset: true }).optional(),
  notes: z.string().optional(),
  portion: z.enum(["low", "medium", "high"]).optional(),
  carb_g: z.number().min(0).max(200).optional(),
  protein_g: z.number().min(0).max(200).optional(),
  fat_g: z.number().min(0).max(200).optional(),
  kcal: z.number().min(0).max(4000).optional(),
  photo_key: z.string().optional(),
  image_url: z.string().optional(), // legacy alias
  text: z.string().optional(), // legacy alias
}).refine(
  (data) => data.title || data.text || data.meal_type,
  {
    message: "title or meal_type is required",
    path: ["title"],
  }
);

const mockMealLogs: any[] = [];

export async function POST(request: NextRequest) {
  const userId = await requireAuth(request).catch(() => null);
  if (!userId) {
    return jsonError("UNAUTHORIZED", { request });
  }

  const rawBody = await request.json().catch(() => null);
  const parseResult = MealLogRequestBodySchema.safeParse(rawBody);

  if (!parseResult.success) {
    return jsonError("VALIDATION_ERROR", {
      request,
      details: parseResult.error.flatten(),
    });
  }

  const body = parseResult.data;
  const mealType = body.meal_type ?? "snack";
  const notedAt = body.noted_at ?? new Date().toISOString();
  const portion = body.portion ?? "medium";

  const title = body.title ?? body.text ?? mealType;
  const notes = body.notes ?? body.text ?? null;
  const photoKey = body.photo_key ?? body.image_url ?? null;

  if (getFeatureFlag("MEAL_MOCK_MODE")) {
    const mockData = {
      id: `mock-${Date.now()}`,
      user_id: userId,
      title,
      meal_type: mealType,
      portion,
      notes,
      photo_key: photoKey,
      noted_at: notedAt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockMealLogs.push(mockData);
    return jsonSuccess(mockData, {
      request,
      cacheControl: "no-store",
      status: 201,
    });
  }

  try {
    const result = await query(
      `INSERT INTO log_meal (
         user_id,
         title,
         carb_g,
         protein_g,
         fat_g,
         kcal,
         photo_key,
         notes,
         noted_at,
         created_at,
         updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())
       RETURNING *`,
      [
        userId,
        title,
        body.carb_g ?? null,
        body.protein_g ?? null,
        body.fat_g ?? null,
        body.kcal ?? null,
        photoKey,
        notes
          ? JSON.stringify({ meal_type: mealType, portion, notes })
          : JSON.stringify({ meal_type: mealType, portion }),
        notedAt,
      ],
    );

    const row = result.rows[0];
    return jsonSuccess(row, {
      request,
      cacheControl: "no-store",
      status: 201,
    });
  } catch (err: any) {
    console.error("Error in /api/log/meal:", err);
    return jsonError("INTERNAL_ERROR", {
      request,
      message: "Không thể ghi log bữa ăn.",
    });
  }
}
