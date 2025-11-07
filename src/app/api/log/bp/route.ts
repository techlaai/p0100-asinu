import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/getUserId";
import { query } from "@/lib/db_client";

const bodySchema = z.object({
  sys: z.number().int().min(60).max(300),
  dia: z.number().int().min(30).max(200),
  pulse: z.number().int().min(30).max(220).optional(),
  noted_at: z.string().datetime({ offset: true }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth(req);

    const json = await req.json().catch(() => null);
    const parse = bodySchema.safeParse(json);
    if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

    const { sys, dia, pulse, noted_at } = parse.data;
    const notedAt = noted_at ? new Date(noted_at).toISOString() : new Date().toISOString();

    const res = await query(
      `INSERT INTO log_bp (user_id, sys, dia, pulse, noted_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, now(), now())
       RETURNING id, user_id, sys, dia, pulse, noted_at, created_at, updated_at`,
      [userId, sys, dia, pulse ?? null, notedAt],
    );

    return NextResponse.json({ ok: true, data: res.rows[0] }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in /api/log/bp:", error);
    return NextResponse.json({ error: error.message || "unknown" }, { status: 500 });
  }
}
