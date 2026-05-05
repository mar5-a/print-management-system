WITH audit_seed(actor_username, actor_role, action_type, target_username, reason, before_state, after_state, created_at) AS (
    VALUES
        (
            'admin.user',
            'admin',
            'create_user',
            'john.doe',
            'Seeded user creation event for operational log filtering.',
            NULL::jsonb,
            '{"username":"john.doe","displayName":"John Doe","role":"standard_user"}'::jsonb,
            TIMESTAMPTZ '2026-04-28 09:18:00+03'
        ),
        (
            'admin.user',
            'admin',
            'update_user',
            'alice.brown',
            'Seeded user profile update event for operational log filtering.',
            '{"is_suspended":true}'::jsonb,
            '{"is_suspended":false}'::jsonb,
            TIMESTAMPTZ '2026-05-01 14:05:00+03'
        ),
        (
            'admin.user',
            'admin',
            'delete_user',
            'archived.student',
            'Seeded deleted-user event for operational log filtering.',
            '{"username":"archived.student","displayName":"Archived Student"}'::jsonb,
            '{"deleted":true}'::jsonb,
            TIMESTAMPTZ '2026-05-02 09:20:00+03'
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
    'user',
    audit_seed.action_type,
    'user',
    COALESCE(target.user_uuid::text, audit_seed.target_username),
    audit_seed.reason,
    audit_seed.before_state,
    audit_seed.after_state,
    audit_seed.created_at
FROM audit_seed
LEFT JOIN users actor ON actor.username = audit_seed.actor_username
LEFT JOIN users target ON target.username = audit_seed.target_username
WHERE NOT EXISTS (
    SELECT 1
    FROM audit_logs existing
    WHERE existing.action_category = 'user'
    AND existing.action_type = audit_seed.action_type
    AND existing.target_id = COALESCE(target.user_uuid::text, audit_seed.target_username)
    AND existing.created_at = audit_seed.created_at
);
