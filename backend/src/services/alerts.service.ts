import { query } from '../db/client.js'
import { NotFoundError } from '../lib/errors.js'
import type { PaginatedResult } from '../types/index.js'

export async function listAlerts(filters: {
  printerId?: string
  severity?: string
  resolved?: boolean
  page?: number
  limit?: number
}): Promise<PaginatedResult<object>> {
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(100, filters.limit ?? 20)
  const offset = (page - 1) * limit

  const conditions = ['de.deleted_at IS NULL']
  const params: unknown[] = []

  if (filters.printerId) { params.push(filters.printerId); conditions.push(`de.printer_id = $${params.length}`) }
  if (filters.severity) { params.push(filters.severity); conditions.push(`de.severity = $${params.length}`) }
  if (filters.resolved === false) conditions.push('de.resolved_at IS NULL')
  if (filters.resolved === true) conditions.push('de.resolved_at IS NOT NULL')

  const where = conditions.join(' AND ')
  const countResult = await query(`SELECT COUNT(*) FROM device_errors de WHERE ${where}`, params)
  const total = parseInt(countResult.rows[0].count, 10)

  params.push(limit, offset)
  const dataResult = await query(
    `SELECT de.*, p.name AS printer_name, p.location,
            u.username AS resolved_by_username
     FROM device_errors de
     JOIN printers p ON p.id = de.printer_id
     LEFT JOIN users u ON u.id = de.resolved_by
     WHERE ${where}
     ORDER BY de.detected_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )

  return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getAlertById(id: string) {
  const result = await query(
    `SELECT de.*, p.name AS printer_name, p.location
     FROM device_errors de
     JOIN printers p ON p.id = de.printer_id
     WHERE de.id = $1 AND de.deleted_at IS NULL`,
    [id]
  )
  if (!result.rows[0]) throw new NotFoundError('Alert')
  return result.rows[0]
}

export async function createAlert(data: {
  printerId: string
  errorCode?: string
  severity?: string
  title: string
  description?: string
}) {
  const result = await query(
    `INSERT INTO device_errors (printer_id, error_code, severity, title, description)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [
      data.printerId, data.errorCode ?? null,
      data.severity ?? 'warning', data.title, data.description ?? null,
    ]
  )
  return getAlertById(result.rows[0].id)
}

export async function resolveAlert(id: string, resolvedBy: string) {
  await getAlertById(id)
  await query(
    `UPDATE device_errors SET resolved_at = NOW(), resolved_by = $1, updated_at = NOW() WHERE id = $2`,
    [resolvedBy, id]
  )
  return getAlertById(id)
}

export async function deleteAlert(id: string) {
  await getAlertById(id)
  await query('UPDATE device_errors SET deleted_at = NOW() WHERE id = $1', [id])
}
