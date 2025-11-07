BEGIN;

DROP VIEW IF EXISTS v_bg_metrics_week;
DROP VIEW IF EXISTS v_bg_metrics_month;

CREATE OR REPLACE VIEW view_bg_weekly AS
SELECT
  user_id,
  date_trunc('week', noted_at)::date AS week_start,
  AVG(value_mgdl) AS avg_bg_mgdl,
  COUNT(*) AS readings_count
FROM log_bg
GROUP BY user_id, date_trunc('week', noted_at)::date;

CREATE OR REPLACE VIEW view_bg_monthly AS
SELECT
  user_id,
  date_trunc('month', noted_at)::date AS month_start,
  AVG(value_mgdl) AS avg_bg_mgdl,
  COUNT(*) AS readings_count
FROM log_bg
GROUP BY user_id, date_trunc('month', noted_at)::date;

COMMIT;
