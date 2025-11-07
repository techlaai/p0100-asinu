// src/modules/meal/ui/components/AddMealButton.tsx
"use client";
import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/http";

export default function AddMealButton({ dateISO }:{dateISO:string}){
  const [text, setText] = useState("");
  const [portion, setPortion] = useState<"low"|"medium"|"high">("medium");
  const [loading, setLoading] = useState(false);

  async function save(){
    if (!text.trim()) { alert("Nhập món ngoài"); return; }
    setLoading(true);
    try{
      await apiFetch("/api/log/meal", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          meal_type:"snack",
          text,
          portion,
          noted_at: new Date(dateISO).toISOString(),
        })
      });
      setText("");
      alert("Đã lưu món ngoài");
    }catch(e){
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Không thể lưu món ngoài.";
      alert("Lỗi: " + message);
    }finally{
      setLoading(false);
    }
  }

  return (
    <div className="border rounded p-3">
      <div className="font-medium mb-2">+ Thêm món ngoài</div>
      <textarea className="w-full border rounded p-2 h-20 mb-2" placeholder="VD: 1 cốc sữa hạt, 1 quả trứng…" value={text} onChange={(e)=>setText(e.target.value)} maxLength={200} />
      <div className="mb-2 text-sm">Khẩu phần:
        {(["low","medium","high"] as const).map(p => (
          <button key={p} onClick={()=>setPortion(p)} className={"ml-2 px-2 py-1 border rounded " + (portion===p?"bg-sky-500 text-white":"")}>{p}</button>
        ))}
      </div>
      <button disabled={loading} onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded">Lưu</button>
    </div>
  )
}
