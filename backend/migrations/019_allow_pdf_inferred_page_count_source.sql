ALTER TABLE print_jobs
DROP CONSTRAINT IF EXISTS print_jobs_page_count_source_check;

ALTER TABLE print_jobs
ADD CONSTRAINT print_jobs_page_count_source_check
CHECK (page_count_source IN ('user_estimate', 'server_detected', 'pdf_inferred', 'admin_override'));
