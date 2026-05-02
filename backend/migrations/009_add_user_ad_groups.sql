CREATE TABLE IF NOT EXISTS ad_groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_ad_group_memberships (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id BIGINT NOT NULL REFERENCES ad_groups(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, group_id)
);

INSERT INTO ad_groups (name) VALUES
    ('CCM-Students'),
    ('Faculty'),
    ('Technicians'),
    ('Administrators'),
    ('AI Lab')
ON CONFLICT (name) DO NOTHING;

WITH role_groups AS (
    SELECT DISTINCT
        users.id AS user_id,
        CASE
            WHEN roles.name = 'admin' THEN 'Administrators'
            WHEN roles.name = 'technician' THEN 'Technicians'
            ELSE 'CCM-Students'
        END AS group_name
    FROM users
    JOIN user_roles ON user_roles.user_id = users.id
    JOIN roles ON roles.id = user_roles.role_id
)
INSERT INTO user_ad_group_memberships (user_id, group_id)
SELECT role_groups.user_id, ad_groups.id
FROM role_groups
JOIN ad_groups ON ad_groups.name = role_groups.group_name
ON CONFLICT DO NOTHING;
