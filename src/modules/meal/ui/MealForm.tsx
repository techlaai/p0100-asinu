"use client";
import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/http";

export default function MealForm({ onSaved }: { onSaved?: () => void }) {
  const [text, setText] = useState('');
  const [portion, setPortion] = useState<'low' | 'medium' | 'high'>('medium');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success'|'error'} | null>(null);

  const submit = async () => {
    if (!text.trim() && !file) {
      setToast({ message: "Vui lòng nhập mô tả hoặc chọn ảnh", type: "error" });
      return;
    }

    setLoading(true);
    try {
      let imageUrl = "";
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const upload = await apiFetch<{ key: string; signed_url?: string }>(
          "/api/upload/image",
          { method: "POST", body: fd },
        );
        imageUrl = upload.signed_url || "";
      }

      const payload = {
        meal_type: "snack",
        noted_at: new Date().toISOString(),
        text: text.trim() || undefined,
        portion,
        image_url: imageUrl || undefined,
      };

      await apiFetch("/api/log/meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setToast({ message: "Đã lưu bữa ăn!", type: "success" });
      setText("");
      setPortion("medium");
      setFile(null);
      setTimeout(() => onSaved?.(), 1000);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Không thể lưu bữa ăn.";
      setToast({ message: `Lỗi: ${message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border p-4">
      <div>
        <label className="block mb-2 font-medium text-sm">Mô tả món ăn</label>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="VD: Cơm gà, rau luộc" className="border rounded-xl px-3 h-12 w-full"/>
      </div>
      <div>
        <label className="block mb-2 font-medium text-sm">Khẩu phần</label>
        <select value={portion} onChange={e=>setPortion(e.target.value as 'low' | 'medium' | 'high')} className="border rounded-xl px-3 h-12 w-full">
        <option value="low">Khẩu phần nhỏ</option>
        <option value="medium">Khẩu phần vừa</option>
        <option value="high">Khẩu phần lớn</option>
      </select>
      </div>
      <div>
        <label className="block mb-2 font-medium text-sm">Ảnh món ăn (tùy chọn)</label>
        <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0] ?? null)} className="w-full" />
      </div>
    <div className="flex gap-3">
  <button
    type="button"
    onClick={() => history.back()}
    disabled={loading}
    className="flex-1 h-12 rounded-xl border border-gray-300 text-gray-700 disabled:opacity-50 font-semibold"
  >
    Hủy
  </button>
  <button
    type="submit" // Đổi type thành submit
    onClick={submit}
    disabled={loading}
    className="flex-1 h-12 rounded-xl font-semibold text-white bg-[var(--color-primary-700)] disabled:opacity-50"
  >
    {loading ? 'Đang lưu...' : 'Ghi bữa ăn'}
  </button>
</div>

      {toast && (
        <div className={`px-4 py-3 rounded-lg ${
          toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
