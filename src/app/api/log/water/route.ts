import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/getUserId";
import { query } from "@/lib/db_client";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

const bodySchema = z.object({
  volume_ml: z.number().int().positive().optional(),
  ml: z.number().int().positive().optional(),
  noted_at: z.string().datetime({ offset: true }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth(req);

    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const amount = parsed.data.volume_ml ?? parsed.data.ml;
    if (!amount) {
      return NextResponse.json({ ok: false, error: "missing_volume" }, { status: 400 });
    }

    const notedAt = parsed.data.noted_at ?? new Date().toISOString();

    const result = await query(
      `INSERT INTO log_water (user_id, volume_ml, noted_at, created_at, updated_at)
       VALUES ($1, $2, $3, now(), now())
       RETURNING id, user_id, volume_ml, noted_at, created_at, updated_at`,
      [userId, amount, notedAt],
    );

    return NextResponse.json({ ok: true, data: result.rows[0] }, { status: 201 });
  } catch (e: any) {
    if (e.message === "Authentication required") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in /api/log/water:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
