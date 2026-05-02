import { query } from '../db/pool.js'
import { NotFoundError } from '../lib/errors.js'

export async function listAlerts() {
  const result = await query(
    `SELECT
       de.*,
       p.printer_uuid,
       p.name AS printer_name
     FROM device_errors de
     LEFT JOIN printers p ON p.id = de.printer_id
     WHERE de.status <> 'resolved'
     ORDER BY de.detected_at DESC`,
  )

  return result.rows.map(toAlert)
}

export async function getAlertById(id: string) {
  const result = await query(
    `SELECT
       de.*,
       p.printer_uuid,
       p.name AS printer_name
     FROM device_errors de
     LEFT JOIN printers p ON p.id = de.printer_id
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
     SET status = 'acknowledged'
     WHERE id::text = $1 AND status = 'open'`,
    [id],
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
    severity: String(row.severity),
    status: String(row.status),
    source: row.printer_id ? 'device' : 'system',
    printer_id: row.printer_uuid ? String(row.printer_uuid) : null,
    printer_name: row.printer_name ? String(row.printer_name) : null,
    detected_at: row.detected_at,
    resolved_at: row.resolved_at,
  }
}
