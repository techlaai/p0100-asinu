import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/getUserId';

type Med = { id: string; name: string; dose?: string; note?: string };
const meds = new Map<string, Med[]>(); // userId -> meds

export async function GET() {
  const uid = (await requireAuth().catch(() => null)) ?? 'demo';
  return NextResponse.json({ ok: true, data: meds.get(uid) ?? [] });
}

export async function POST(req: Request) {
  const uid = (await requireAuth().catch(() => null)) ?? 'demo';
  const b = await req.json();
  const item: Med = { id: crypto.randomUUID(), name: b.name ?? 'Metformin', dose: b.dose, note: b.note };
  const list = meds.get(uid) ?? [];
  list.push(item);
  meds.set(uid, list);
  return NextResponse.json({ ok: true, data: item }, { status: 201 });
}
