INSERT INTO roles (name) VALUES
    ('admin'),
    ('technician'),
    ('standard_user')
ON CONFLICT (name) DO NOTHING;

INSERT INTO departments (name, code) VALUES
    ('Information Systems', 'IS')
ON CONFLICT (name) DO UPDATE SET
    code = EXCLUDED.code;

WITH department AS (
    SELECT id FROM departments WHERE code = 'IS'
)
INSERT INTO users (username, email, display_name, university_id, department_id)
SELECT username, email, display_name, university_id, department.id
FROM department,
    (VALUES
        ('admin.user', 'admin@university.edu', 'Admin User', 'DEV-ADMIN-001'),
        ('tech.user', 'tech@university.edu', 'Technician User', 'DEV-TECH-001'),
        ('student.user', 'student@university.edu', 'Student User', 'DEV-STUDENT-001')
    ) AS seed(username, email, display_name, university_id)
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    university_id = EXCLUDED.university_id,
    department_id = EXCLUDED.department_id;

INSERT INTO user_roles (user_id, role_id)
SELECT users.id, roles.id
FROM users
JOIN roles ON (
    (users.username = 'admin.user' AND roles.name = 'admin')
    OR (users.username = 'tech.user' AND roles.name = 'technician')
    OR (users.username = 'tech.user' AND roles.name = 'standard_user')
    OR (users.username = 'student.user' AND roles.name = 'standard_user')
)
ON CONFLICT DO NOTHING;

INSERT INTO technician_privileges (
    user_id,
    can_manage_quotas,
    can_manage_user_access,
    can_view_logs,
    can_view_notifications,
    can_manage_queues,
    updated_by
)
SELECT technician.id, TRUE, TRUE, TRUE, TRUE, FALSE, admin.id
FROM users technician
CROSS JOIN users admin
WHERE technician.username = 'tech.user'
AND admin.username = 'admin.user'
ON CONFLICT (user_id) DO UPDATE SET
    can_manage_quotas = EXCLUDED.can_manage_quotas,
    can_manage_user_access = EXCLUDED.can_manage_user_access,
    can_view_logs = EXCLUDED.can_view_logs,
    can_view_notifications = EXCLUDED.can_view_notifications,
    can_manage_queues = EXCLUDED.can_manage_queues,
    updated_by = EXCLUDED.updated_by,
    updated_at = NOW();

INSERT INTO user_quotas (user_id, quota_period, allocated_pages, used_pages, reset_at, updated_by)
SELECT student.id, 'semester', 500, 0, NOW() + INTERVAL '120 days', admin.id
FROM users student
CROSS JOIN users admin
WHERE student.username = 'student.user'
AND admin.username = 'admin.user'
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
    oxp_enabled
) VALUES (
    'HP MFP M830 - 22/339',
    'HP-MFP-M830-22-339',
    'HP MFP M830',
    '10.22.114.241',
    'raw_socket',
    '10.22.114.241:9100',
    '{"endOfJobMarker":"0x04","language":"postscript","windowsQueueTarget":"HP-M830-22-339","windowsQueueShare":"\\\\PRINTSOL-STU1\\HP-M830-22-339","windowsDriver":"HP LaserJet flow MFP M830 PCL 6","windowsDriverType":"Type 3 - User Mode","windowsPrintProcessor":"HPCPP164","windowsDataFormat":"RAW"}'::jsonb,
    '22/339',
    'online',
    FALSE,
    TRUE,
    1.0000,
    2.0000,
    FALSE
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
    oxp_enabled = EXCLUDED.oxp_enabled;

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
    'Student Default Queue',
    'Default held queue for student web-upload jobs during the MVP.',
    'student',
    100,
    TRUE,
    'secure_release',
    'active',
    24,
    admin.id
FROM users admin
WHERE admin.username = 'admin.user'
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    queue_type = EXCLUDED.queue_type,
    priority_order = EXCLUDED.priority_order,
    is_default = EXCLUDED.is_default,
    release_mode = EXCLUDED.release_mode,
    status = EXCLUDED.status,
    retention_hours = EXCLUDED.retention_hours,
    created_by = EXCLUDED.created_by;

INSERT INTO queue_printers (queue_id, printer_id, is_primary, is_enabled, priority_order)
SELECT queue.id, printer.id, TRUE, TRUE, 100
FROM print_queues queue
JOIN printers printer ON printer.name = 'HP MFP M830 - 22/339'
WHERE queue.name = 'Student Default Queue'
ON CONFLICT (queue_id, printer_id) DO UPDATE SET
    is_primary = EXCLUDED.is_primary,
    is_enabled = EXCLUDED.is_enabled,
    priority_order = EXCLUDED.priority_order;

INSERT INTO queue_access_rules (queue_id, rule_type, rule_value)
SELECT queue.id, 'role', 'standard_user'
FROM print_queues queue
WHERE queue.name = 'Student Default Queue'
ON CONFLICT (queue_id, rule_type, rule_value) DO NOTHING;

INSERT INTO pricing_rules (
    name,
    queue_id,
    paper_type,
    color_mode,
    duplex_discount_percent,
    cost_per_page,
    is_active
)
SELECT 'Student B/W standard page', queue.id, 'standard', 'bw', 0.00, 1.0000, TRUE
FROM print_queues queue
WHERE queue.name = 'Student Default Queue'
ON CONFLICT (name) DO UPDATE SET
    queue_id = EXCLUDED.queue_id,
    paper_type = EXCLUDED.paper_type,
    color_mode = EXCLUDED.color_mode,
    duplex_discount_percent = EXCLUDED.duplex_discount_percent,
    cost_per_page = EXCLUDED.cost_per_page,
    is_active = EXCLUDED.is_active;
