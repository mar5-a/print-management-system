import { query } from '../db/pool.js'
import { NotFoundError } from '../lib/errors.js'

interface ListAlertsFilters {
  search?: string
  status?: 'active' | 'acknowledged' | 'all'
  severity?: 'critical' | 'warning' | 'info'
}

export async function listAlerts(filters: ListAlertsFilters = {}) {
  const params: unknown[] = []
  const conditions = [`de.status <> 'resolved'`]

  if (filters.search) {
    params.push(`%${filters.search}%`)
    conditions.push(`(
      de.title ILIKE $${params.length}
      OR de.description ILIKE $${params.length}
      OR COALESCE(p.name, '') ILIKE $${params.length}
    )`)
  }

  if (filters.status === 'active') {
    conditions.push(`de.status = 'open'`)
  } else if (filters.status === 'acknowledged') {
    conditions.push(`de.status = 'acknowledged'`)
  }

  if (filters.severity) {
    params.push(mapUiSeverityToDb(filters.severity))
    conditions.push(`de.severity = ANY($${params.length}::text[])`)
  }

  const result = await query(
    `SELECT
       de.*,
       p.printer_uuid,
       p.name AS printer_name,
       acknowledger.username AS acknowledged_by_username
     FROM device_errors de
     LEFT JOIN printers p ON p.id = de.printer_id
     LEFT JOIN users acknowledger ON acknowledger.id = de.acknowledged_by
     WHERE ${conditions.join(' AND ')}
     ORDER BY de.detected_at DESC`,
    params,
  )

  return result.rows.map(toAlert)
}

export async function getAlertById(id: string) {
  const result = await query(
    `SELECT
       de.*,
       p.printer_uuid,
       p.name AS printer_name,
       acknowledger.username AS acknowledged_by_username
     FROM device_errors de
     LEFT JOIN printers p ON p.id = de.printer_id
     LEFT JOIN users acknowledger ON acknowledger.id = de.acknowledged_by
     WHERE de.id::text = $1`,
    [id],
  )

  if (!result.rows[0]) {
    throw new NotFoundError('Alert')
  }

  return toAlert(result.rows[0])
}

export async function acknowledgeAlert(id: string, userId: number) {
  await query(
    `UPDATE device_errors
     SET status = 'acknowledged',
         acknowledged_by = $2,
         acknowledged_at = NOW()
     WHERE id::text = $1 AND status = 'open'`,
    [id, userId],
  )
  await query(
    `INSERT INTO audit_logs (actor_user_id, action_category, action_type, target_type, target_id)
     VALUES ($1, 'device_error', 'acknowledged', 'device_error', $2)`,
    [userId, id],
  ).catch(() => {})

  return getAlertById(id)
}

function toAlert(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    title: String(row.title),
    description: row.description ? String(row.description) : '',
    severity: mapDbSeverityToUi(String(row.severity)),
    status: String(row.status),
    source: row.printer_id ? 'device' : 'system',
    printer_id: row.printer_uuid ? String(row.printer_uuid) : null,
    printer_name: row.printer_name ? String(row.printer_name) : null,
    detected_at: row.detected_at,
    resolved_at: row.resolved_at,
    acknowledged_by: row.acknowledged_by_username ? String(row.acknowledged_by_username) : null,
    acknowledged_at: row.acknowledged_at,
  }
}

function mapDbSeverityToUi(severity: string) {
  if (severity === 'critical' || severity === 'high') return 'critical'
  if (severity === 'medium') return 'warning'
  return 'info'
}

function mapUiSeverityToDb(severity: NonNullable<ListAlertsFilters['severity']>) {
  if (severity === 'critical') return ['critical', 'high']
  if (severity === 'warning') return ['medium']
  return ['low']
}
