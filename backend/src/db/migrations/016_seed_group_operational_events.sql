WITH audit_seed(actor_username, actor_role, action_type, target_group_name, reason, before_state, after_state, created_at) AS (
    VALUES
        (
            'admin.user',
            'admin',
            'create_group',
            'CCM-Students',
            'Seeded group creation event for operational log action column.',
            NULL::jsonb,
            '{"name":"CCM-Students","quotaPeriod":"Monthly","initialBalance":1000}'::jsonb,
            TIMESTAMPTZ '2026-04-28 09:35:00+03'
        ),
        (
            'admin.user',
            'admin',
            'update_group',
            'Faculty',
            'Seeded group policy update event for operational log action column.',
            '{"initialBalance":4500}'::jsonb,
            '{"initialBalance":5000}'::jsonb,
            TIMESTAMPTZ '2026-05-01 13:30:00+03'
        ),
        (
            'admin.user',
            'admin',
            'delete_group',
            'Archived Lab Access',
            'Seeded deleted-group event for operational log action column.',
            '{"name":"Archived Lab Access"}'::jsonb,
            '{"deleted":true}'::jsonb,
            TIMESTAMPTZ '2026-05-02 09:45:00+03'
        )
)
INSERT INTO audit_logs (
    actor_user_id,
    actor_role,
    action_category,
    action_type,
    target_type,
    target_id,
    reason,
    before_state,
    after_state,
    created_at
)
SELECT
    actor.id,
    audit_seed.actor_role,
    'group',
    audit_seed.action_type,
    'group',
    COALESCE(target.group_uuid::text, audit_seed.target_group_name),
    audit_seed.reason,
    audit_seed.before_state,
    audit_seed.after_state,
    audit_seed.created_at
FROM audit_seed
LEFT JOIN users actor ON actor.username = audit_seed.actor_username
LEFT JOIN ad_groups target ON target.name = audit_seed.target_group_name
WHERE NOT EXISTS (
    SELECT 1
    FROM audit_logs existing
    WHERE existing.action_category = 'group'
    AND existing.action_type = audit_seed.action_type
    AND existing.target_id = COALESCE(target.group_uuid::text, audit_seed.target_group_name)
    AND existing.created_at = audit_seed.created_at
);
