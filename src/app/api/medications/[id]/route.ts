import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/getUserId';

const meds = (global as any).__meds__ ?? new Map<string, any[]>();
(global as any).__meds__ = meds;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const uid = (await requireAuth().catch(() => null)) ?? 'demo';
  const list = meds.get(uid) ?? [];
  const idx = list.findIndex((x: any) => x.id === params.id);
  if (idx < 0) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  const patch = await req.json();
  list[idx] = { ...list[idx], ...patch };
  meds.set(uid, list);
  return NextResponse.json({ ok: true, data: list[idx] });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const uid = (await requireAuth().catch(() => null)) ?? 'demo';
  const list = meds.get(uid) ?? [];
  const next = list.filter((x: any) => x.id !== params.id);
  meds.set(uid, next);
  return NextResponse.json({ ok: true });
}
