import { query } from '../db/client.js'

export async function getAdminDashboard() {
  const [users, printers, queues, jobs, quota] = await Promise.all([
    query(`SELECT COUNT(*) AS total,
                  COUNT(*) FILTER (WHERE is_suspended = false AND is_active = true) AS active,
                  COUNT(*) FILTER (WHERE is_suspended = true) AS suspended
           FROM users WHERE deleted_at IS NULL`),

    query(`SELECT COUNT(*) AS total,
                  COUNT(*) FILTER (WHERE status = 'online') AS online,
                  COUNT(*) FILTER (WHERE status = 'offline') AS offline,
                  COUNT(*) FILTER (WHERE status = 'maintenance') AS maintenance,
                  COUNT(*) FILTER (WHERE status = 'error') AS error
           FROM printers WHERE deleted_at IS NULL`),

    query(`SELECT COUNT(*) AS total,
                  COUNT(*) FILTER (WHERE status = 'online' AND enabled = true) AS active,
                  COUNT(*) FILTER (WHERE enabled = false) AS disabled,
                  COUNT(*) FILTER (WHERE release_mode = 'secure_release') AS secure_release
           FROM print_queues WHERE deleted_at IS NULL`),

    query(`SELECT COUNT(*) AS total,
                  COUNT(*) FILTER (WHERE status IN ('held','submitted')) AS pending,
                  COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= NOW() - INTERVAL '24 hours') AS completed_today,
                  COUNT(*) FILTER (WHERE status = 'failed') AS failed
           FROM print_jobs WHERE deleted_at IS NULL`),

    query(`SELECT SUM(used_pages) AS total_used, SUM(allocated_pages) AS total_allocated
           FROM user_quotas`),
  ])

  const recentJobs = await query(
    `SELECT pj.id, u.username, pq.name AS queue_name, p.name AS printer_name,
            pj.total_pages, pj.status, pj.submitted_at
     FROM print_jobs pj
     JOIN users u ON u.id = pj.user_id
     JOIN print_queues pq ON pq.id = pj.queue_id
     LEFT JOIN printers p ON p.id = pj.printer_id
     WHERE pj.deleted_at IS NULL
     ORDER BY pj.submitted_at DESC LIMIT 10`
  )

  return {
    users: users.rows[0],
    printers: printers.rows[0],
    queues: queues.rows[0],
    jobs: jobs.rows[0],
    quota: quota.rows[0],
    recentJobs: recentJobs.rows,
  }
}

export async function getTechDashboard() {
  const [alerts, printers, pendingJobs] = await Promise.all([
    query(`SELECT COUNT(*) AS total,
                  COUNT(*) FILTER (WHERE severity = 'critical' AND resolved_at IS NULL) AS critical,
                  COUNT(*) FILTER (WHERE resolved_at IS NULL) AS open
           FROM device_errors WHERE deleted_at IS NULL`),

    query(`SELECT COUNT(*) AS total,
                  COUNT(*) FILTER (WHERE status = 'online') AS online,
                  COUNT(*) FILTER (WHERE status != 'online') AS needs_attention
           FROM printers WHERE deleted_at IS NULL`),

    query(`SELECT COUNT(*) AS total
           FROM print_jobs WHERE status IN ('held','submitted') AND deleted_at IS NULL`),
  ])

  const activeAlerts = await query(
    `SELECT de.*, p.name AS printer_name, p.location
     FROM device_errors de
     JOIN printers p ON p.id = de.printer_id
     WHERE de.resolved_at IS NULL AND de.deleted_at IS NULL
     ORDER BY de.detected_at DESC LIMIT 10`
  )

  return {
    alerts: alerts.rows[0],
    printers: printers.rows[0],
    pendingJobs: pendingJobs.rows[0],
    activeAlerts: activeAlerts.rows,
  }
}

export async function getPortalDashboard(userId: string) {
  const [quota, recentJobs] = await Promise.all([
    query(
      `SELECT uq.*, u.display_name, d.name AS department_name
       FROM user_quotas uq
       JOIN users u ON u.id = uq.user_id
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE uq.user_id = $1`,
      [userId]
    ),
    query(
      `SELECT pj.id, pj.file_name, pj.status, pj.total_pages, pj.submitted_at,
              pq.name AS queue_name, p.name AS printer_name
       FROM print_jobs pj
       JOIN print_queues pq ON pq.id = pj.queue_id
       LEFT JOIN printers p ON p.id = pj.printer_id
       WHERE pj.user_id = $1 AND pj.deleted_at IS NULL
       ORDER BY pj.submitted_at DESC LIMIT 5`,
      [userId]
    ),
  ])

  return { quota: quota.rows[0] ?? null, recentJobs: recentJobs.rows }
}
