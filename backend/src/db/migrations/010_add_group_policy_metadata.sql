ALTER TABLE ad_groups
ADD COLUMN IF NOT EXISTS group_uuid UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS quota_period VARCHAR(32) NOT NULL DEFAULT 'Monthly',
ADD COLUMN IF NOT EXISTS initial_balance INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN IF NOT EXISTS initial_restriction BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS default_for_new_users BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE ad_groups
SET group_uuid = gen_random_uuid()
WHERE group_uuid IS NULL;

ALTER TABLE ad_groups
ALTER COLUMN group_uuid SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_groups_group_uuid ON ad_groups(group_uuid);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ad_groups_quota_period_check'
  ) THEN
    ALTER TABLE ad_groups
    ADD CONSTRAINT ad_groups_quota_period_check
    CHECK (quota_period IN ('Weekly', 'Monthly', 'Semester'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ad_groups_initial_balance_check'
  ) THEN
    ALTER TABLE ad_groups
    ADD CONSTRAINT ad_groups_initial_balance_check
    CHECK (initial_balance >= 0);
  END IF;

END $$;

UPDATE ad_groups
SET
    description = CASE name
        WHEN 'CCM-Students' THEN 'Default student quota and secure-release access group.'
        WHEN 'Faculty' THEN 'Faculty access group with semester quota defaults.'
        WHEN 'Technicians' THEN 'Operational support group for printer and queue management.'
        WHEN 'Administrators' THEN 'Administrative group for print management operators.'
        WHEN 'AI Lab' THEN 'Lab group for shared AI classroom printing.'
        ELSE description
    END,
    quota_period = CASE name
        WHEN 'Faculty' THEN 'Semester'
        ELSE 'Monthly'
    END,
    initial_balance = CASE name
        WHEN 'CCM-Students' THEN 1000
        WHEN 'Faculty' THEN 5000
        WHEN 'Technicians' THEN 3000
        WHEN 'Administrators' THEN 10000
        WHEN 'AI Lab' THEN 1500
        ELSE initial_balance
    END,
    initial_restriction = CASE name
        WHEN 'CCM-Students' THEN TRUE
        ELSE initial_restriction
    END,
    default_for_new_users = CASE name
        WHEN 'CCM-Students' THEN TRUE
        ELSE FALSE
    END,
    updated_at = NOW()
WHERE name IN ('CCM-Students', 'Faculty', 'Technicians', 'Administrators', 'AI Lab');

DROP TRIGGER IF EXISTS set_ad_groups_updated_at ON ad_groups;

CREATE TRIGGER set_ad_groups_updated_at
    BEFORE UPDATE ON ad_groups
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
