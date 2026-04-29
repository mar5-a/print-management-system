-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Users
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Print Jobs
CREATE INDEX idx_print_jobs_user_id ON print_jobs(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_print_jobs_queue_id ON print_jobs(queue_id);
CREATE INDEX idx_print_jobs_printer_id ON print_jobs(printer_id);
CREATE INDEX idx_print_jobs_status ON print_jobs(status);
CREATE INDEX idx_print_jobs_submitted_at ON print_jobs(submitted_at);
CREATE INDEX idx_print_jobs_created_at ON print_jobs(created_at);
CREATE INDEX idx_print_jobs_expires_at ON print_jobs(expires_at) WHERE status IN ('held', 'released');

-- Print Job Events
CREATE INDEX idx_print_job_events_job_id ON print_job_events(job_id);
CREATE INDEX idx_print_job_events_created_at ON print_job_events(created_at);

-- Device Errors
CREATE INDEX idx_device_errors_printer_id ON device_errors(printer_id);
CREATE INDEX idx_device_errors_status ON device_errors(status);
CREATE INDEX idx_device_errors_severity ON device_errors(severity);
CREATE INDEX idx_device_errors_detected_at ON device_errors(detected_at);

-- Notifications
CREATE INDEX idx_notifications_target_user_id ON notifications(target_user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Audit Logs
CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_target_type ON audit_logs(target_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Quotas
CREATE INDEX idx_user_quotas_user_id ON user_quotas(user_id);
CREATE INDEX idx_user_quotas_reset_at ON user_quotas(reset_at);

-- Printers
CREATE INDEX idx_printers_status ON printers(status);
CREATE INDEX idx_printers_deleted_at ON printers(deleted_at);

-- Queues
CREATE INDEX idx_print_queues_status ON print_queues(status);
CREATE INDEX idx_print_queues_deleted_at ON print_queues(deleted_at);

-- Authentication logs
CREATE INDEX idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX idx_auth_logs_source_ip ON auth_logs(source_ip);
CREATE INDEX idx_auth_logs_created_at ON auth_logs(created_at);
CREATE INDEX idx_auth_logs_result ON auth_logs(result);

-- Technician privileges
CREATE INDEX idx_technician_privileges_technician_id ON technician_privileges(technician_id);

-- Queue access rules
CREATE INDEX idx_queue_access_rules_queue_id ON queue_access_rules(queue_id);
CREATE INDEX idx_queue_access_rules_rule_type ON queue_access_rules(rule_type);
