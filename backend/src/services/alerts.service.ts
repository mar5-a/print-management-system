/**
 * alerts.service.ts
 * CRUD operations for device alerts (device_errors table).
 * Alerts are raised by printers and resolved/acknowledged by technicians.
 */
import { query } from '../db/client.js'
import { NotFoundError } from '../lib/errors.js'

/** Return all unresolved alerts, newest first, joined with printer details. */
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

/** Fetch a single alert by its numeric id. Throws NotFoundError if missing. */
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

/**
 * Mark an alert as acknowledged and write an audit log entry.
 * Only transitions open → acknowledged (resolved alerts are unchanged).
 * Audit log errors are swallowed to avoid blocking the action.
 */
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

/** Map a raw DB row to the public alert shape returned by the API. */
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
