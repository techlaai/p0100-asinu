import { NextRequest } from "next/server";
import { z } from "zod";
import type { GlucoseContext } from "@/domain/types";
import { getPool } from "@/lib/db_client";
import { requireAuth } from "@/lib/auth/getUserId";
import { jsonError, jsonSuccess } from "@/lib/http/response";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

const ALLOWED_CONTEXT: GlucoseContext[] = ['fasting', 'pre_meal', 'post_meal', 'random'];

const BodySchema = z.object({
  value: z.number(),
  unit: z.enum(["mgdl", "mg/dl", "mmol", "mmol/l"]).default("mgdl"),
  noted_at: z.string().datetime({ offset: true }).optional(),
  context: z.enum(ALLOWED_CONTEXT).optional(),
  notes: z.string().max(2000).optional(),
  meal_id: z.number().int().positive().optional(),
});

function normalizeUnit(unit: string) {
  if (unit.toLowerCase() === 'mmol' || unit.toLowerCase() === 'mmol/l') return 'mmol';
  return 'mgdl';
}

function toMgdl(value: number, unit: string): number {
  const normalized = normalizeUnit(unit);
  if (normalized === 'mmol') {
    return Number((value * 18).toFixed(1));
  }
  return Number(value.toFixed(1));
}

export async function POST(request: NextRequest) {
  const userId = await requireAuth(request).catch(() => null);
  if (!userId) {
    return jsonError("UNAUTHORIZED", { request: request });
  }

  const payload = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR", {
      request: request,
      details: parsed.error.flatten(),
    });
  }

  const notedAtIso = parsed.data.noted_at ?? new Date().toISOString();
  const valueMgdl = toMgdl(parsed.data.value, parsed.data.unit);

  try {
    const db = getPool();
    const result = await db.query<{ id: number }>(
      `INSERT INTO log_bg (user_id, value_mgdl, context, notes, meal_id, noted_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now(), now())
       RETURNING id`,
      [
        userId,
        valueMgdl,
        parsed.data.context ?? null,
        parsed.data.notes ?? null,
        parsed.data.meal_id ?? null,
        notedAtIso,
      ],
    );

    return jsonSuccess(
      {
        id: result.rows[0]?.id ?? null,
        user_id: userId,
        noted_at: notedAtIso,
      },
      { request: request, cacheControl: "no-store", status: 201 },
    );
  } catch (error) {
    console.error("POST /api/log/bg failed", error);
    return jsonError("INTERNAL_ERROR", { request: request });
  }
}
