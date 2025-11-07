// src/components/profile/ProfileEditor.tsx
'use client';

import React, { useMemo, useState } from 'react';
import {
  mergeConditions,
  toGoalsPayload,
  toPersonalityPayload,
  Goals,
  PersonaPrefs,
  HealthConditions,
} from '@/lib/profile/mappers';
import { apiFetch, ApiError } from "@/lib/http";

type Conditions = {
  diabetes?: boolean;
  hypertension?: boolean;
  gout?: boolean;
  obesity?: boolean;
  other?: string;
};

type ProfilePreferences = PersonaPrefs & { goals?: Goals };

type Profile = {
  id: string;
  dob?: string | null;
  sex?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  waist_cm?: number | null;
  goal?: string | null;
  conditions?: Conditions | null;
  prefs?: ProfilePreferences | null;
};

type Props = {
  profile: Profile;      // cần để có id gọi PUT /api/profile/[id]
  onSaved?: (p: Partial<Profile>) => void;
};

interface ProfileBasicsPayload {
  dob: string | null;
  sex: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  waist_cm: number | null;
  goal: string | null;
  conditions: HealthConditions;
}

const conditionKeys: Array<{ key: keyof Omit<Conditions, 'other'>; label: string }> = [
  { key: 'diabetes', label: 'Tiểu đường' },
  { key: 'hypertension', label: 'Huyết áp cao' },
  { key: 'gout', label: 'Gout' },
  { key: 'obesity', label: 'Béo phì' },
];

export default function ProfileEditor({ profile, onSaved }: Props) {
  const [saving, setSaving] = useState(false);

  // Local state sơ bộ (tối giản)
  const [dob, setDob] = useState(profile.dob ?? '');
  const [sex, setSex] = useState(profile.sex ?? '');
  const [height, setHeight] = useState<number | ''>(profile.height_cm ?? '');
  const [weight, setWeight] = useState<number | ''>(profile.weight_kg ?? '');
  const [waist, setWaist] = useState<number | ''>(profile.waist_cm ?? '');
  const [goal, setGoal] = useState(profile.goal ?? '');

  const [conditions, setConditions] = useState<Conditions>(profile.conditions ?? {});
  const [goals, setGoals] = useState<Goals>(profile.prefs?.goals ?? {});
  const [prefs, setPrefs] = useState<PersonaPrefs>({
    ai_persona: profile.prefs?.ai_persona,
    guidance_level: profile.prefs?.guidance_level,
    low_ask_mode: profile.prefs?.low_ask_mode,
  });

  const mergedConditions = useMemo<HealthConditions>(() => {
    return mergeConditions(profile.conditions ?? {}, conditions);
  }, [conditions, profile.conditions]);

  const profilePayload = useMemo<ProfileBasicsPayload>(() => {
    return {
      dob: dob || null,
      sex: sex || null,
      height_cm: typeof height === 'number' ? height : null,
      weight_kg: typeof weight === 'number' ? weight : null,
      waist_cm: typeof waist === 'number' ? waist : null,
      goal: goal || null,
      conditions: mergedConditions,
    };
  }, [dob, sex, height, weight, waist, goal, mergedConditions]);

  async function saveBasic() {
    setSaving(true);
    try {
      const updated = await apiFetch<Profile>(`/api/profile/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      });
      onSaved?.(updated);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Không thể lưu thông tin cơ bản.";
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  async function saveGoals() {
    setSaving(true);
    try {
      await apiFetch('/api/profile/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toGoalsPayload(goals)),
      });
      const nextPrefs: Profile['prefs'] = {
        ...(profile.prefs ?? {}),
        goals,
      };
      onSaved?.({ prefs: nextPrefs });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Không thể lưu mục tiêu.";
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  async function savePersona() {
    setSaving(true);
    try {
      await apiFetch('/api/profile/personality', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPersonalityPayload(prefs)),
      });
      const nextPrefs: Profile['prefs'] = {
        ...(profile.prefs ?? {}),
        ...prefs,
      };
      onSaved?.({ prefs: nextPrefs });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Không thể lưu sở thích.";
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  const handlePersonaSelect = (value: string) => {
    const persona: PersonaPrefs['ai_persona'] | undefined =
      value === '' ? undefined : (value as PersonaPrefs['ai_persona']);
    setPrefs((current) => ({ ...current, ai_persona: persona }));
  };

  const handleGuidanceSelect = (value: string) => {
    const guidance: PersonaPrefs['guidance_level'] | undefined =
      value === '' ? undefined : (value as PersonaPrefs['guidance_level']);
    setPrefs((current) => ({ ...current, guidance_level: guidance }));
  };

  function toggleCondition(key: keyof Omit<Conditions, 'other'>, value: boolean) {
    setConditions((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="space-y-6">
      {/* Cơ bản */}
      <section className="rounded-2xl border p-4 bg-white shadow-sm">
        <h3 className="font-semibold mb-3">Cơ bản</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">Ngày sinh
            <input type="date" className="mt-1 w-full rounded border p-2"
              value={dob ?? ''} onChange={e => setDob(e.target.value)} />
          </label>
          <label className="text-sm">Giới tính
            <select className="mt-1 w-full rounded border p-2" value={sex ?? ''} onChange={e => setSex(e.target.value)}>
              <option value="">—</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </label>
          <label className="text-sm">Chiều cao (cm)
            <input type="number" className="mt-1 w-full rounded border p-2"
              value={height} onChange={e => setHeight(e.target.value === '' ? '' : Number(e.target.value))} />
          </label>
          <label className="text-sm">Cân nặng (kg)
            <input type="number" className="mt-1 w-full rounded border p-2"
              value={weight} onChange={e => setWeight(e.target.value === '' ? '' : Number(e.target.value))} />
          </label>
          <label className="text-sm">Vòng eo (cm)
            <input type="number" className="mt-1 w-full rounded border p-2"
              value={waist} onChange={e => setWaist(e.target.value === '' ? '' : Number(e.target.value))} />
          </label>
          <label className="text-sm">Mục tiêu
            <select className="mt-1 w-full rounded border p-2" value={goal ?? ''} onChange={e => setGoal(e.target.value)}>
              <option value="">—</option>
              <option value="lose_weight">Giảm cân</option>
              <option value="build_muscle">Tăng cơ</option>
              <option value="stabilize_glucose">Ổn định đường huyết</option>
            </select>
          </label>
        </div>

        {/* Conditions */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {conditionKeys.map(({ key, label }) => (
            <label key={key} className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox"
                checked={Boolean(conditions[key])}
                onChange={e => toggleCondition(key, e.target.checked)} />
              {label}
            </label>
          ))}
          <label className="text-sm col-span-2">Khác
            <input className="mt-1 w-full rounded border p-2"
              value={conditions.other ?? ''} onChange={e => setConditions({ ...conditions, other: e.target.value })}/>
          </label>
        </div>

        <button onClick={saveBasic} disabled={saving}
          className="mt-4 inline-flex items-center rounded bg-black text-white px-4 py-2 disabled:opacity-50">
          {saving ? 'Đang lưu...' : 'Lưu thông tin cơ bản'}
        </button>
      </section>

      {/* Goals */}
      <section className="rounded-2xl border p-4 bg-white shadow-sm">
        <h3 className="font-semibold mb-3">Mục tiêu</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">Mục tiêu chính
            <input className="mt-1 w-full rounded border p-2"
              value={goals.primaryGoal ?? ''} onChange={e => setGoals({ ...goals, primaryGoal: e.target.value })}/>
          </label>
          <label className="text-sm">Cân nặng mục tiêu (kg)
            <input type="number" className="mt-1 w-full rounded border p-2"
              value={goals.targetWeight ?? ''} onChange={e => setGoals({ ...goals, targetWeight: e.target.value === '' ? undefined : Number(e.target.value) })}/>
          </label>
          <label className="text-sm">HbA1c mục tiêu (%)
            <input type="number" className="mt-1 w-full rounded border p-2"
              value={goals.targetHbA1c ?? ''} onChange={e => setGoals({ ...goals, targetHbA1c: e.target.value === '' ? undefined : Number(e.target.value) })}/>
          </label>
          <label className="text-sm">Bước chân/ngày
            <input type="number" className="mt-1 w-full rounded border p-2"
              value={goals.dailySteps ?? ''} onChange={e => setGoals({ ...goals, dailySteps: e.target.value === '' ? undefined : Number(e.target.value) })}/>
          </label>
          <label className="text-sm">Nước/ngày (cốc)
            <input type="number" className="mt-1 w-full rounded border p-2"
              value={goals.waterCups ?? ''} onChange={e => setGoals({ ...goals, waterCups: e.target.value === '' ? undefined : Number(e.target.value) })}/>
          </label>
        </div>
        <button onClick={saveGoals} disabled={saving}
          className="mt-4 inline-flex items-center rounded bg-black text-white px-4 py-2 disabled:opacity-50">
          {saving ? 'Đang lưu...' : 'Lưu mục tiêu'}
        </button>
      </section>

      {/* AI prefs */}
      <section className="rounded-2xl border p-4 bg-white shadow-sm">
        <h3 className="font-semibold mb-3">Trợ lý AI</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">Phong cách AI
            <select className="mt-1 w-full rounded border p-2"
              value={prefs.ai_persona ?? ''} onChange={e => handlePersonaSelect(e.target.value)}>
              <option value="">—</option>
              <option value="friend">Friend</option>
              <option value="coach">Coach</option>
              <option value="advisor">Advisor</option>
            </select>
          </label>
          <label className="text-sm">Mức độ hướng dẫn
            <select className="mt-1 w-full rounded border p-2"
              value={prefs.guidance_level ?? ''} onChange={e => handleGuidanceSelect(e.target.value)}>
              <option value="">—</option>
              <option value="minimal">Tối giản</option>
              <option value="detailed">Chi tiết</option>
            </select>
          </label>
          <label className="text-sm inline-flex items-center gap-2">
            <input type="checkbox"
              checked={Boolean(prefs.low_ask_mode)}
              onChange={e => setPrefs({ ...prefs, low_ask_mode: e.target.checked })}/>
            Chế độ hỏi ít
          </label>
        </div>
        <button onClick={savePersona} disabled={saving}
          className="mt-4 inline-flex items-center rounded bg-black text-white px-4 py-2 disabled:opacity-50">
          {saving ? 'Đang lưu...' : 'Lưu tuỳ chọn AI'}
        </button>
      </section>
    </div>
  );
}
