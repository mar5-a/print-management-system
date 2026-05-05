ALTER TABLE printers
ADD COLUMN IF NOT EXISTS hosted_on VARCHAR(255),
ADD COLUMN IF NOT EXISTS release_mode VARCHAR(32) NOT NULL DEFAULT 'secure_release';

UPDATE printers
SET hosted_on = CASE
    WHEN hosted_on IS NOT NULL AND hosted_on <> '' THEN hosted_on
    WHEN connector_type = 'windows_queue' THEN 'Windows connector'
    WHEN connector_type = 'raw_socket' THEN 'Raw socket connector'
    WHEN connector_type = 'ipp' THEN 'IPP connector'
    WHEN connector_type = 'hp_oxp' THEN 'HP OXP connector'
    ELSE 'Manual connector'
END;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'printers_release_mode_check'
  ) THEN
    ALTER TABLE printers
    ADD CONSTRAINT printers_release_mode_check
    CHECK (release_mode IN ('secure_release', 'immediate'));
  END IF;
END $$;
