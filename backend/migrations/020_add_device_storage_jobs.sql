ALTER TABLE printers
DROP CONSTRAINT IF EXISTS printers_connector_type_check;

ALTER TABLE printers
ADD CONSTRAINT printers_connector_type_check
CHECK (connector_type IN ('raw_socket', 'windows_queue', 'hp_pjl_stored_job', 'ipp', 'hp_oxp', 'manual'));

ALTER TABLE print_jobs
DROP CONSTRAINT IF EXISTS print_jobs_status_check;

ALTER TABLE print_jobs
ADD CONSTRAINT print_jobs_status_check
CHECK (
    status IN (
        'held',
        'submitting_to_device_storage',
        'stored_on_device',
        'sent_to_printer',
        'failed',
        'cancelled',
        'expired',
        'queued',
        'printing',
        'completed',
        'blocked'
    )
);

ALTER TABLE print_jobs
ADD COLUMN IF NOT EXISTS device_storage_username VARCHAR(120),
ADD COLUMN IF NOT EXISTS device_storage_job_name VARCHAR(120),
ADD COLUMN IF NOT EXISTS device_storage_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS device_storage_pin_secret TEXT,
ADD COLUMN IF NOT EXISTS device_storage_connector_job_id VARCHAR(255);

ALTER TABLE print_logs
DROP CONSTRAINT IF EXISTS print_logs_status_check;

ALTER TABLE print_logs
ADD CONSTRAINT print_logs_status_check
CHECK (status IN ('completed', 'failed', 'held', 'stored_on_device', 'queued', 'printing', 'cancelled'));

UPDATE printers
SET
    connector_type = 'hp_pjl_stored_job',
    connector_target = '10.22.114.241:9100',
    connector_options = COALESCE(connector_options, '{}'::jsonb) || jsonb_build_object(
        'storedJobMode', 'pin_to_print',
        'hpPjlHold', 'STORE',
        'hpPjlHoldType', 'PRIVATE'
    ),
    hosted_on = 'HP PJL stored job connector',
    notes = CONCAT_WS(
        E'\n',
        NULLIF(notes, ''),
        'MVP device-release path uses HP PJL stored/private jobs with PIN to print.'
    ),
    updated_at = NOW()
WHERE name = 'HP MFP M830 - 22/339';
