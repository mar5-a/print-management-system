ALTER TABLE ad_groups
DROP CONSTRAINT IF EXISTS ad_groups_new_user_quota_check;

ALTER TABLE ad_groups
DROP COLUMN IF EXISTS new_user_quota;
