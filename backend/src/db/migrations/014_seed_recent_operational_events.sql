WITH audit_seed(actor_username, actor_role, action_category, action_type, target_type, target_id, reason, after_state, created_at) AS (
    VALUES
        ('admin.user', 'admin', 'queue', 'update_queue', 'queue', 'Shared A1 Print Queue', 'Adjusted queue policy during the current mock operations window.', '{"queue":"Shared A1 Print Queue","status":"active"}'::jsonb, TIMESTAMPTZ '2026-04-28 09:05:00+03'),
        ('admin.user', 'admin', 'printer', 'update_printer', 'printer', 'Printer C3', 'Marked Printer C3 maintenance state for seeded device checks.', '{"printer":"Printer C3","status":"maintenance"}'::jsonb, TIMESTAMPTZ '2026-05-01 12:10:00+03'),
        ('tech.user', 'technician', 'device', 'review_device_error', 'device_errors', 'Printer C3 toner warning', 'Reviewed seeded toner warning for Printer C3.', '{"status":"acknowledged"}'::jsonb, TIMESTAMPTZ '2026-05-02 08:15:00+03')
)
INSERT INTO audit_logs (
    actor_user_id,
    actor_role,
    action_category,
    action_type,
    target_type,
    target_id,
    reason,
    after_state,
    created_at
)
SELECT
    users.id,
    audit_seed.actor_role,
    audit_seed.action_category,
    audit_seed.action_type,
    audit_seed.target_type,
    audit_seed.target_id,
    audit_seed.reason,
    audit_seed.after_state,
    audit_seed.created_at
FROM audit_seed
LEFT JOIN users ON users.username = audit_seed.actor_username
WHERE NOT EXISTS (
    SELECT 1
    FROM audit_logs existing
    WHERE existing.action_type = audit_seed.action_type
    AND existing.target_id = audit_seed.target_id
    AND existing.created_at = audit_seed.created_at
);

WITH event_seed(sequence_number, actor_username, event_type, event_source, message, created_at) AS (
    VALUES
        (26, 'john.doe', 'completed', 'printer', 'Printer A1 completed John Doe''s recent mock job.', TIMESTAMPTZ '2026-04-28 10:34:00+03'),
        (27, 'jane.smith', 'completed', 'printer', 'Printer B2 completed Jane Smith''s recent mock job.', TIMESTAMPTZ '2026-04-29 10:51:00+03'),
        (28, 'bob.wilson', 'completed', 'printer', 'Printer C3 completed Bob Wilson''s recent mock job.', TIMESTAMPTZ '2026-04-30 11:08:00+03'),
        (29, 'alice.brown', 'completed', 'printer', 'Printer A1 completed Alice Brown''s recent mock job.', TIMESTAMPTZ '2026-05-01 11:25:00+03'),
        (30, 'charlie.davis', 'completed', 'printer', 'Printer D1 completed Charlie Davis'' recent mock job.', TIMESTAMPTZ '2026-05-02 11:42:00+03')
),
event_rows AS (
    SELECT
        ('30000000-0000-0000-0000-' || LPAD(event_seed.sequence_number::text, 12, '0'))::uuid AS job_uuid,
        event_seed.*
    FROM event_seed
)
INSERT INTO print_job_events (
    print_job_id,
    actor_user_id,
    event_type,
    event_source,
    message,
    created_at
)
SELECT
    print_jobs.id,
    users.id,
    event_rows.event_type,
    event_rows.event_source,
    event_rows.message,
    event_rows.created_at
FROM event_rows
JOIN print_jobs ON print_jobs.job_uuid = event_rows.job_uuid
LEFT JOIN users ON users.username = event_rows.actor_username
WHERE NOT EXISTS (
    SELECT 1
    FROM print_job_events existing
    WHERE existing.print_job_id = print_jobs.id
    AND existing.event_type = event_rows.event_type
    AND existing.created_at = event_rows.created_at
);

WITH auth_log_seed(username_attempted, source_ip, result, failure_reason, created_at) AS (
    VALUES
        ('admin.user', '10.20.1.10'::inet, 'success', NULL, TIMESTAMPTZ '2026-05-02 08:02:00+03'),
        ('tech.user', '10.20.1.11'::inet, 'success', NULL, TIMESTAMPTZ '2026-05-02 08:04:00+03')
)
INSERT INTO auth_logs (
    user_id,
    username_attempted,
    source_ip,
    result,
    failure_reason,
    created_at
)
SELECT
    users.id,
    auth_log_seed.username_attempted,
    auth_log_seed.source_ip,
    auth_log_seed.result,
    auth_log_seed.failure_reason,
    auth_log_seed.created_at
FROM auth_log_seed
LEFT JOIN users ON users.username = auth_log_seed.username_attempted
WHERE NOT EXISTS (
    SELECT 1
    FROM auth_logs existing
    WHERE existing.username_attempted = auth_log_seed.username_attempted
    AND existing.created_at = auth_log_seed.created_at
);

WITH error_seed(printer_name, queue_name, error_code, severity, status, title, description, detected_at) AS (
    VALUES
        ('Printer C3', 'Sales C3 Print Queue', 'C3-TONER-LOW', 'medium', 'acknowledged', 'Printer C3 toner warning', 'Seeded operational warning for the recent logs page.', TIMESTAMPTZ '2026-05-02 08:10:00+03')
)
INSERT INTO device_errors (
    printer_id,
    queue_id,
    error_code,
    severity,
    status,
    title,
    description,
    detected_at
)
SELECT
    printers.id,
    print_queues.id,
    error_seed.error_code,
    error_seed.severity,
    error_seed.status,
    error_seed.title,
    error_seed.description,
    error_seed.detected_at
FROM error_seed
JOIN printers ON printers.name = error_seed.printer_name
JOIN print_queues ON print_queues.name = error_seed.queue_name
WHERE NOT EXISTS (
    SELECT 1
    FROM device_errors existing
    WHERE existing.title = error_seed.title
    AND existing.detected_at = error_seed.detected_at
);
