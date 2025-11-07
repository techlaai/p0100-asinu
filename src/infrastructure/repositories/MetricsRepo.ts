import { MetricDay, MetricWeek } from "@/domain/types";
import { query } from "@/lib/db_client";

export class MetricsRepo {
  async upsertDailyMetric(userId: string, day: string, metric: string, value: any): Promise<MetricDay> {
    const result = await query<MetricDay>(
      `INSERT INTO metrics_day (user_id, day, metric, value, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, now())
       ON CONFLICT (user_id, day, metric)
       DO UPDATE SET value = EXCLUDED.value, updated_at = now()
       RETURNING *`,
      [userId, day, metric, JSON.stringify(value)],
    );
    return result.rows[0];
  }

  async getDailyMetrics(userId: string, fromDay: string, toDay: string, metric: string): Promise<MetricDay[]> {
    const result = await query<MetricDay>(
      `SELECT *
       FROM metrics_day
       WHERE user_id = $1
         AND metric = $2
         AND day BETWEEN $3 AND $4
       ORDER BY day ASC`,
      [userId, metric, fromDay, toDay],
    );
    return result.rows;
  }

  async upsertWeeklyMetric(userId: string, week: number, metric: string, value: any): Promise<MetricWeek> {
    const result = await query<MetricWeek>(
      `INSERT INTO metrics_week (user_id, week, metric, value, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, now())
       ON CONFLICT (user_id, week, metric)
       DO UPDATE SET value = EXCLUDED.value, updated_at = now()
       RETURNING *`,
      [userId, week, metric, JSON.stringify(value)],
    );
    return result.rows[0];
  }

  async getWeeklyMetrics(userId: string, fromWeek: number, toWeek: number, metric: string): Promise<MetricWeek[]> {
    const result = await query<MetricWeek>(
      `SELECT *
       FROM metrics_week
       WHERE user_id = $1
         AND metric = $2
         AND week BETWEEN $3 AND $4
       ORDER BY week ASC`,
      [userId, metric, fromWeek, toWeek],
    );
    return result.rows;
  }
}
