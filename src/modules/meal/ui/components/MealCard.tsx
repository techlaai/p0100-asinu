// src/modules/meal/ui/components/MealCard.tsx
"use client";

type MealCardProps = {
  title: string
  tip?: string
  onChoose: () => void | Promise<void>
}

export default function MealCard({ title, tip, onChoose }: MealCardProps){
  return (
    <div className="border rounded p-3 flex items-center justify-between">
      <div>
        <div className="font-medium">{title}</div>
        {tip && <div className="text-xs text-gray-500">{tip}</div>}
      </div>
      <button onClick={onChoose} className="px-3 py-1 bg-green-600 text-white rounded">Chọn bữa này</button>
    </div>
  );
}
