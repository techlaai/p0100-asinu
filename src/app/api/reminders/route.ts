import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/getUserId';

type Reminder = {
  id: string; type: 'med' | 'meal' | 'sleep';
  title: string; time: string; // "HH:mm"
};

const store = new Map<string, Reminder[]>(); // userId -> reminders

export async function GET() {
  const uid = (await requireAuth().catch(() => null)) ?? 'demo';
  return NextResponse.json({ ok: true, data: store.get(uid) ?? [] });
}

export async function POST(req: Request) {
  const uid = await requireAuth().catch(() => 'demo');
  const body = await req.json();
  const item: Reminder = {
    id: crypto.randomUUID(),
    type: body.type ?? 'med',
    title: body.title ?? 'Untitled',
    time: body.time ?? '08:00',
  };
  const list = store.get(uid) ?? [];
  list.push(item);
  store.set(uid, list);
  return NextResponse.json({ ok: true, data: item }, { status: 201 });
}
