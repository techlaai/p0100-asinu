// src/app/api/etl/daily/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth/getUserId";
import { format, startOfDay, endOfDay } from "date-fns";
import { query } from "@/lib/db_client";

// ✅ để Next không cố prerender / không tĩnh hoá
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

const bodySchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  userId: z.string().uuid().optional(), // allow admin/debug override
});

export async function POST(req: NextRequest) {
  try {
    // Lấy userId từ session/cookie
    let effectiveUserId = await getUserId(req);

    // Parse body an toàn
    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { day, userId: overrideUserId } = parsed.data;

    // Cho phép override khi không có session (dùng cho admin/cron)
    if (overrideUserId && !effectiveUserId) effectiveUserId = overrideUserId;
    if (!effectiveUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    const targetDay = day || format(new Date(), "yyyy-MM-dd");
    const startTime = startOfDay(new Date(targetDay)).toISOString();
    const endTime = endOfDay(new Date(targetDay)).toISOString();

    // ---------- Aggregate glucose ----------
    let glucoseProcessed = 0;
    {
      const glucoseResult = await query<{ value_mgdl: number }>(
        `SELECT value_mgdl
         FROM log_bg
         WHERE user_id = $1 AND noted_at BETWEEN $2 AND $3`,
        [effectiveUserId, startTime, endTime],
      );

      const glucoseRows = glucoseResult.rows;
      if (glucoseRows.length > 0) {
        const values = glucoseRows.map((x) => x.value_mgdl);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        glucoseProcessed = values.length;

        await query(
          `INSERT INTO metrics_day (user_id, day, metric, value, updated_at)
           VALUES ($1, $2, $3, $4::jsonb, now())
           ON CONFLICT (user_id, day, metric)
           DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
          [
            effectiveUserId,
            targetDay,
            "bg_avg",
            JSON.stringify({ avg: Math.round(avg), min, max, count: values.length }),
          ],
        );
      }
    }

    // ---------- Aggregate water ----------
    let waterProcessed = 0;
    {
      const waterResult = await query<{ volume_ml: number }>(
        `SELECT volume_ml
         FROM log_water
         WHERE user_id = $1 AND noted_at BETWEEN $2 AND $3`,
        [effectiveUserId, startTime, endTime],
      );

      const waterRows = waterResult.rows;
      if (waterRows.length > 0) {
        const total = waterRows.reduce((sum, x) => sum + Number(x.volume_ml ?? 0), 0);
        waterProcessed = waterRows.length;

        await query(
          `INSERT INTO metrics_day (user_id, day, metric, value, updated_at)
           VALUES ($1, $2, $3, $4::jsonb, now())
           ON CONFLICT (user_id, day, metric)
           DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
          [
            effectiveUserId,
            targetDay,
            "water_total",
            JSON.stringify({ total_ml: total, count: waterRows.length }),
          ],
        );
      }
    }

    return NextResponse.json({
      ok: true,
      userId: effectiveUserId,
      day: targetDay,
      processed: { glucose: glucoseProcessed, water: waterProcessed },
    });
  } catch (err: any) {
    console.error("ETL Daily error:", err);
    return NextResponse.json({ error: err?.message ?? "Internal error" }, { status: 500 });
  }
}

// Optional: GET để health-check nhanh (không ảnh hưởng build)
export async function GET() {
  return NextResponse.json({ ok: true });
}
