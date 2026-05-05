ALTER TABLE device_errors
ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS acknowledged_by BIGINT REFERENCES users(id) ON DELETE SET NULL;

UPDATE printers
SET status = 'offline', updated_at = NOW()
WHERE name = 'Printer D1'
AND status <> 'archived';

UPDATE printers
SET toner_level = 12, updated_at = NOW()
WHERE name = 'Printer B2'
AND status <> 'archived';

WITH alert_seed(printer_name, queue_name, error_code, severity, status, title, description, detected_at) AS (
    VALUES
        (
            'Printer D1',
            'Finance D1 Print Queue',
            'D1-OFFLINE',
            'critical',
            'open',
            'Printer D1 offline',
            'Printer D1 is offline. Held jobs are waiting for release once the device is restored.',
            TIMESTAMPTZ '2026-05-02 07:54:00+03'
        ),
        (
            'Printer B2',
            'Marketing B2 Print Queue',
            'B2-TONER-LOW',
            'medium',
            'open',
            'Low toner on Printer B2',
            'Printer B2 toner is below the operational threshold. Schedule a replacement cartridge.',
            TIMESTAMPTZ '2026-05-02 06:30:00+03'
        ),
        (
            NULL,
            NULL,
            'AD-SYNC-DELAY',
            'low',
            'open',
            'AD sync delay',
            'Directory sync completed slower than the normal operational threshold.',
            TIMESTAMPTZ '2026-05-02 09:12:00+03'
        )
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
    alert_seed.error_code,
    alert_seed.severity,
    alert_seed.status,
    alert_seed.title,
    alert_seed.description,
    alert_seed.detected_at
FROM alert_seed
LEFT JOIN printers ON printers.name = alert_seed.printer_name
LEFT JOIN print_queues ON print_queues.name = alert_seed.queue_name
WHERE NOT EXISTS (
    SELECT 1
    FROM device_errors existing
    WHERE existing.title = alert_seed.title
    AND existing.detected_at = alert_seed.detected_at
);
