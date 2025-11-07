// Domain types aligned with the Asinu/DIABOT V5 schema

export type Sex = 'male' | 'female' | 'other';
export type GlucoseContext = 'fasting' | 'pre_meal' | 'post_meal' | 'random';
export type InsulinType = 'rapid' | 'regular' | 'intermediate' | 'long' | 'mixed' | 'other';

export interface Profile {
  user_id: string;
  id: string; // alias for compatibility with legacy callers
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  dob?: string | null; // ISO date
  sex?: Sex | null;
  timezone?: string | null;
  created_at: string;
  updated_at: string;
  // Settings payload (user_settings)
  unit_glucose: 'mgdl' | 'mmol';
  bg_target_min_mgdl?: number | null;
  bg_target_max_mgdl?: number | null;
  carb_ratio_g_per_u?: number | null;
  insulin_sensitivity_mgdl_per_u?: number | null;
  reminder_flags?: Record<string, any>;
  height_cm?: number | null;
  weight_kg?: number | null;
  waist_cm?: number | null;
  goal?: string | null;
  conditions?: Record<string, any>;
  prefs?: Record<string, any>;
  settings_created_at?: string | null;
  settings_updated_at?: string | null;
}

export interface GlucoseLog {
  id: number;
  user_id: string;
  value_mgdl: number;
  context?: GlucoseContext | null;
  meal_id?: number | null;
  notes?: string | null;
  noted_at: string;
  created_at: string;
  updated_at: string;
}

export interface MealLog {
  id: number;
  user_id: string;
  title?: string | null;
  carb_g?: number | null;
  protein_g?: number | null;
  fat_g?: number | null;
  kcal?: number | null;
  photo_key?: string | null;
  notes?: string | null;
  noted_at: string;
  created_at: string;
  updated_at: string;
}

export interface WaterLog {
  id: number;
  user_id: string;
  volume_ml: number;
  noted_at: string;
  created_at: string;
  updated_at: string;
}

export interface InsulinLog {
  id: number;
  user_id: string;
  insulin_type?: InsulinType | null;
  dose_units: number;
  meal_id?: number | null;
  notes?: string | null;
  noted_at: string;
  created_at: string;
  updated_at: string;
}

export interface WeightLog {
  id: number;
  user_id: string;
  weight_kg: number;
  bodyfat_pct?: number | null;
  noted_at: string;
  created_at: string;
  updated_at: string;
}

export interface BpLog {
  id: number;
  user_id: string;
  sys: number;
  dia: number;
  pulse?: number | null;
  noted_at: string;
  created_at: string;
  updated_at: string;
}

export interface MetricDay {
  id: number;
  user_id: string;
  day: string; // ISO date
  metric: string;
  value: Record<string, any>;
  updated_at: string;
}

export interface MetricWeek {
  id: number;
  user_id: string;
  week: number;
  metric: string;
  value: Record<string, any>;
  updated_at: string;
}
