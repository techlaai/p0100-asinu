import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/getUserId";
import { jsonError, jsonSuccess } from "@/lib/http/response";
import { query } from "@/lib/db_client";

export async function GET(request: NextRequest) {
  const userId = await requireAuth(request).catch(() => null);
  if (!userId) {
    return jsonError("UNAUTHORIZED", { request: request });
  }

  try {
    const result = await query<{ day: string | Date; avg_bg: number | null }>(
      `
        SELECT
          date_trunc('day', noted_at)::date AS day,
          AVG(value_mgdl)::float AS avg_bg
        FROM log_bg
        WHERE user_id = $1 AND noted_at >= now() - interval '7 days'
        GROUP BY 1
        ORDER BY 1 ASC;
      `,
      [userId],
    );

    const data = result.rows.map((row) => ({
      day:
        row.day instanceof Date
          ? row.day.toISOString().slice(0, 10)
          : row.day,
      avg_bg:
        row.avg_bg === null || row.avg_bg === undefined
          ? null
          : Number(row.avg_bg),
    }));

    return jsonSuccess(data, { request: request });
  } catch (err) {
    console.error("[api/chart/7d]", err);
    return jsonError("INTERNAL_ERROR", { request: request });
  }
}
