CREATE TABLE print_logs (
    id BIGSERIAL PRIMARY KEY,
    print_log_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    print_job_id BIGINT REFERENCES print_jobs(id) ON DELETE SET NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    printer_id BIGINT REFERENCES printers(id) ON DELETE SET NULL,
    device_name VARCHAR(150) NOT NULL,
    printed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pages INTEGER NOT NULL CHECK (pages > 0),
    cost NUMERIC(10,4) NOT NULL DEFAULT 0.0000 CHECK (cost >= 0),
    status VARCHAR(32) NOT NULL CHECK (
        status IN ('completed', 'failed', 'held', 'queued', 'printing', 'cancelled')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_print_logs_printed_at ON print_logs(printed_at);
CREATE INDEX idx_print_logs_user_id ON print_logs(user_id);
CREATE INDEX idx_print_logs_printer_id ON print_logs(printer_id);
CREATE INDEX idx_print_logs_status ON print_logs(status);

CREATE TRIGGER set_print_logs_updated_at
    BEFORE UPDATE ON print_logs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
