import { query } from "@/lib/db_client";

/**
 * Rule:
 * - BG >72h → push coach_events
 * - Water < target (mặc định 1500ml) → push
 * - Weight 7d lệch > ngưỡng (mặc định 1.5kg) → push
 */
export async function runCoachTriggers(user_id: string, opts?: { waterTarget?: number; weightDelta?: number }) {
  const waterTarget = opts?.waterTarget ?? 1500;
  const weightDelta = opts?.weightDelta ?? 1.5;

  // BG near
  const bgResult = await query<{ noted_at: string }>(
    `SELECT noted_at
     FROM log_bg
     WHERE user_id = $1
     ORDER BY noted_at DESC
     LIMIT 1`,
    [user_id],
  );

  const lastBg = bgResult.rows[0]?.noted_at ? new Date(bgResult.rows[0].noted_at).getTime() : 0;
  const needBG = !lastBg || Date.now() - lastBg > 72 * 3600 * 1000;

  if (needBG) {
    await query(
      `INSERT INTO coach_events (user_id, event_type, payload, created_at)
       VALUES ($1, $2, $3::jsonb, now())`,
      [user_id, "bg_over_72h", JSON.stringify({ msg: "Đã quá 72h chưa đo BG, hãy đo lại ngay." })],
    );
  }

  // Water today
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const waterResult = await query<{ total: number }>(
    `SELECT COALESCE(SUM(volume_ml), 0) AS total
     FROM log_water
     WHERE user_id = $1 AND noted_at >= $2`,
    [user_id, start.toISOString()],
  );

  const waterSum = waterResult.rows[0]?.total ?? 0;
  if (waterSum < waterTarget) {
    await query(
      `INSERT INTO coach_events (user_id, event_type, payload, created_at)
       VALUES ($1, $2, $3::jsonb, now())`,
      [user_id, "water_below_target", JSON.stringify({ today_ml: waterSum, target_ml: waterTarget })],
    );
  }

  // Weight delta 7d
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const weightResult = await query<{ weight_kg: number; noted_at: string }>(
    `SELECT weight_kg, noted_at
     FROM log_weight
     WHERE user_id = $1 AND noted_at >= $2
     ORDER BY noted_at DESC`,
    [user_id, since.toISOString()],
  );

  if (weightResult.rowCount && weightResult.rowCount >= 2) {
    const rows = weightResult.rows;
    const latest = rows[0].weight_kg;
    const oldest = rows[rows.length - 1].weight_kg;
    if (Math.abs(latest - oldest) > weightDelta) {
      await query(
        `INSERT INTO coach_events (user_id, event_type, payload, created_at)
         VALUES ($1, $2, $3::jsonb, now())`,
        [user_id, "weight_delta_7d", JSON.stringify({ latest, oldest, delta: latest - oldest })],
      );
    }
  }
}
