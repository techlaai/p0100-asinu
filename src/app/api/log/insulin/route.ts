import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/getUserId";
import { query } from "@/lib/db_client";
import { jsonError, jsonSuccess } from "@/lib/http/response";
import type { InsulinType } from "@/domain/types";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

const bodySchema = z.object({
  dose_units: z.number().min(0.1).max(200),
  insulin_type: z.enum(["rapid","regular","intermediate","long","mixed","other"]).optional(),
  noted_at: z.string().datetime({ offset: true }).optional(),
  meal_id: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const userId = await requireAuth(req).catch(() => null);
  if (!userId) {
    return jsonError("UNAUTHORIZED", { request: req });
  }

  const json = await req.json().catch(() => null);
  const parse = bodySchema.safeParse(json);
  if (!parse.success) {
    return jsonError("VALIDATION_ERROR", { request: req, details: parse.error.flatten() });
  }

  const { dose_units, insulin_type, noted_at, meal_id, notes } = parse.data;
  const notedAt = noted_at ? new Date(noted_at).toISOString() : new Date().toISOString();

  try {
    const res = await query(
      `INSERT INTO log_insulin (user_id, dose_units, insulin_type, meal_id, notes, noted_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now(), now())
       RETURNING id, user_id, dose_units, insulin_type, meal_id, notes, noted_at, created_at, updated_at`,
      [userId, dose_units, (insulin_type as InsulinType | undefined) ?? null, meal_id ?? null, notes ?? null, notedAt],
    );

    return jsonSuccess(res.rows[0], { request: req, cacheControl: "no-store", status: 201 });
  } catch (error) {
    console.error("Error in /api/log/insulin:", error);
    return jsonError("INTERNAL_ERROR", { request: req });
  }
}
