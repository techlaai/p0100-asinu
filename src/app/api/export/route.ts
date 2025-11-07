import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/getUserId';
import { query } from '@/lib/db_client';
export const dynamic = 'force-dynamic';

type MetricAccumulator = {
  day: string;
  avg_bg_mgdl: number | null;
  count_bg: number | null;
  total_water_ml: number | null;
  weight_kg: number | null;
  avg_systolic: number | null;
  avg_diastolic: number | null;
};

function toCSV(rows: Record<string, any>[]) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(headers.map(h => JSON.stringify(r[h] ?? '')).join(','));
  return lines.join('\n');
}

export async function GET(req: NextRequest) {
  try {
    const uid = await requireAuth(req);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    const startDay = startDate.toISOString().slice(0, 10);
    const endDay = endDate.toISOString().slice(0, 10);

    const metricsResult = await query<{ day: string; metric: string; value: any }>(
      `SELECT day, metric, value
       FROM metrics_day
       WHERE user_id = $1 AND day BETWEEN $2 AND $3
       ORDER BY day ASC`,
      [uid, startDay, endDay],
    );

    const dayMap = new Map<string, MetricAccumulator>();

    for (const row of metricsResult.rows) {
      const key = row.day;
      if (!dayMap.has(key)) {
        dayMap.set(key, {
          day: key,
          avg_bg_mgdl: null,
          count_bg: null,
          total_water_ml: null,
          weight_kg: null,
          avg_systolic: null,
          avg_diastolic: null,
        });
      }

      const acc = dayMap.get(key)!;
      switch (row.metric) {
        case 'bg_avg': {
          const payload = row.value ?? {};
          acc.avg_bg_mgdl = payload.avg ?? null;
          acc.count_bg = payload.count ?? null;
          break;
        }
        case 'water_total': {
          const payload = row.value ?? {};
          acc.total_water_ml = payload.total_ml ?? null;
          break;
        }
        case 'weight_latest': {
          const payload = row.value ?? {};
          acc.weight_kg = payload.weight_kg ?? null;
          break;
        }
        case 'bp_avg': {
          const payload = row.value ?? {};
          acc.avg_systolic = payload.sys ?? null;
          acc.avg_diastolic = payload.dia ?? null;
          break;
        }
        default:
          break;
      }
    }

    let rows = Array.from(dayMap.values());

    if (!rows.length) {
      const bgResult = await query<{ noted_at: string; value_mgdl: number | null }>(
        `SELECT noted_at, value_mgdl
         FROM log_bg
         WHERE user_id = $1
           AND noted_at BETWEEN $2 AND $3
         ORDER BY noted_at ASC`,
        [uid, startDate.toISOString(), endDate.toISOString()],
      );

      const bgRows = bgResult.rows;
      if (bgRows.length > 0) {
        rows = bgRows.map((log) => ({
          day: log.noted_at.slice(0, 10),
          avg_bg_mgdl: log.value_mgdl ?? null,
          count_bg: 1,
          total_water_ml: 0,
          weight_kg: null,
          avg_systolic: null,
          avg_diastolic: null,
        }));
      }
    }

    const csvRows = rows.map((r) => ({
      date: r.day ?? '',
      avg_bg: r.avg_bg_mgdl ?? '',
      bg_count: r.count_bg ?? '',
      water_ml: r.total_water_ml ?? '',
      weight_kg: r.weight_kg ?? '',
      systolic: r.avg_systolic ?? '',
      diastolic: r.avg_diastolic ?? '',
    }));

    if (!csvRows.length) {
      return NextResponse.json({ error: 'No data found for export' }, { status: 404 });
    }

    const csv = toCSV(csvRows);
    const filename = `asinu_export_${uid.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Export error:', error);
    return NextResponse.json({ error: error?.message || 'Export failed' }, { status: 500 });
  }
}
