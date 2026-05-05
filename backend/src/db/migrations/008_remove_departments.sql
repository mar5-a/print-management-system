DELETE FROM queue_access_rules
WHERE rule_type = 'department';

ALTER TABLE queue_access_rules
DROP CONSTRAINT IF EXISTS queue_access_rules_rule_type_check;

ALTER TABLE queue_access_rules
ADD CONSTRAINT queue_access_rules_rule_type_check
CHECK (rule_type IN ('role', 'ad_group', 'user'));

DROP INDEX IF EXISTS idx_users_department_id;

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_department_id_fkey;

ALTER TABLE users
DROP COLUMN IF EXISTS department_id;

DROP TABLE IF EXISTS departments;
