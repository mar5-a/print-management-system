import { query } from '../db/pool.js'

export async function getDashboardSnapshot() {
  const [users, printers, jobs, alerts, recentJobs] = await Promise.all([
    query<{ active_users: string; suspended_users: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE is_active = TRUE AND is_suspended = FALSE)::text AS active_users,
         COUNT(*) FILTER (WHERE is_suspended = TRUE)::text AS suspended_users
       FROM users`,
    ),
    query<{ total_printers: string; online_printers: string; problem_printers: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE status <> 'archived')::text AS total_printers,
         COUNT(*) FILTER (WHERE status = 'online')::text AS online_printers,
         COUNT(*) FILTER (WHERE status NOT IN ('online', 'archived'))::text AS problem_printers
       FROM printers`,
    ),
    query<{ held_jobs: string; sent_today: string; pages_today: string; total_pages: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'held')::text AS held_jobs,
         COUNT(*) FILTER (WHERE status IN ('sent_to_printer', 'queued') AND released_at::date = CURRENT_DATE)::text AS sent_today,
         COALESCE(SUM(page_count * copy_count) FILTER (WHERE released_at::date = CURRENT_DATE), 0)::text AS pages_today,
         COALESCE(SUM(page_count * copy_count) FILTER (WHERE status IN ('sent_to_printer', 'queued', 'completed')), 0)::text AS total_pages
       FROM print_jobs`,
    ),
    query<{ open_alerts: string }>(
      `SELECT COUNT(*)::text AS open_alerts FROM device_errors WHERE status <> 'resolved'`,
    ),
    query(
      `SELECT
         pj.job_uuid,
         u.username,
         COALESCE(p.name, q.name) AS device,
         (pj.page_count * pj.copy_count) AS pages,
         pj.status,
         pj.submitted_at
       FROM print_jobs pj
       JOIN users u ON u.id = pj.user_id
       JOIN print_queues q ON q.id = pj.queue_id
       LEFT JOIN printers p ON p.id = pj.printer_id
       ORDER BY pj.submitted_at DESC
       LIMIT 10`,
    ),
  ])

  return {
    active_users: Number(users.rows[0]?.active_users ?? 0),
    suspended_users: Number(users.rows[0]?.suspended_users ?? 0),
    total_printers: Number(printers.rows[0]?.total_printers ?? 0),
    online_printers: Number(printers.rows[0]?.online_printers ?? 0),
    problem_printers: Number(printers.rows[0]?.problem_printers ?? 0),
    held_jobs: Number(jobs.rows[0]?.held_jobs ?? 0),
    sent_today: Number(jobs.rows[0]?.sent_today ?? 0),
    pages_today: Number(jobs.rows[0]?.pages_today ?? 0),
    total_pages: Number(jobs.rows[0]?.total_pages ?? 0),
    open_alerts: Number(alerts.rows[0]?.open_alerts ?? 0),
    recent_jobs: recentJobs.rows.map((row) => ({
      id: String(row.job_uuid),
      user: String(row.username),
      device: String(row.device),
      pages: Number(row.pages),
      status: String(row.status),
      submitted_at: row.submitted_at,
    })),
  }
}
