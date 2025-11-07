// src/modules/meal/ui/components/MealDaySheet.tsx
"use client";
import { useEffect, useState } from "react";
import { GetMenuByDay, MenuItem, DayMenu } from "../../application/usecases/GetMenuByDay";
import MealCard from "./MealCard";
import AddMealButton from "./AddMealButton";
import { apiFetch, ApiError } from "@/lib/http";

export default function MealDaySheet({ dateISO, onClose }:{ dateISO:string; onClose:()=>void }){
  const [level, setLevel] = useState<"basic"|"performance">("basic");
  const [menu, setMenu] = useState<DayMenu|null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(()=>{
    let ok = true;
    setLoading(true);
    GetMenuByDay(dateISO, level).then(m=>{ if(ok) setMenu(m as any) }).finally(()=>setLoading(false));
    return ()=>{ ok = false; };
  },[dateISO, level]);

  async function saveMeal(item: MenuItem){
    try {
      await apiFetch("/api/log/meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meal_type: item.meal_type,
          text: item.name,
          portion: "medium",
          noted_at: new Date(dateISO).toISOString(),
        }),
      });
      alert("Đã lưu: " + item.name);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Lưu món ăn thất bại.";
      alert(message);
    }
  }
  async function saveAll(){
    if (!menu) return;
    for (const it of menu.items.filter(i=>i.meal_type!=="snack")) await saveMeal(it);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end">
      <button aria-label="Đóng" onClick={onClose} className="absolute inset-0 bg-black/40 z-[10]" />
      <div className="relative z-[20] w-full bg-white rounded-t-2xl pt-3 pb-4 px-4 max-h-[80vh] overflow-y-auto shadow-xl">
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-gray-300" />
        <div className="flex justify-between items-center mb-2">
          <div>
            <div className="text-xs text-gray-500">{new Date(dateISO).toLocaleDateString()}</div>
            <h2 className="text-lg font-semibold text-teal-700">Thực đơn trong ngày</h2>
          </div>
          <button className="px-3 py-1 border rounded hover:bg-gray-50" onClick={onClose}>Đóng</button>
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={()=>setLevel("basic")}
            className={"px-3 py-1 rounded-full text-sm " + (level==="basic"?"bg-teal-600 text-white":"border")}
          >Basic</button>
          <button
            onClick={()=>setLevel("performance")}
            className={"px-3 py-1 rounded-full text-sm " + (level==="performance"?"bg-teal-600 text-white":"border")}
          >Hiệu suất cao</button>
        </div>

        <p className="text-sm text-gray-600 mb-3">
          {level==="basic" ? "Tiết kiệm, đủ chất, dễ nấu." : "Ổn định đường huyết, giàu đạm, nhiều xơ."}
        </p>

        {loading && <div className="text-sm">Đang tải thực đơn…</div>}
        {!loading && !menu && <div className="text-sm text-gray-500">Chưa có thực đơn cho ngày này.</div>}

        {!loading && menu && (
          <div className="space-y-2">
            {menu.items.filter(i=>i.meal_type!=="snack").map((it, i)=>(
              <MealCard key={i} title={it.name} tip={it.tip} onChoose={()=>saveMeal(it)} />
            ))}
            <div className="flex gap-2 mt-3">
              <button onClick={saveAll} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg">
                Dùng toàn bộ ngày
              </button>
              <a href="#custom-add" className="px-3 py-2 border rounded-lg">+ Món ngoài</a>
            </div>

            {/* Snack */}
            <div className="mt-4">
              <div className="text-sm font-medium">Snack gợi ý</div>
              <div className="flex gap-2 overflow-x-auto mt-2">
                {menu.items.filter(i=>i.meal_type==="snack").map((s, idx)=>(
                  <button key={idx} onClick={()=>saveMeal(s)} className="min-w-[128px] px-3 py-2 border rounded-lg">
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div id="custom-add" className="mt-6">
              <AddMealButton dateISO={dateISO} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
