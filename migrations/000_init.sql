-- DIABOT DB Migration - Core Schema (Asinu)
-- Generated: 2025-10-09
-- Scope: Core MVP schema aligned with DIABOT V5 storage conventions.

-- Ensure pgcrypto is available for UUID generation.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================================
-- 1) User profile and configuration
-- =====================================================================
CREATE TABLE IF NOT EXISTS app_user (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  phone TEXT,
  display_name TEXT,
  dob DATE,
  sex TEXT CHECK (sex IN ('male','female','other')),
  timezone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES app_user(user_id) ON DELETE CASCADE,
  unit_glucose TEXT NOT NULL DEFAULT 'mgdl' CHECK (unit_glucose IN ('mgdl','mmol')),
  bg_target_min_mgdl NUMERIC,
  bg_target_max_mgdl NUMERIC,
  carb_ratio_g_per_u NUMERIC,
  insulin_sensitivity_mgdl_per_u NUMERIC,
  reminder_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  height_cm NUMERIC(5,2),
  weight_kg NUMERIC(5,2),
  waist_cm NUMERIC(5,2),
  goal TEXT,
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  prefs JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 2) Core health logs (MVP backbone)
-- =====================================================================
CREATE TABLE IF NOT EXISTS log_meal (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  title TEXT,
  carb_g NUMERIC(6,1),
  protein_g NUMERIC(6,1),
  fat_g NUMERIC(6,1),
  kcal INT,
  photo_key TEXT,
  notes TEXT,
  noted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_log_meal_user_noted_at ON log_meal(user_id, noted_at DESC);

CREATE TABLE IF NOT EXISTS log_bg (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  value_mgdl NUMERIC(5,1) NOT NULL,
  context TEXT CHECK (context IN ('fasting','pre_meal','post_meal','random')),
  meal_id BIGINT REFERENCES log_meal(id) ON DELETE SET NULL,
  notes TEXT,
  noted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_log_bg_user_noted_at ON log_bg(user_id, noted_at DESC);

CREATE TABLE IF NOT EXISTS log_bp (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  sys INT NOT NULL,
  dia INT NOT NULL,
  pulse INT,
  noted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_log_bp_user_noted_at ON log_bp(user_id, noted_at DESC);

CREATE TABLE IF NOT EXISTS log_weight (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  weight_kg NUMERIC(5,2) NOT NULL,
  bodyfat_pct NUMERIC(5,2),
  noted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_log_weight_user_noted_at ON log_weight(user_id, noted_at DESC);

CREATE TABLE IF NOT EXISTS log_water (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  volume_ml INT NOT NULL CHECK (volume_ml > 0),
  noted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_log_water_user_noted_at ON log_water(user_id, noted_at DESC);

CREATE TABLE IF NOT EXISTS log_insulin (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  insulin_type TEXT CHECK (insulin_type IN ('rapid','regular','intermediate','long','mixed','other')),
  dose_units NUMERIC(5,2) NOT NULL,
  meal_id BIGINT REFERENCES log_meal(id) ON DELETE SET NULL,
  notes TEXT,
  noted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_log_insulin_user_noted_at ON log_insulin(user_id, noted_at DESC);

-- =====================================================================
-- 3) Optional quick-enable modules (activity & sleep)
-- =====================================================================
CREATE TABLE IF NOT EXISTS log_activity (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  type TEXT,
  duration_min INT NOT NULL,
  steps INT,
  kcal INT,
  noted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_log_activity_user_noted_at ON log_activity(user_id, noted_at DESC);

CREATE TABLE IF NOT EXISTS log_sleep (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  duration_min INT NOT NULL,
  quality_score INT,
  noted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_log_sleep_user_noted_at ON log_sleep(user_id, noted_at DESC);

-- =====================================================================
-- 4) Metrics aggregates
-- =====================================================================
CREATE TABLE IF NOT EXISTS metrics_day (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  day DATE NOT NULL,
  metric TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_metrics_day_user_metric_day ON metrics_day(user_id, metric, day);
CREATE INDEX IF NOT EXISTS idx_metrics_day_user_day ON metrics_day(user_id, day DESC);

CREATE TABLE IF NOT EXISTS metrics_week (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  week INT NOT NULL,
  metric TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_metrics_week_user_metric_week ON metrics_week(user_id, metric, week);
CREATE INDEX IF NOT EXISTS idx_metrics_week_user_week ON metrics_week(user_id, week DESC);

-- =====================================================================
-- 5) Media / attachments metadata (object storage only)
-- =====================================================================
CREATE TABLE IF NOT EXISTS media_file (
  file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  bucket TEXT NOT NULL,
  object_key TEXT NOT NULL,
  mime TEXT,
  size_bytes BIGINT,
  checksum_md5 TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_file_user_created_at ON media_file(user_id, created_at DESC);
