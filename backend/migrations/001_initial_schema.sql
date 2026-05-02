CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    department_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    name VARCHAR(120) NOT NULL UNIQUE,
    code VARCHAR(40) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    user_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    ad_object_id VARCHAR(128) UNIQUE,
    university_id VARCHAR(64) UNIQUE,
    username VARCHAR(120) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    department_id BIGINT REFERENCES departments(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE CHECK (name IN ('admin', 'technician', 'standard_user')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE technician_privileges (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    can_manage_quotas BOOLEAN NOT NULL DEFAULT TRUE,
    can_manage_user_access BOOLEAN NOT NULL DEFAULT TRUE,
    can_view_logs BOOLEAN NOT NULL DEFAULT TRUE,
    can_view_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    can_manage_queues BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by BIGINT REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_quotas (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quota_period VARCHAR(32) NOT NULL DEFAULT 'semester',
    allocated_pages INTEGER NOT NULL CHECK (allocated_pages >= 0),
    used_pages INTEGER NOT NULL DEFAULT 0 CHECK (used_pages >= 0),
    reset_at TIMESTAMPTZ,
    updated_by BIGINT REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, quota_period)
);

CREATE TABLE printers (
    id BIGSERIAL PRIMARY KEY,
    printer_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    name VARCHAR(150) NOT NULL UNIQUE,
    device_code VARCHAR(80) UNIQUE,
    model VARCHAR(150),
    ip_address INET,
    connector_type VARCHAR(32) NOT NULL DEFAULT 'raw_socket' CHECK (
        connector_type IN ('raw_socket', 'windows_queue', 'ipp', 'hp_oxp', 'manual')
    ),
    connector_target VARCHAR(255),
    connector_options JSONB NOT NULL DEFAULT '{}'::jsonb,
    location VARCHAR(255),
    status VARCHAR(32) NOT NULL DEFAULT 'online' CHECK (
        status IN ('online', 'offline', 'maintenance', 'disabled', 'archived')
    ),
    is_color BOOLEAN NOT NULL DEFAULT FALSE,
    supports_duplex BOOLEAN NOT NULL DEFAULT TRUE,
    service_account_username VARCHAR(255),
    credential_ref VARCHAR(255),
    cost_per_bw_page NUMERIC(10,4) NOT NULL DEFAULT 0.0000 CHECK (cost_per_bw_page >= 0),
    cost_per_color_page NUMERIC(10,4) NOT NULL DEFAULT 0.0000 CHECK (cost_per_color_page >= 0),
    oxp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    last_heartbeat_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE print_queues (
    id BIGSERIAL PRIMARY KEY,
    queue_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    queue_type VARCHAR(32) NOT NULL DEFAULT 'standard' CHECK (
        queue_type IN ('standard', 'student', 'staff', 'faculty', 'mixed', 'other')
    ),
    priority_order INTEGER NOT NULL DEFAULT 100,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    release_mode VARCHAR(32) NOT NULL DEFAULT 'secure_release' CHECK (
        release_mode IN ('secure_release', 'immediate')
    ),
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'disabled', 'archived')
    ),
    retention_hours INTEGER NOT NULL DEFAULT 24 CHECK (retention_hours > 0),
    max_jobs INTEGER CHECK (max_jobs IS NULL OR max_jobs >= 0),
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE queue_printers (
    queue_id BIGINT NOT NULL REFERENCES print_queues(id) ON DELETE CASCADE,
    printer_id BIGINT NOT NULL REFERENCES printers(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    priority_order INTEGER NOT NULL DEFAULT 100,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (queue_id, printer_id),
    UNIQUE (printer_id)
);

CREATE UNIQUE INDEX idx_queue_printers_one_primary_per_queue
    ON queue_printers(queue_id)
    WHERE is_primary = TRUE;

CREATE TABLE queue_access_rules (
    id BIGSERIAL PRIMARY KEY,
    queue_id BIGINT NOT NULL REFERENCES print_queues(id) ON DELETE CASCADE,
    rule_type VARCHAR(32) NOT NULL CHECK (
        rule_type IN ('role', 'department', 'ad_group', 'user')
    ),
    rule_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (queue_id, rule_type, rule_value)
);

CREATE TABLE pricing_rules (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    queue_id BIGINT REFERENCES print_queues(id) ON DELETE CASCADE,
    printer_id BIGINT REFERENCES printers(id) ON DELETE CASCADE,
    paper_type VARCHAR(64),
    color_mode VARCHAR(16) CHECK (color_mode IN ('bw', 'color')),
    duplex_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (
        duplex_discount_percent >= 0 AND duplex_discount_percent <= 100
    ),
    cost_per_page NUMERIC(10,4) NOT NULL CHECK (cost_per_page >= 0),
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE print_jobs (
    id BIGSERIAL PRIMARY KEY,
    job_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    queue_id BIGINT NOT NULL REFERENCES print_queues(id),
    printer_id BIGINT REFERENCES printers(id),
    source_channel VARCHAR(32) NOT NULL DEFAULT 'web_upload' CHECK (
        source_channel IN ('web_upload', 'os_print', 'admin_test', 'api')
    ),
    release_channel VARCHAR(32) CHECK (
        release_channel IN ('web', 'kiosk', 'printer_panel', 'card', 'admin')
    ),
    page_count INTEGER NOT NULL CHECK (page_count > 0),
    page_count_source VARCHAR(32) NOT NULL DEFAULT 'user_estimate' CHECK (
        page_count_source IN ('user_estimate', 'server_detected', 'admin_override')
    ),
    copy_count INTEGER NOT NULL DEFAULT 1 CHECK (copy_count > 0),
    color_mode VARCHAR(16) NOT NULL DEFAULT 'bw' CHECK (
        color_mode IN ('bw', 'color')
    ),
    duplex BOOLEAN NOT NULL DEFAULT FALSE,
    paper_type VARCHAR(64) NOT NULL DEFAULT 'standard',
    estimated_cost NUMERIC(10,4) NOT NULL DEFAULT 0.0000 CHECK (estimated_cost >= 0),
    final_cost NUMERIC(10,4) CHECK (final_cost IS NULL OR final_cost >= 0),
    status VARCHAR(32) NOT NULL DEFAULT 'held' CHECK (
        status IN (
            'held',
            'sent_to_printer',
            'failed',
            'cancelled',
            'expired',
            'queued',
            'printing',
            'completed',
            'blocked'
        )
    ),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE job_files (
    id BIGSERIAL PRIMARY KEY,
    print_job_id BIGINT NOT NULL REFERENCES print_jobs(id) ON DELETE CASCADE,
    file_role VARCHAR(32) NOT NULL CHECK (file_role IN ('original', 'converted', 'spool')),
    original_file_name VARCHAR(255),
    stored_file_path TEXT NOT NULL,
    mime_type VARCHAR(120),
    file_size BIGINT CHECK (file_size IS NULL OR file_size >= 0),
    file_hash VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (print_job_id, file_role, stored_file_path)
);

CREATE TABLE print_job_events (
    id BIGSERIAL PRIMARY KEY,
    print_job_id BIGINT NOT NULL REFERENCES print_jobs(id) ON DELETE CASCADE,
    actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(64) NOT NULL,
    event_source VARCHAR(64) NOT NULL,
    message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE device_errors (
    id BIGSERIAL PRIMARY KEY,
    printer_id BIGINT REFERENCES printers(id) ON DELETE SET NULL,
    queue_id BIGINT REFERENCES print_queues(id) ON DELETE SET NULL,
    error_code VARCHAR(64),
    severity VARCHAR(16) NOT NULL CHECK (
        severity IN ('low', 'medium', 'high', 'critical')
    ),
    status VARCHAR(16) NOT NULL DEFAULT 'open' CHECK (
        status IN ('open', 'acknowledged', 'resolved')
    ),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by BIGINT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    target_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    target_role VARCHAR(64),
    device_error_id BIGINT REFERENCES device_errors(id) ON DELETE SET NULL,
    notification_type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    status VARCHAR(16) NOT NULL DEFAULT 'unread' CHECK (
        status IN ('unread', 'read', 'archived')
    ),
    delivery_status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (
        delivery_status IN ('pending', 'delivered', 'failed')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE TABLE auth_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    username_attempted VARCHAR(120) NOT NULL,
    source_ip INET,
    result VARCHAR(16) NOT NULL CHECK (
        result IN ('success', 'failure')
    ),
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    actor_role VARCHAR(64),
    action_category VARCHAR(64) NOT NULL,
    action_type VARCHAR(128) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(128),
    reason TEXT,
    before_state JSONB,
    after_state JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_quotas_user_id ON user_quotas(user_id);
CREATE INDEX idx_printers_status ON printers(status);
CREATE INDEX idx_print_queues_status ON print_queues(status);
CREATE INDEX idx_queue_access_rules_queue_id ON queue_access_rules(queue_id);
CREATE INDEX idx_queue_access_rules_lookup ON queue_access_rules(rule_type, rule_value);
CREATE INDEX idx_pricing_rules_queue_id ON pricing_rules(queue_id);
CREATE INDEX idx_print_jobs_user_id ON print_jobs(user_id);
CREATE INDEX idx_print_jobs_queue_id ON print_jobs(queue_id);
CREATE INDEX idx_print_jobs_printer_id ON print_jobs(printer_id);
CREATE INDEX idx_print_jobs_status ON print_jobs(status);
CREATE INDEX idx_print_jobs_user_status ON print_jobs(user_id, status);
CREATE INDEX idx_print_jobs_expires_at ON print_jobs(expires_at);
CREATE INDEX idx_print_jobs_submitted_at ON print_jobs(submitted_at);
CREATE INDEX idx_job_files_job_id ON job_files(print_job_id);
CREATE INDEX idx_job_files_deleted_at ON job_files(deleted_at);
CREATE INDEX idx_print_job_events_job_id ON print_job_events(print_job_id);
CREATE INDEX idx_print_job_events_created_at ON print_job_events(created_at);
CREATE INDEX idx_device_errors_printer_id ON device_errors(printer_id);
CREATE INDEX idx_device_errors_queue_id ON device_errors(queue_id);
CREATE INDEX idx_device_errors_status ON device_errors(status);
CREATE INDEX idx_notifications_target_user_id ON notifications(target_user_id);
CREATE INDEX idx_notifications_target_role ON notifications(target_role);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX idx_auth_logs_created_at ON auth_logs(created_at);
CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_printers_updated_at
    BEFORE UPDATE ON printers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_print_queues_updated_at
    BEFORE UPDATE ON print_queues
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_print_jobs_updated_at
    BEFORE UPDATE ON print_jobs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
