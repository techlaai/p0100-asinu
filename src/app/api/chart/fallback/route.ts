import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/getUserId";
import { jsonError, jsonSuccess } from "@/lib/http/response";
import { ensureRequestId } from "@/lib/logging/request_id";
import { buildDemoChartVM } from "@/modules/chart/infrastructure/adapters/DemoData";
import { query } from "@/lib/db_client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const requestId = ensureRequestId(req);
  const userId = await requireAuth(req).catch(() => null);
  if (!userId) {
    return jsonError("UNAUTHORIZED", { request: req, requestId });
  }

  try {
    const demo7d = buildDemoChartVM("7d");
    const demo30d = buildDemoChartVM("30d");

    // Convert to series format expected by spec
    const series7 = demo7d.days.map(day => ({
      date: day.date,
      bg_avg: day.bg_avg,
      bp_sys_avg: day.bp_sys_avg,
      bp_dia_avg: day.bp_dia_avg,
      weight_kg: day.weight_kg,
      water_ml: day.water_ml,
      insulin_units: day.insulin_units,
      meals_count: day.meals_count
    }));

    const series30 = demo30d.days.map(day => ({
      date: day.date,
      bg_avg: day.bg_avg,
      bp_sys_avg: day.bp_sys_avg,
      bp_dia_avg: day.bp_dia_avg,
      weight_kg: day.weight_kg,
      water_ml: day.water_ml,
      insulin_units: day.insulin_units,
      meals_count: day.meals_count
    }));

    // Determine source based on database availability
    let source = "demo";
    try {
      await query("SELECT 1");
      source = "database";
    } catch (e) {
      console.warn("Database connection check failed, using demo data:", e);
    }

    return jsonSuccess(
      {
        series7,
        series30,
        source,
      },
      { request: req, requestId, cacheControl: "no-store" },
    );

  } catch (error) {
    console.error("Error in /api/chart/fallback:", error);

    const demo7d = buildDemoChartVM("7d");
    const demo30d = buildDemoChartVM("30d");

    return jsonSuccess(
      {
        series7: demo7d.days,
        series30: demo30d.days,
        source: "demo",
      },
      { request: req, requestId, cacheControl: "no-store" },
    );
  }
}
