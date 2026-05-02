WITH activity_seed(
    sequence_number,
    activity_date,
    username,
    queue_name,
    printer_name,
    pages,
    status
) AS (
    VALUES
        (1, DATE '2026-04-03', 'john.doe', 'Shared A1 Print Queue', 'Printer A1', 18, 'completed'),
        (2, DATE '2026-04-04', 'jane.smith', 'Marketing B2 Print Queue', 'Printer B2', 32, 'completed'),
        (3, DATE '2026-04-05', 'bob.wilson', 'Sales C3 Print Queue', 'Printer C3', 14, 'failed'),
        (4, DATE '2026-04-06', 'alice.brown', 'Shared A1 Print Queue', 'Printer A1', 45, 'completed'),
        (5, DATE '2026-04-07', 'charlie.davis', 'Finance D1 Print Queue', 'Printer D1', 27, 'held'),
        (6, DATE '2026-04-08', 'john.doe', 'Shared A1 Print Queue', 'Printer A1', 62, 'completed'),
        (7, DATE '2026-04-09', 'jane.smith', 'Marketing B2 Print Queue', 'Printer B2', 51, 'completed'),
        (8, DATE '2026-04-10', 'bob.wilson', 'Sales C3 Print Queue', 'Printer C3', 23, 'failed'),
        (9, DATE '2026-04-11', 'alice.brown', 'Shared A1 Print Queue', 'Printer A1', 74, 'completed'),
        (10, DATE '2026-04-12', 'charlie.davis', 'Finance D1 Print Queue', 'Printer D1', 36, 'completed'),
        (11, DATE '2026-04-13', 'john.doe', 'Shared A1 Print Queue', 'Printer A1', 95, 'completed'),
        (12, DATE '2026-04-14', 'jane.smith', 'Marketing B2 Print Queue', 'Printer B2', 44, 'completed'),
        (13, DATE '2026-04-15', 'bob.wilson', 'Sales C3 Print Queue', 'Printer C3', 17, 'held'),
        (14, DATE '2026-04-16', 'alice.brown', 'Shared A1 Print Queue', 'Printer A1', 58, 'completed'),
        (15, DATE '2026-04-17', 'charlie.davis', 'Finance D1 Print Queue', 'Printer D1', 83, 'completed'),
        (16, DATE '2026-04-18', 'john.doe', 'Shared A1 Print Queue', 'Printer A1', 41, 'completed'),
        (17, DATE '2026-04-19', 'jane.smith', 'Marketing B2 Print Queue', 'Printer B2', 25, 'failed'),
        (18, DATE '2026-04-20', 'bob.wilson', 'Sales C3 Print Queue', 'Printer C3', 69, 'completed'),
        (19, DATE '2026-04-21', 'alice.brown', 'Shared A1 Print Queue', 'Printer A1', 33, 'completed'),
        (20, DATE '2026-04-22', 'charlie.davis', 'Finance D1 Print Queue', 'Printer D1', 90, 'completed'),
        (21, DATE '2026-04-23', 'john.doe', 'Shared A1 Print Queue', 'Printer A1', 55, 'completed'),
        (22, DATE '2026-04-24', 'jane.smith', 'Marketing B2 Print Queue', 'Printer B2', 38, 'held'),
        (23, DATE '2026-04-25', 'bob.wilson', 'Sales C3 Print Queue', 'Printer C3', 29, 'failed'),
        (24, DATE '2026-04-26', 'alice.brown', 'Shared A1 Print Queue', 'Printer A1', 35, 'completed'),
        (25, DATE '2026-04-27', 'charlie.davis', 'Finance D1 Print Queue', 'Printer D1', 42, 'completed'),
        (26, DATE '2026-04-28', 'john.doe', 'Shared A1 Print Queue', 'Printer A1', 28, 'completed'),
        (27, DATE '2026-04-29', 'jane.smith', 'Marketing B2 Print Queue', 'Printer B2', 67, 'completed'),
        (28, DATE '2026-04-30', 'bob.wilson', 'Sales C3 Print Queue', 'Printer C3', 52, 'completed'),
        (29, DATE '2026-05-01', 'alice.brown', 'Shared A1 Print Queue', 'Printer A1', 75, 'completed'),
        (30, DATE '2026-05-02', 'charlie.davis', 'Finance D1 Print Queue', 'Printer D1', 80, 'completed')
),
activity_rows AS (
    SELECT
        activity_seed.*,
        ('30000000-0000-0000-0000-' || LPAD(activity_seed.sequence_number::text, 12, '0'))::uuid AS job_uuid,
        ('40000000-0000-0000-0000-' || LPAD(activity_seed.sequence_number::text, 12, '0'))::uuid AS print_log_uuid,
        (activity_seed.activity_date + TIME '10:00' + (activity_seed.sequence_number % 8) * INTERVAL '17 minutes')::timestamptz AS printed_at,
        (activity_seed.pages * 0.0500)::numeric(10,4) AS cost
    FROM activity_seed
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
    activity_rows.job_uuid,
    users.id,
    print_queues.id,
    printers.id,
    'web_upload',
    CASE WHEN activity_rows.status = 'held' THEN NULL ELSE 'web' END,
    activity_rows.pages,
    'user_estimate',
    1,
    'bw',
    TRUE,
    'standard',
    activity_rows.cost,
    CASE WHEN activity_rows.status = 'held' THEN NULL ELSE activity_rows.cost END,
    activity_rows.status,
    activity_rows.printed_at - INTERVAL '5 minutes',
    CASE WHEN activity_rows.status = 'held' THEN NULL ELSE activity_rows.printed_at - INTERVAL '2 minutes' END,
    CASE WHEN activity_rows.status = 'completed' THEN activity_rows.printed_at ELSE NULL END,
    activity_rows.printed_at + INTERVAL '24 hours',
    CASE WHEN activity_rows.status = 'failed' THEN 'Mock device error for monthly activity seed.' ELSE NULL END
FROM activity_rows
JOIN users ON users.username = activity_rows.username
JOIN print_queues ON print_queues.name = activity_rows.queue_name
JOIN printers ON printers.name = activity_rows.printer_name
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

WITH activity_seed(
    sequence_number,
    activity_date,
    username,
    queue_name,
    printer_name,
    pages,
    status
) AS (
    VALUES
        (1, DATE '2026-04-03', 'john.doe', 'Shared A1 Print Queue', 'Printer A1', 18, 'completed'),
        (2, DATE '2026-04-04', 'jane.smith', 'Marketing B2 Print Queue', 'Printer B2', 32, 'completed'),
        (3, DATE '2026-04-05', 'bob.wilson', 'Sales C3 Print Queue', 'Printer C3', 14, 'failed'),
        (4, DATE '2026-04-06', 'alice.brown', 'Shared A1 Print Queue', 'Printer A1', 45, 'completed'),
        (5, DATE '2026-04-07', 'charlie.davis', 'Finance D1 Print Queue', 'Printer D1', 27, 'held'),
        (6, DATE '2026-04-08', 'john.doe', 'Shared A1 Print Queue', 'Printer A1', 62, 'completed'),
        (7, DATE '2026-04-09', 'jane.smith', 'Marketing B2 Print Queue', 'Printer B2', 51, 'completed'),
        (8, DATE '2026-04-10', 'bob.wilson', 'Sales C3 Print Queue', 'Printer C3', 23, 'failed'),
        (9, DATE '2026-04-11', 'alice.brown', 'Shared A1 Print Queue', 'Printer A1', 74, 'completed'),
        (10, DATE '2026-04-12', 'charlie.davis', 'Finance D1 Print Queue', 'Printer D1', 36, 'completed'),
        (11, DATE '2026-04-13', 'john.doe', 'Shared A1 Print Queue', 'Printer A1', 95, 'completed'),
        (12, DATE '2026-04-14', 'jane.smith', 'Marketing B2 Print Queue', 'Printer B2', 44, 'completed'),
        (13, DATE '2026-04-15', 'bob.wilson', 'Sales C3 Print Queue', 'Printer C3', 17, 'held'),
        (14, DATE '2026-04-16', 'alice.brown', 'Shared A1 Print Queue', 'Printer A1', 58, 'completed'),
        (15, DATE '2026-04-17', 'charlie.davis', 'Finance D1 Print Queue', 'Printer D1', 83, 'completed'),
        (16, DATE '2026-04-18', 'john.doe', 'Shared A1 Print Queue', 'Printer A1', 41, 'completed'),
        (17, DATE '2026-04-19', 'jane.smith', 'Marketing B2 Print Queue', 'Printer B2', 25, 'failed'),
        (18, DATE '2026-04-20', 'bob.wilson', 'Sales C3 Print Queue', 'Printer C3', 69, 'completed'),
        (19, DATE '2026-04-21', 'alice.brown', 'Shared A1 Print Queue', 'Printer A1', 33, 'completed'),
        (20, DATE '2026-04-22', 'charlie.davis', 'Finance D1 Print Queue', 'Printer D1', 90, 'completed'),
        (21, DATE '2026-04-23', 'john.doe', 'Shared A1 Print Queue', 'Printer A1', 55, 'completed'),
        (22, DATE '2026-04-24', 'jane.smith', 'Marketing B2 Print Queue', 'Printer B2', 38, 'held'),
        (23, DATE '2026-04-25', 'bob.wilson', 'Sales C3 Print Queue', 'Printer C3', 29, 'failed'),
        (24, DATE '2026-04-26', 'alice.brown', 'Shared A1 Print Queue', 'Printer A1', 35, 'completed'),
        (25, DATE '2026-04-27', 'charlie.davis', 'Finance D1 Print Queue', 'Printer D1', 42, 'completed'),
        (26, DATE '2026-04-28', 'john.doe', 'Shared A1 Print Queue', 'Printer A1', 28, 'completed'),
        (27, DATE '2026-04-29', 'jane.smith', 'Marketing B2 Print Queue', 'Printer B2', 67, 'completed'),
        (28, DATE '2026-04-30', 'bob.wilson', 'Sales C3 Print Queue', 'Printer C3', 52, 'completed'),
        (29, DATE '2026-05-01', 'alice.brown', 'Shared A1 Print Queue', 'Printer A1', 75, 'completed'),
        (30, DATE '2026-05-02', 'charlie.davis', 'Finance D1 Print Queue', 'Printer D1', 80, 'completed')
),
activity_rows AS (
    SELECT
        activity_seed.*,
        ('30000000-0000-0000-0000-' || LPAD(activity_seed.sequence_number::text, 12, '0'))::uuid AS job_uuid,
        ('40000000-0000-0000-0000-' || LPAD(activity_seed.sequence_number::text, 12, '0'))::uuid AS print_log_uuid,
        (activity_seed.activity_date + TIME '10:00' + (activity_seed.sequence_number % 8) * INTERVAL '17 minutes')::timestamptz AS printed_at,
        (activity_seed.pages * 0.0500)::numeric(10,4) AS cost
    FROM activity_seed
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
    activity_rows.print_log_uuid,
    print_jobs.id,
    users.id,
    users.display_name,
    printers.id,
    printers.name,
    activity_rows.printed_at,
    activity_rows.pages,
    activity_rows.cost,
    activity_rows.status
FROM activity_rows
JOIN print_jobs ON print_jobs.job_uuid = activity_rows.job_uuid
JOIN users ON users.username = activity_rows.username
JOIN printers ON printers.name = activity_rows.printer_name
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
