"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { apiFetch, ApiError } from "@/lib/http";
type Meal = { id: string; noted_at?: string; text?: string; portion?: string; image_url?: string };

export default function MealList() {
  const [items, setItems] = useState<Meal[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const response = await apiFetch<{ data?: Meal[]; items?: Meal[] }>("/api/meal", {
        cache: "no-store",
      });
      const nextItems = (response.data ?? response.items ?? []) as Meal[];
      setItems(nextItems);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Không thể tải danh sách bữa ăn.";
      setError(message);
      setItems([]);
    }
  };
  useEffect(() => { void load(); }, []);
  return (
    <div className="grid gap-3">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <ul className="grid gap-3">
      {items.map(m => (
        <li key={m.id} className="rounded-2xl border p-3 flex items-center gap-3">
          {m.image_url ? <Image src={m.image_url} alt="" width={64} height={64} className="w-16 h-16 rounded-xl object-cover" /> : null}
          <div className="text-sm">
            <div className="font-medium">{m.text || '—'}</div>
            <div className="text-gray-500">
              {(m.noted_at ? new Date(m.noted_at).toLocaleString() : "—")} • {m.portion || 'khẩu phần ?'}
            </div>
          </div>
        </li>
      ))}
    </ul>
    </div>
  );
}
