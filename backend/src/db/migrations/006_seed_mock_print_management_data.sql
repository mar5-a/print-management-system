INSERT INTO departments (name, code) VALUES
    ('Engineering', 'ENG'),
    ('Marketing', 'MKT'),
    ('Sales', 'SALES'),
    ('Human Resources', 'HR'),
    ('Finance', 'FIN')
ON CONFLICT (name) DO UPDATE SET
    code = EXCLUDED.code,
    updated_at = NOW();

WITH seeded_users(username, email, display_name, university_id, department_code) AS (
    VALUES
        ('john.doe', 'john.doe@ccm.edu.sa', 'John Doe', 'MOCK-USER-001', 'ENG'),
        ('jane.smith', 'jane.smith@ccm.edu.sa', 'Jane Smith', 'MOCK-USER-002', 'MKT'),
        ('bob.wilson', 'bob.wilson@ccm.edu.sa', 'Bob Wilson', 'MOCK-USER-003', 'SALES'),
        ('alice.brown', 'alice.brown@ccm.edu.sa', 'Alice Brown', 'MOCK-USER-004', 'HR'),
        ('charlie.davis', 'charlie.davis@ccm.edu.sa', 'Charlie Davis', 'MOCK-USER-005', 'FIN')
)
INSERT INTO users (username, email, display_name, university_id, department_id)
SELECT
    seeded_users.username,
    seeded_users.email,
    seeded_users.display_name,
    seeded_users.university_id,
    departments.id
FROM seeded_users
JOIN departments ON departments.code = seeded_users.department_code
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    university_id = EXCLUDED.university_id,
    department_id = EXCLUDED.department_id,
    is_active = TRUE,
    is_suspended = FALSE,
    updated_at = NOW();

INSERT INTO user_roles (user_id, role_id)
SELECT users.id, roles.id
FROM users
CROSS JOIN roles
WHERE users.username IN ('john.doe', 'jane.smith', 'bob.wilson', 'alice.brown', 'charlie.davis')
AND roles.name = 'standard_user'
ON CONFLICT DO NOTHING;

WITH quota_seed(username, allocated_pages, used_pages) AS (
    VALUES
        ('john.doe', 1200, 25),
        ('jane.smith', 1200, 50),
        ('bob.wilson', 800, 12),
        ('alice.brown', 900, 8),
        ('charlie.davis', 1000, 35)
),
admin_user AS (
    SELECT id FROM users WHERE username = 'admin.user'
)
INSERT INTO user_quotas (user_id, quota_period, allocated_pages, used_pages, reset_at, updated_by)
SELECT
    users.id,
    'semester',
    quota_seed.allocated_pages,
    quota_seed.used_pages,
    TIMESTAMPTZ '2026-08-01 00:00:00+03',
    admin_user.id
FROM quota_seed
JOIN users ON users.username = quota_seed.username
CROSS JOIN admin_user
ON CONFLICT (user_id, quota_period) DO UPDATE SET
    allocated_pages = EXCLUDED.allocated_pages,
    used_pages = EXCLUDED.used_pages,
    reset_at = EXCLUDED.reset_at,
    updated_by = EXCLUDED.updated_by,
    updated_at = NOW();

INSERT INTO printers (
    name,
    device_code,
    model,
    ip_address,
    connector_type,
    connector_target,
    connector_options,
    location,
    status,
    is_color,
    supports_duplex,
    cost_per_bw_page,
    cost_per_color_page,
    serial_number,
    notes,
    toner_level
) VALUES
    (
        'Printer A1',
        'PRT-A1',
        'HP LaserJet Enterprise M611',
        '10.10.1.25',
        'raw_socket',
        '10.10.1.25:9100',
        '{"language":"postscript","endOfJobMarker":"0x04"}'::jsonb,
        'Building A, Floor 1',
        'online',
        FALSE,
        TRUE,
        0.0500,
        0.1200,
        'HP-A1-99341',
        'Mock student and staff printer used by recent print logs.',
        82
    ),
    (
        'Printer B2',
        'PRT-B2',
        'Canon imageRUNNER DX C5840i',
        '10.10.1.26',
        'raw_socket',
        '10.10.1.26:9100',
        '{"language":"postscript","endOfJobMarker":"0x04"}'::jsonb,
        'Building B, Floor 2',
        'online',
        TRUE,
        TRUE,
        0.0500,
        0.1200,
        'CA-B2-10223',
        'Mock color-capable printer for marketing and faculty jobs.',
        46
    ),
    (
        'Printer C3',
        'PRT-C3',
        'Xerox VersaLink C7130',
        '10.10.1.27',
        'raw_socket',
        '10.10.1.27:9100',
        '{"language":"postscript","endOfJobMarker":"0x04"}'::jsonb,
        'Building C, Floor 3',
        'maintenance',
        TRUE,
        TRUE,
        0.0500,
        0.1200,
        'XR-C3-44821',
        'Mock printer with a seeded failed print event.',
        18
    ),
    (
        'Printer D1',
        'PRT-D1',
        'Ricoh IM C3000',
        '10.10.1.28',
        'raw_socket',
        '10.10.1.28:9100',
        '{"language":"postscript","endOfJobMarker":"0x04"}'::jsonb,
        'Library, Ground Floor',
        'online',
        TRUE,
        TRUE,
        0.0500,
        0.1200,
        'RC-D1-22094',
        'Mock printer with a held secure-release job.',
        64
    )
ON CONFLICT (name) DO UPDATE SET
    device_code = EXCLUDED.device_code,
    model = EXCLUDED.model,
    ip_address = EXCLUDED.ip_address,
    connector_type = EXCLUDED.connector_type,
    connector_target = EXCLUDED.connector_target,
    connector_options = EXCLUDED.connector_options,
    location = EXCLUDED.location,
    status = EXCLUDED.status,
    is_color = EXCLUDED.is_color,
    supports_duplex = EXCLUDED.supports_duplex,
    cost_per_bw_page = EXCLUDED.cost_per_bw_page,
    cost_per_color_page = EXCLUDED.cost_per_color_page,
    serial_number = EXCLUDED.serial_number,
    notes = EXCLUDED.notes,
    toner_level = EXCLUDED.toner_level,
    updated_at = NOW();

WITH queue_seed(name, description, queue_type, priority_order) AS (
    VALUES
        ('Shared A1 Print Queue', 'Secure-release queue for Engineering and HR jobs on Printer A1.', 'mixed', 100),
        ('Marketing B2 Print Queue', 'Secure-release color queue for Marketing jobs on Printer B2.', 'staff', 110),
        ('Sales C3 Print Queue', 'Secure-release queue for Sales jobs on Printer C3.', 'staff', 120),
        ('Finance D1 Print Queue', 'Secure-release queue for Finance jobs on Printer D1.', 'staff', 130)
),
admin_user AS (
    SELECT id FROM users WHERE username = 'admin.user'
)
INSERT INTO print_queues (
    name,
    description,
    queue_type,
    priority_order,
    is_default,
    release_mode,
    status,
    retention_hours,
    created_by
)
SELECT
    queue_seed.name,
    queue_seed.description,
    queue_seed.queue_type,
    queue_seed.priority_order,
    FALSE,
    'secure_release',
    'active',
    24,
    admin_user.id
FROM queue_seed
CROSS JOIN admin_user
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    queue_type = EXCLUDED.queue_type,
    priority_order = EXCLUDED.priority_order,
    is_default = EXCLUDED.is_default,
    release_mode = EXCLUDED.release_mode,
    status = EXCLUDED.status,
    retention_hours = EXCLUDED.retention_hours,
    created_by = EXCLUDED.created_by,
    updated_at = NOW();

WITH assignment_seed(queue_name, printer_name, priority_order) AS (
    VALUES
        ('Shared A1 Print Queue', 'Printer A1', 100),
        ('Marketing B2 Print Queue', 'Printer B2', 110),
        ('Sales C3 Print Queue', 'Printer C3', 120),
        ('Finance D1 Print Queue', 'Printer D1', 130)
)
INSERT INTO queue_printers (queue_id, printer_id, is_primary, is_enabled, priority_order)
SELECT
    print_queues.id,
    printers.id,
    TRUE,
    TRUE,
    assignment_seed.priority_order
FROM assignment_seed
JOIN print_queues ON print_queues.name = assignment_seed.queue_name
JOIN printers ON printers.name = assignment_seed.printer_name
ON CONFLICT (printer_id) DO UPDATE SET
    queue_id = EXCLUDED.queue_id,
    is_primary = EXCLUDED.is_primary,
    is_enabled = EXCLUDED.is_enabled,
    priority_order = EXCLUDED.priority_order;

WITH access_seed(queue_name, rule_type, rule_value) AS (
    VALUES
        ('Shared A1 Print Queue', 'role', 'standard_user'),
        ('Shared A1 Print Queue', 'department', 'Engineering'),
        ('Shared A1 Print Queue', 'department', 'Human Resources'),
        ('Marketing B2 Print Queue', 'role', 'standard_user'),
        ('Marketing B2 Print Queue', 'department', 'Marketing'),
        ('Sales C3 Print Queue', 'role', 'standard_user'),
        ('Sales C3 Print Queue', 'department', 'Sales'),
        ('Finance D1 Print Queue', 'role', 'standard_user'),
        ('Finance D1 Print Queue', 'department', 'Finance')
)
INSERT INTO queue_access_rules (queue_id, rule_type, rule_value)
SELECT print_queues.id, access_seed.rule_type, access_seed.rule_value
FROM access_seed
JOIN print_queues ON print_queues.name = access_seed.queue_name
ON CONFLICT (queue_id, rule_type, rule_value) DO NOTHING;

WITH pricing_seed(name, queue_name, printer_name, color_mode, cost_per_page) AS (
    VALUES
        ('Mock A1 B/W page rate', 'Shared A1 Print Queue', 'Printer A1', 'bw', 0.0500),
        ('Mock B2 B/W page rate', 'Marketing B2 Print Queue', 'Printer B2', 'bw', 0.0500),
        ('Mock C3 B/W page rate', 'Sales C3 Print Queue', 'Printer C3', 'bw', 0.0500),
        ('Mock D1 B/W page rate', 'Finance D1 Print Queue', 'Printer D1', 'bw', 0.0500)
)
INSERT INTO pricing_rules (
    name,
    queue_id,
    printer_id,
    paper_type,
    color_mode,
    duplex_discount_percent,
    cost_per_page,
    is_active
)
SELECT
    pricing_seed.name,
    print_queues.id,
    printers.id,
    'standard',
    pricing_seed.color_mode,
    0.00,
    pricing_seed.cost_per_page,
    TRUE
FROM pricing_seed
JOIN print_queues ON print_queues.name = pricing_seed.queue_name
JOIN printers ON printers.name = pricing_seed.printer_name
ON CONFLICT (name) DO UPDATE SET
    queue_id = EXCLUDED.queue_id,
    printer_id = EXCLUDED.printer_id,
    paper_type = EXCLUDED.paper_type,
    color_mode = EXCLUDED.color_mode,
    duplex_discount_percent = EXCLUDED.duplex_discount_percent,
    cost_per_page = EXCLUDED.cost_per_page,
    is_active = EXCLUDED.is_active;

WITH job_seed(
    job_uuid,
    username,
    queue_name,
    printer_name,
    page_count,
    cost,
    status,
    printed_at,
    failure_reason
) AS (
    VALUES
        ('10000000-0000-0000-0000-000000000001'::uuid, 'john.doe', 'Shared A1 Print Queue', 'Printer A1', 25, 1.2500, 'completed', TIMESTAMPTZ '2026-04-06 09:45:00+03', NULL),
        ('10000000-0000-0000-0000-000000000002'::uuid, 'jane.smith', 'Marketing B2 Print Queue', 'Printer B2', 50, 2.5000, 'completed', TIMESTAMPTZ '2026-04-06 09:32:00+03', NULL),
        ('10000000-0000-0000-0000-000000000003'::uuid, 'bob.wilson', 'Sales C3 Print Queue', 'Printer C3', 12, 0.6000, 'failed', TIMESTAMPTZ '2026-04-06 09:15:00+03', 'Printer reported a paper feed error before release completed.'),
        ('10000000-0000-0000-0000-000000000004'::uuid, 'alice.brown', 'Shared A1 Print Queue', 'Printer A1', 8, 0.4000, 'completed', TIMESTAMPTZ '2026-04-06 08:50:00+03', NULL),
        ('10000000-0000-0000-0000-000000000005'::uuid, 'charlie.davis', 'Finance D1 Print Queue', 'Printer D1', 35, 1.7500, 'held', TIMESTAMPTZ '2026-04-06 08:30:00+03', NULL)
)
INSERT INTO print_jobs (
    job_uuid,
    user_id,
    queue_id,
    printer_id,
    source_channel,
    release_channel,
    page_count,
    page_count_source,
    copy_count,
    color_mode,
    duplex,
    paper_type,
    estimated_cost,
    final_cost,
    status,
    submitted_at,
    released_at,
    completed_at,
    expires_at,
    failure_reason
)
SELECT
    job_seed.job_uuid,
    users.id,
    print_queues.id,
    printers.id,
    'web_upload',
    CASE WHEN job_seed.status = 'held' THEN NULL ELSE 'web' END,
    job_seed.page_count,
    'user_estimate',
    1,
    'bw',
    TRUE,
    'standard',
    job_seed.cost,
    CASE WHEN job_seed.status = 'held' THEN NULL ELSE job_seed.cost END,
    job_seed.status,
    job_seed.printed_at - INTERVAL '3 minutes',
    CASE WHEN job_seed.status = 'held' THEN NULL ELSE job_seed.printed_at - INTERVAL '1 minute' END,
    CASE WHEN job_seed.status = 'completed' THEN job_seed.printed_at ELSE NULL END,
    job_seed.printed_at + INTERVAL '24 hours',
    job_seed.failure_reason
FROM job_seed
JOIN users ON users.username = job_seed.username
JOIN print_queues ON print_queues.name = job_seed.queue_name
JOIN printers ON printers.name = job_seed.printer_name
ON CONFLICT (job_uuid) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    queue_id = EXCLUDED.queue_id,
    printer_id = EXCLUDED.printer_id,
    source_channel = EXCLUDED.source_channel,
    release_channel = EXCLUDED.release_channel,
    page_count = EXCLUDED.page_count,
    page_count_source = EXCLUDED.page_count_source,
    copy_count = EXCLUDED.copy_count,
    color_mode = EXCLUDED.color_mode,
    duplex = EXCLUDED.duplex,
    paper_type = EXCLUDED.paper_type,
    estimated_cost = EXCLUDED.estimated_cost,
    final_cost = EXCLUDED.final_cost,
    status = EXCLUDED.status,
    submitted_at = EXCLUDED.submitted_at,
    released_at = EXCLUDED.released_at,
    completed_at = EXCLUDED.completed_at,
    expires_at = EXCLUDED.expires_at,
    failure_reason = EXCLUDED.failure_reason,
    updated_at = NOW();

WITH file_seed(job_uuid, original_file_name, stored_file_path, file_size, file_hash) AS (
    VALUES
        ('10000000-0000-0000-0000-000000000001'::uuid, 'engineering-lab-brief.pdf', 'storage/uploads/mock/engineering-lab-brief.pdf', 248120, 'mock-hash-001'),
        ('10000000-0000-0000-0000-000000000002'::uuid, 'marketing-campaign-report.pdf', 'storage/uploads/mock/marketing-campaign-report.pdf', 410944, 'mock-hash-002'),
        ('10000000-0000-0000-0000-000000000003'::uuid, 'sales-review-pack.pdf', 'storage/uploads/mock/sales-review-pack.pdf', 192804, 'mock-hash-003'),
        ('10000000-0000-0000-0000-000000000004'::uuid, 'hr-onboarding-checklist.pdf', 'storage/uploads/mock/hr-onboarding-checklist.pdf', 98048, 'mock-hash-004'),
        ('10000000-0000-0000-0000-000000000005'::uuid, 'finance-budget-summary.pdf', 'storage/uploads/mock/finance-budget-summary.pdf', 318640, 'mock-hash-005')
)
INSERT INTO job_files (
    print_job_id,
    file_role,
    original_file_name,
    stored_file_path,
    mime_type,
    file_size,
    file_hash
)
SELECT
    print_jobs.id,
    'original',
    file_seed.original_file_name,
    file_seed.stored_file_path,
    'application/pdf',
    file_seed.file_size,
    file_seed.file_hash
FROM file_seed
JOIN print_jobs ON print_jobs.job_uuid = file_seed.job_uuid
ON CONFLICT (print_job_id, file_role, stored_file_path) DO UPDATE SET
    original_file_name = EXCLUDED.original_file_name,
    mime_type = EXCLUDED.mime_type,
    file_size = EXCLUDED.file_size,
    file_hash = EXCLUDED.file_hash;

WITH event_seed(job_uuid, actor_username, event_type, event_source, message, metadata, created_at) AS (
    VALUES
        ('10000000-0000-0000-0000-000000000001'::uuid, 'john.doe', 'submitted', 'web_upload', 'John Doe submitted engineering-lab-brief.pdf.', '{"pages":25,"status":"held"}'::jsonb, TIMESTAMPTZ '2026-04-06 09:42:00+03'),
        ('10000000-0000-0000-0000-000000000001'::uuid, 'john.doe', 'completed', 'printer', 'Printer A1 completed the job successfully.', '{"printer":"Printer A1","cost":1.25}'::jsonb, TIMESTAMPTZ '2026-04-06 09:45:00+03'),
        ('10000000-0000-0000-0000-000000000002'::uuid, 'jane.smith', 'submitted', 'web_upload', 'Jane Smith submitted marketing-campaign-report.pdf.', '{"pages":50,"status":"held"}'::jsonb, TIMESTAMPTZ '2026-04-06 09:29:00+03'),
        ('10000000-0000-0000-0000-000000000002'::uuid, 'jane.smith', 'completed', 'printer', 'Printer B2 completed the job successfully.', '{"printer":"Printer B2","cost":2.50}'::jsonb, TIMESTAMPTZ '2026-04-06 09:32:00+03'),
        ('10000000-0000-0000-0000-000000000003'::uuid, 'bob.wilson', 'submitted', 'web_upload', 'Bob Wilson submitted sales-review-pack.pdf.', '{"pages":12,"status":"held"}'::jsonb, TIMESTAMPTZ '2026-04-06 09:12:00+03'),
        ('10000000-0000-0000-0000-000000000003'::uuid, 'tech.user', 'failed', 'printer', 'Printer C3 failed during release because of a paper feed error.', '{"printer":"Printer C3","errorCode":"C3-FEED-01"}'::jsonb, TIMESTAMPTZ '2026-04-06 09:15:00+03'),
        ('10000000-0000-0000-0000-000000000004'::uuid, 'alice.brown', 'submitted', 'web_upload', 'Alice Brown submitted hr-onboarding-checklist.pdf.', '{"pages":8,"status":"held"}'::jsonb, TIMESTAMPTZ '2026-04-06 08:47:00+03'),
        ('10000000-0000-0000-0000-000000000004'::uuid, 'alice.brown', 'completed', 'printer', 'Printer A1 completed the job successfully.', '{"printer":"Printer A1","cost":0.40}'::jsonb, TIMESTAMPTZ '2026-04-06 08:50:00+03'),
        ('10000000-0000-0000-0000-000000000005'::uuid, 'charlie.davis', 'submitted', 'web_upload', 'Charlie Davis submitted finance-budget-summary.pdf.', '{"pages":35,"status":"held"}'::jsonb, TIMESTAMPTZ '2026-04-06 08:27:00+03'),
        ('10000000-0000-0000-0000-000000000005'::uuid, 'charlie.davis', 'held', 'queue', 'Finance D1 Print Queue is holding the job for secure release.', '{"queue":"Finance D1 Print Queue","cost":1.75}'::jsonb, TIMESTAMPTZ '2026-04-06 08:30:00+03')
)
INSERT INTO print_job_events (
    print_job_id,
    actor_user_id,
    event_type,
    event_source,
    message,
    metadata,
    created_at
)
SELECT
    print_jobs.id,
    users.id,
    event_seed.event_type,
    event_seed.event_source,
    event_seed.message,
    event_seed.metadata,
    event_seed.created_at
FROM event_seed
JOIN print_jobs ON print_jobs.job_uuid = event_seed.job_uuid
LEFT JOIN users ON users.username = event_seed.actor_username
WHERE NOT EXISTS (
    SELECT 1
    FROM print_job_events existing
    WHERE existing.print_job_id = print_jobs.id
    AND existing.event_type = event_seed.event_type
    AND existing.created_at = event_seed.created_at
);

WITH error_seed(printer_name, queue_name, error_code, severity, status, title, description, detected_at, resolved_at, resolved_by_username) AS (
    VALUES
        ('Printer C3', 'Sales C3 Print Queue', 'C3-FEED-01', 'high', 'open', 'Printer C3 paper feed failure', 'A mock failed print job could not complete because Printer C3 reported a paper feed error.', TIMESTAMPTZ '2026-04-06 09:15:00+03', NULL::timestamptz, NULL),
        ('Printer D1', 'Finance D1 Print Queue', 'D1-SECURE-HOLD', 'medium', 'acknowledged', 'Finance queue job held for release', 'A mock finance job is waiting for secure release at Printer D1.', TIMESTAMPTZ '2026-04-06 08:30:00+03', NULL::timestamptz, 'tech.user')
)
INSERT INTO device_errors (
    printer_id,
    queue_id,
    error_code,
    severity,
    status,
    title,
    description,
    detected_at,
    resolved_at,
    resolved_by
)
SELECT
    printers.id,
    print_queues.id,
    error_seed.error_code,
    error_seed.severity,
    error_seed.status,
    error_seed.title,
    error_seed.description,
    error_seed.detected_at,
    error_seed.resolved_at,
    resolver.id
FROM error_seed
JOIN printers ON printers.name = error_seed.printer_name
JOIN print_queues ON print_queues.name = error_seed.queue_name
LEFT JOIN users resolver ON resolver.username = error_seed.resolved_by_username
WHERE NOT EXISTS (
    SELECT 1
    FROM device_errors existing
    WHERE existing.title = error_seed.title
    AND existing.detected_at = error_seed.detected_at
);

WITH notification_seed(target_username, target_role, error_title, notification_type, title, body, status, delivery_status, created_at, read_at) AS (
    VALUES
        ('tech.user', 'technician', 'Printer C3 paper feed failure', 'device_error', 'Printer C3 needs attention', 'Printer C3 failed Bob Wilson''s print job during release.', 'unread', 'delivered', TIMESTAMPTZ '2026-04-06 09:16:00+03', NULL::timestamptz),
        ('admin.user', 'admin', 'Finance queue job held for release', 'queue_hold', 'Finance print job held', 'Charlie Davis has a finance job waiting for secure release on Printer D1.', 'read', 'delivered', TIMESTAMPTZ '2026-04-06 08:31:00+03', TIMESTAMPTZ '2026-04-06 08:40:00+03'),
        ('bob.wilson', NULL, 'Printer C3 paper feed failure', 'job_failed', 'Your print job failed', 'sales-review-pack.pdf could not be released because Printer C3 reported a device error.', 'unread', 'delivered', TIMESTAMPTZ '2026-04-06 09:16:00+03', NULL::timestamptz)
)
INSERT INTO notifications (
    target_user_id,
    target_role,
    device_error_id,
    notification_type,
    title,
    body,
    status,
    delivery_status,
    created_at,
    read_at
)
SELECT
    target_user.id,
    notification_seed.target_role,
    device_errors.id,
    notification_seed.notification_type,
    notification_seed.title,
    notification_seed.body,
    notification_seed.status,
    notification_seed.delivery_status,
    notification_seed.created_at,
    notification_seed.read_at
FROM notification_seed
LEFT JOIN users target_user ON target_user.username = notification_seed.target_username
LEFT JOIN device_errors ON device_errors.title = notification_seed.error_title
WHERE NOT EXISTS (
    SELECT 1
    FROM notifications existing
    WHERE existing.title = notification_seed.title
    AND existing.created_at = notification_seed.created_at
);

WITH auth_log_seed(username_attempted, source_ip, result, failure_reason, created_at) AS (
    VALUES
        ('john.doe', '10.20.1.41'::inet, 'success', NULL, TIMESTAMPTZ '2026-04-06 09:38:00+03'),
        ('jane.smith', '10.20.1.42'::inet, 'success', NULL, TIMESTAMPTZ '2026-04-06 09:26:00+03'),
        ('bob.wilson', '10.20.1.43'::inet, 'success', NULL, TIMESTAMPTZ '2026-04-06 09:08:00+03'),
        ('alice.brown', '10.20.1.44'::inet, 'success', NULL, TIMESTAMPTZ '2026-04-06 08:44:00+03'),
        ('charlie.davis', '10.20.1.45'::inet, 'success', NULL, TIMESTAMPTZ '2026-04-06 08:24:00+03'),
        ('unknown.user', '10.20.1.99'::inet, 'failure', 'User not found in local directory mock data.', TIMESTAMPTZ '2026-04-06 08:10:00+03')
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

WITH audit_seed(actor_username, actor_role, action_category, action_type, target_type, target_id, reason, before_state, after_state, created_at) AS (
    VALUES
        ('admin.user', 'admin', 'seed_data', 'create_mock_users', 'users', 'mock-print-users', 'Seeded related dashboard mock users.', NULL::jsonb, '{"users":["john.doe","jane.smith","bob.wilson","alice.brown","charlie.davis"]}'::jsonb, TIMESTAMPTZ '2026-04-06 08:00:00+03'),
        ('admin.user', 'admin', 'seed_data', 'create_mock_printers', 'printers', 'mock-dashboard-printers', 'Seeded related dashboard mock printers.', NULL::jsonb, '{"printers":["Printer A1","Printer B2","Printer C3","Printer D1"]}'::jsonb, TIMESTAMPTZ '2026-04-06 08:01:00+03'),
        ('tech.user', 'technician', 'device', 'acknowledge_error', 'device_errors', 'Printer C3 paper feed failure', 'Technician reviewed the seeded Printer C3 failure.', '{"status":"open"}'::jsonb, '{"status":"open","reviewed":true}'::jsonb, TIMESTAMPTZ '2026-04-06 09:18:00+03')
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
    users.id,
    audit_seed.actor_role,
    audit_seed.action_category,
    audit_seed.action_type,
    audit_seed.target_type,
    audit_seed.target_id,
    audit_seed.reason,
    audit_seed.before_state,
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

INSERT INTO user_credentials (user_id, password_hash)
SELECT users.id, 'dev-seed-salt-001:c96f05da1dc69874f15968fcc81cca3dbd74a86d67fc40fb44969ce8362ad2703d2feb56a59e722b35b12c344d1db64e04418f6776fbb38da97f4de13bb33a63'
FROM users
WHERE users.username IN ('john.doe', 'jane.smith', 'bob.wilson', 'alice.brown', 'charlie.davis')
ON CONFLICT (user_id) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();

WITH log_seed(print_log_uuid, job_uuid, printed_at) AS (
    VALUES
        ('20000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, TIMESTAMPTZ '2026-04-06 09:45:00+03'),
        ('20000000-0000-0000-0000-000000000002'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, TIMESTAMPTZ '2026-04-06 09:32:00+03'),
        ('20000000-0000-0000-0000-000000000003'::uuid, '10000000-0000-0000-0000-000000000003'::uuid, TIMESTAMPTZ '2026-04-06 09:15:00+03'),
        ('20000000-0000-0000-0000-000000000004'::uuid, '10000000-0000-0000-0000-000000000004'::uuid, TIMESTAMPTZ '2026-04-06 08:50:00+03'),
        ('20000000-0000-0000-0000-000000000005'::uuid, '10000000-0000-0000-0000-000000000005'::uuid, TIMESTAMPTZ '2026-04-06 08:30:00+03')
)
INSERT INTO print_logs (
    print_log_uuid,
    print_job_id,
    user_id,
    user_name,
    printer_id,
    device_name,
    printed_at,
    pages,
    cost,
    status
)
SELECT
    log_seed.print_log_uuid,
    print_jobs.id,
    users.id,
    users.display_name,
    printers.id,
    printers.name,
    log_seed.printed_at,
    print_jobs.page_count,
    COALESCE(print_jobs.final_cost, print_jobs.estimated_cost),
    print_jobs.status
FROM log_seed
JOIN print_jobs ON print_jobs.job_uuid = log_seed.job_uuid
JOIN users ON users.id = print_jobs.user_id
JOIN printers ON printers.id = print_jobs.printer_id
ON CONFLICT (print_log_uuid) DO UPDATE SET
    print_job_id = EXCLUDED.print_job_id,
    user_id = EXCLUDED.user_id,
    user_name = EXCLUDED.user_name,
    printer_id = EXCLUDED.printer_id,
    device_name = EXCLUDED.device_name,
    printed_at = EXCLUDED.printed_at,
    pages = EXCLUDED.pages,
    cost = EXCLUDED.cost,
    status = EXCLUDED.status,
    updated_at = NOW();
