BEGIN;

-- Additional helper indexes to support dashboard lookups.
CREATE INDEX IF NOT EXISTS idx_log_bg_meal_id ON log_bg(meal_id);
CREATE INDEX IF NOT EXISTS idx_log_insulin_meal_id ON log_insulin(meal_id);
CREATE INDEX IF NOT EXISTS idx_media_file_bucket_object ON media_file(bucket, object_key);

COMMIT;
