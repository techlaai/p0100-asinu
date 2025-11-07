import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { format, startOfDay, endOfDay } from "date-fns";
import { query } from "@/lib/db_client";
import { getUserId } from "@/lib/auth/getUserId";
import type { GlucoseLog } from "@/domain/types";

const bodySchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  userId: z.string().uuid().optional(),
});

type MetricPayload = {
  avg?: number;
  min?: number;
  max?: number;
  count: number;
  total_ml?: number;
};

async function upsertMetric(userId: string, day: string, metric: string, value: MetricPayload) {
  await query(
    `INSERT INTO metrics_day (user_id, day, metric, value, updated_at)
     VALUES ($1, $2, $3, $4::jsonb, now())
     ON CONFLICT (user_id, metric, day)
     DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [userId, day, metric, JSON.stringify(value)],
  );
}

export async function POST(req: NextRequest) {
  let userId = await getUserId(req);

  const json = await req.json().catch(() => ({}));
  const parse = bodySchema.safeParse(json);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const { day, userId: paramUserId } = parse.data;
  if (paramUserId && !userId) userId = paramUserId;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetDay = day || format(new Date(), "yyyy-MM-dd");
  const startTime = startOfDay(new Date(targetDay)).toISOString();
  const endTime = endOfDay(new Date(targetDay)).toISOString();

  try {
    const glucoseResult = await query<{ value_mgdl: number }>(
      `SELECT value_mgdl
       FROM log_bg
       WHERE user_id = $1 AND noted_at >= $2 AND noted_at <= $3`,
      [userId, startTime, endTime],
    );

    if (glucoseResult.rowCount && glucoseResult.rowCount > 0) {
      const values = glucoseResult.rows.map(row => Number(row.value_mgdl));
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      await upsertMetric(userId, targetDay, "bg_avg", {
        avg: Math.round(avg),
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      });
    }

    const waterResult = await query<{ volume_ml: number }>(
      `SELECT volume_ml
       FROM log_water
       WHERE user_id = $1 AND noted_at >= $2 AND noted_at <= $3`,
      [userId, startTime, endTime],
    );

    if (waterResult.rowCount && waterResult.rowCount > 0) {
      const total = waterResult.rows.reduce(
        (sum, row) => sum + Number(row.volume_ml ?? 0),
        0,
      );
      await upsertMetric(userId, targetDay, "water_total", {
        total_ml: total,
        count: waterResult.rowCount,
      });
    }

    return NextResponse.json({
      ok: true,
      userId,
      day: targetDay,
      processed: {
        glucose: glucoseResult.rowCount ?? 0,
        water: waterResult.rowCount ?? 0,
      },
    });
  } catch (error: any) {
    console.error("ETL Daily error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export class GlucoseLogsRepo {
  async listByRange(userId: string, startTime: string, endTime: string): Promise<GlucoseLog[]> {
    const result = await query<GlucoseLog>(
      `SELECT *
       FROM log_bg
       WHERE user_id = $1 AND noted_at >= $2 AND noted_at <= $3
       ORDER BY noted_at DESC`,
      [userId, startTime, endTime],
    );
    return result.rows;
  }

  async create(log: {
    user_id: string;
    value_mgdl: number;
    context?: GlucoseLog["context"];
    notes?: string | null;
    meal_id?: number | null;
    noted_at: string;
  }): Promise<GlucoseLog> {
    const result = await query<GlucoseLog>(
      `INSERT INTO log_bg (user_id, value_mgdl, context, notes, meal_id, noted_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now(), now())
       RETURNING *`,
      [
        log.user_id,
        log.value_mgdl,
        log.context ?? null,
        log.notes ?? null,
        log.meal_id ?? null,
        log.noted_at,
      ],
    );
    return result.rows[0];
  }
}
