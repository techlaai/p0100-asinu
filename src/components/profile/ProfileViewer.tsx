// src/components/profile/ProfileViewer.tsx
'use client';

import React from 'react';
import FieldRow from '@/components/ui/FieldRow';
import SummaryCard from './sections/SummaryCard';
import { D, formatDateDDMMYYYY, boolToYesNo } from '@/lib/profile/formatters';
import { Goals, PersonaPrefs } from '@/lib/profile/mappers';
import dynamic from "next/dynamic";

const RelativesPanel = dynamic(() => import("./RelativesPanel"), { ssr: false });

type Conditions = {
  diabetes?: boolean;
  hypertension?: boolean;
  gout?: boolean;
  obesity?: boolean;
  other?: string;
};

type Profile = {
  id: string;
  dob?: string | null;
  sex?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  waist_cm?: number | null;
  goal?: string | null;
  conditions?: Conditions | null;
  prefs?: { goals?: Goals } & PersonaPrefs | null;
};

type Props = {
  profile: Profile;
  goals?: Goals | null;        // optional override nếu đã fetch riêng
  prefs?: PersonaPrefs | null;  // optional override
};

export default function ProfileViewer({ profile, goals, prefs }: Props) {
  const resolvedConditions: Conditions = { ...(profile.conditions ?? {}) };
  const resolvedGoals: Goals = { ...(goals ?? profile.prefs?.goals ?? {}) };
  const resolvedPrefs: PersonaPrefs = {
    ...(profile.prefs ?? {}),
    ...(prefs ?? {}),
  };

  return (
    <section className="space-y-4">
      <SummaryCard
        sex={profile.sex}
        goal={profile.goal ?? resolvedGoals?.primaryGoal}
        dob={profile.dob}
        height_cm={profile.height_cm}
        weight_kg={profile.weight_kg}
      />

      {/* Thông tin cơ bản */}
      <div className="rounded-2xl border p-4 bg-white shadow-sm">
        <h3 className="font-semibold mb-2">Thông tin cơ bản</h3>
        <FieldRow label="Ngày sinh" value={D(formatDateDDMMYYYY(profile.dob ?? undefined))} />
        <FieldRow label="Chiều cao (cm)" value={D(profile.height_cm)} />
        <FieldRow label="Cân nặng (kg)" value={D(profile.weight_kg)} />
        <FieldRow label="Vòng eo (cm)" value={D(profile.waist_cm)} />
      </div>

      {/* Tình trạng sức khỏe */}
      <div className="rounded-2xl border p-4 bg-white shadow-sm">
        <h3 className="font-semibold mb-2">Tình trạng sức khỏe</h3>
        <FieldRow label="Tiểu đường" value={D(boolToYesNo(resolvedConditions.diabetes))} />
        <FieldRow label="Huyết áp cao" value={D(boolToYesNo(resolvedConditions.hypertension))} />
        <FieldRow label="Gout" value={D(boolToYesNo(resolvedConditions.gout))} />
        <FieldRow label="Béo phì" value={D(boolToYesNo(resolvedConditions.obesity))} />
        <FieldRow label="Khác" value={D(resolvedConditions.other)} />
      </div>

      {/* Mục tiêu */}
      <div className="rounded-2xl border p-4 bg-white shadow-sm">
        <h3 className="font-semibold mb-2">Mục tiêu</h3>
        <FieldRow label="Mục tiêu chính" value={D(resolvedGoals.primaryGoal)} />
        <FieldRow label="Cân nặng mục tiêu (kg)" value={D(resolvedGoals.targetWeight)} />
        <FieldRow label="HbA1c mục tiêu (%)" value={D(resolvedGoals.targetHbA1c)} />
        <FieldRow label="Bước chân/ngày" value={D(resolvedGoals.dailySteps)} />
        <FieldRow label="Nước/ngày (cốc)" value={D(resolvedGoals.waterCups)} />
      </div>

      {/* Tuỳ chọn AI */}
      <div className="rounded-2xl border p-4 bg-white shadow-sm">
        <h3 className="font-semibold mb-2">Trợ lý AI</h3>
        <FieldRow label="Phong cách AI" value={D(resolvedPrefs.ai_persona)} />
        <FieldRow label="Mức độ hướng dẫn" value={D(resolvedPrefs.guidance_level)} />
        <FieldRow
          label="Chế độ hỏi ít"
          value={D(
            typeof resolvedPrefs.low_ask_mode === 'boolean'
              ? resolvedPrefs.low_ask_mode
                ? 'Bật'
                : 'Tắt'
              : '—'
          )}
        />
      </div>

      <RelativesPanel />
    </section>
  );
}
