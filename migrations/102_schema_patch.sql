BEGIN;

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS waist_cm NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS goal TEXT,
  ADD COLUMN IF NOT EXISTS conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS prefs JSONB NOT NULL DEFAULT '{}'::jsonb;

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

COMMIT;
