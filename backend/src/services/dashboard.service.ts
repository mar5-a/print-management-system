import { query } from '../db/pool.js'

export interface RecentPrintLog {
  id: string
  date: string
  user: string
  device: string
  pages: number
  cost: number
  status: string
}

interface ListRecentPrintLogsOptions {
  search?: string
  status?: string
  device?: string
  page?: number
  limit?: number
}

interface RecentPrintLogPage {
  rows: RecentPrintLog[]
  total: number
  page: number
  limit: number
  totalPages: number
  statusOptions: string[]
  deviceOptions: string[]
}

export type PrintActivityRange = 'week' | 'month'

interface PrintActivityPoint {
  date: string
  label: string
  pages: number
}

interface PrintActivitySnapshot {
  range: PrintActivityRange
  points: PrintActivityPoint[]
  totalPages: number
}

export async function getDashboardSnapshot() {
  const [users, printers, jobs, alerts, pages, activity, printerStatuses] = await Promise.all([
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
    query<{ held_jobs: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'held')::text AS held_jobs
       FROM print_jobs`,
    ),
    query<{ recent_errors: string; recent_warnings: string; open_alerts: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE status <> 'resolved' AND severity IN ('high', 'critical'))::text AS recent_errors,
         COUNT(*) FILTER (WHERE status <> 'resolved' AND severity IN ('low', 'medium'))::text AS recent_warnings,
         COUNT(*) FILTER (WHERE status <> 'resolved')::text AS open_alerts
       FROM device_errors`,
    ),
    query<{ pages_today: string; total_pages: string }>(
      `WITH activity_day AS (
         SELECT CURRENT_DATE AS day
       )
       SELECT
         COALESCE(SUM(pl.pages) FILTER (WHERE pl.printed_at::date = activity_day.day), 0)::text AS pages_today,
         COALESCE(SUM(pl.pages), 0)::text AS total_pages
       FROM print_logs pl
       CROSS JOIN activity_day`,
    ),
    query<{ hour: number; pages: string }>(
      `WITH activity_day AS (
         SELECT CURRENT_DATE AS day
       ),
       hours AS (
         SELECT generate_series(0, 23) AS hour
       )
       SELECT
         hours.hour,
         COALESCE(SUM(pl.pages), 0)::text AS pages
       FROM hours
       CROSS JOIN activity_day
       LEFT JOIN print_logs pl
         ON pl.printed_at::date = activity_day.day
        AND EXTRACT(HOUR FROM pl.printed_at)::int = hours.hour
       GROUP BY hours.hour
       ORDER BY hours.hour`,
    ),
    query<{ id: string; name: string; status: string; pending_jobs: string }>(
      `SELECT
         p.printer_uuid::text AS id,
         p.name,
         p.status,
         COUNT(pj.id) FILTER (WHERE pj.status IN ('held', 'queued', 'printing', 'blocked'))::text AS pending_jobs
       FROM printers p
       LEFT JOIN print_jobs pj ON pj.printer_id = p.id
       WHERE p.status <> 'archived'
       GROUP BY p.id
       ORDER BY p.name`,
    ),
  ])

  const userMetrics = users.rows[0]
  const printerMetrics = printers.rows[0]
  const jobMetrics = jobs.rows[0]
  const alertMetrics = alerts.rows[0]
  const pageMetrics = pages.rows[0]

  return {
    active_users: Number(userMetrics?.active_users ?? 0),
    suspended_users: Number(userMetrics?.suspended_users ?? 0),
    total_printers: Number(printerMetrics?.total_printers ?? 0),
    online_printers: Number(printerMetrics?.online_printers ?? 0),
    problem_printers: Number(printerMetrics?.problem_printers ?? 0),
    device_count: Number(printerMetrics?.total_printers ?? 0),
    held_jobs: Number(jobMetrics?.held_jobs ?? 0),
    pages_today: Number(pageMetrics?.pages_today ?? 0),
    total_pages: Number(pageMetrics?.total_pages ?? 0),
    recent_errors: Number(alertMetrics?.recent_errors ?? 0),
    recent_warnings: Number(alertMetrics?.recent_warnings ?? 0),
    open_alerts: Number(alertMetrics?.open_alerts ?? 0),
    active_user_clients: Number(userMetrics?.active_users ?? 0),
    system_uptime: formatUptime(process.uptime()),
    print_activity_labels: activity.rows.map((row) => String(row.hour).padStart(2, '0')),
    print_activity_values: activity.rows.map((row) => Number(row.pages)),
    printer_statuses: printerStatuses.rows.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      pending_jobs: Number(row.pending_jobs),
    })),
  }
}

function formatUptime(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3_600)

  return `${days}d ${hours}h`
}

export async function getPrintActivity(range: PrintActivityRange = 'week'): Promise<PrintActivitySnapshot> {
  const days = range === 'month' ? 30 : 7
  const result = await query<{ date: string; label: string; pages: string }>(
    `WITH days AS (
       SELECT generate_series(
         CURRENT_DATE - ($1::int - 1),
         CURRENT_DATE,
         INTERVAL '1 day'
       )::date AS day
     )
     SELECT
       days.day::text AS date,
       to_char(days.day, 'Mon DD') AS label,
       COALESCE(SUM(pl.pages), 0)::text AS pages
     FROM days
     LEFT JOIN print_logs pl ON pl.printed_at::date = days.day
     GROUP BY days.day
     ORDER BY days.day`,
    [days],
  )
  const points = result.rows.map((row) => ({
    date: row.date,
    label: row.label,
    pages: Number(row.pages),
  }))

  return {
    range,
    points,
    totalPages: points.reduce((total, point) => total + point.pages, 0),
  }
}

function normalizeFilter(value?: string) {
  const trimmed = value?.trim()

  if (!trimmed || trimmed === 'all') {
    return undefined
  }

  return trimmed
}

function normalizePositiveInteger(value: number | undefined, fallback: number, max?: number) {
  if (!value || !Number.isFinite(value) || value < 1) {
    return fallback
  }

  const normalized = Math.floor(value)
  return max ? Math.min(normalized, max) : normalized
}

export async function listRecentPrintLogs(options: ListRecentPrintLogsOptions = {}): Promise<RecentPrintLogPage> {
  const search = normalizeFilter(options.search)
  const status = normalizeFilter(options.status)?.toLowerCase()
  const device = normalizeFilter(options.device)
  const page = normalizePositiveInteger(options.page, 1)
  const limit = normalizePositiveInteger(options.limit, 10, 50)
  const offset = (page - 1) * limit
  const whereClauses: string[] = []
  const values: unknown[] = []

  if (search) {
    values.push(`%${search}%`)
    const param = `$${values.length}`
    whereClauses.push(`(
      COALESCE(u.username, '') ILIKE ${param}
      OR COALESCE(u.display_name, '') ILIKE ${param}
      OR pl.user_name ILIKE ${param}
    )`)
  }

  if (status) {
    values.push(status)
    whereClauses.push(`pl.status = $${values.length}`)
  }

  if (device) {
    values.push(device)
    whereClauses.push(`COALESCE(p.name, pl.device_name) = $${values.length}`)
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
  const rowValues = [...values, limit, offset]
  const limitParam = `$${rowValues.length - 1}`
  const offsetParam = `$${rowValues.length}`

  const [countResult, rowsResult, statusResult, deviceResult] = await Promise.all([
    query<{ total: string }>(
      `SELECT COUNT(*)::text AS total
       FROM print_logs pl
       LEFT JOIN users u ON u.id = pl.user_id
       LEFT JOIN printers p ON p.id = pl.printer_id
       ${whereSql}`,
      values,
    ),
    query<{
      id: string
      printed_at: Date
      user_name: string
      device_name: string
      pages: number
      cost: string
      status: string
    }>(
      `SELECT
         pl.print_log_uuid::text AS id,
         pl.printed_at,
         COALESCE(u.username, pl.user_name) AS user_name,
         COALESCE(p.name, pl.device_name) AS device_name,
         pl.pages,
         pl.cost::text AS cost,
         pl.status
       FROM print_logs pl
       LEFT JOIN users u ON u.id = pl.user_id
       LEFT JOIN printers p ON p.id = pl.printer_id
       ${whereSql}
       ORDER BY pl.printed_at DESC
       LIMIT ${limitParam}
       OFFSET ${offsetParam}`,
      rowValues,
    ),
    query<{ status: string }>('SELECT DISTINCT status FROM print_logs ORDER BY status'),
    query<{ device: string }>(
      `SELECT DISTINCT COALESCE(p.name, pl.device_name) AS device
       FROM print_logs pl
       LEFT JOIN printers p ON p.id = pl.printer_id
       ORDER BY device`,
    ),
  ])

  const total = Number(countResult.rows[0]?.total ?? 0)
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return {
    rows: rowsResult.rows.map((row) => ({
      id: row.id,
      date: row.printed_at.toISOString(),
      user: row.user_name,
      device: row.device_name,
      pages: Number(row.pages),
      cost: Number(row.cost),
      status: row.status,
    })),
    total,
    page: Math.min(page, totalPages),
    limit,
    totalPages,
    statusOptions: statusResult.rows.map((row) => row.status),
    deviceOptions: deviceResult.rows.map((row) => row.device),
  }
}
