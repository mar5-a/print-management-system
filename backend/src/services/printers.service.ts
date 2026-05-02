/**
 * printers.service.ts
 * CRUD operations for printers: list, get, create, update, and delete.
 * Printers are physical devices; each can be assigned to one or more queues.
 */
import { query } from '../db/client.js'
import { ConflictError, NotFoundError } from '../lib/errors.js'
import type { PaginatedResult } from '../types/index.js'

interface ListPrintersFilters {
  status?: string
  search?: string
  page?: number
  limit?: number
}

interface PrinterInput {
  name?: string
  model?: string
  ipAddress?: string
  location?: string
  status?: 'online' | 'offline' | 'maintenance' | 'disabled'
  isColor?: boolean
  supportsDuplex?: boolean
  serialNumber?: string
  notes?: string
  connectorType?: 'raw_socket' | 'windows_queue' | 'ipp' | 'hp_oxp' | 'manual'
  connectorTarget?: string
}

export async function listPrinters(filters: ListPrintersFilters): Promise<PaginatedResult<object>> {
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(100, filters.limit ?? 20)
  const offset = (page - 1) * limit
  const params: unknown[] = []
  const conditions = [`p.status <> 'archived'`]

  if (filters.status) {
    params.push(filters.status)
    conditions.push(`p.status = $${params.length}`)
  }

  if (filters.search) {
    params.push(`%${filters.search}%`)
    conditions.push(`(p.name ILIKE $${params.length} OR p.model ILIKE $${params.length} OR p.location ILIKE $${params.length})`)
  }

  const where = conditions.join(' AND ')
  const count = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM printers p WHERE ${where}`, params)

  params.push(limit, offset)
  const result = await query(
    `SELECT
        p.*,
        q.name AS queue_name,
        q.queue_uuid,
        COUNT(DISTINCT pj.id) FILTER (WHERE pj.status = 'held') AS pending_jobs,
        COUNT(DISTINCT pj.id) FILTER (WHERE pj.status = 'sent_to_printer' AND pj.released_at::date = CURRENT_DATE) AS released_today
     FROM printers p
     LEFT JOIN queue_printers qp ON qp.printer_id = p.id AND qp.is_enabled = TRUE
     LEFT JOIN print_queues q ON q.id = qp.queue_id
     LEFT JOIN print_jobs pj ON pj.printer_id = p.id
     WHERE ${where}
     GROUP BY p.id, q.name, q.queue_uuid
     ORDER BY p.name
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  )
  const total = Number(count.rows[0]?.count ?? 0)

  return {
    data: result.rows.map(toPrinter),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getPrinterById(id: string) {
  const result = await query(
    `SELECT
        p.*,
        q.name AS queue_name,
        q.queue_uuid,
        COUNT(DISTINCT pj.id) FILTER (WHERE pj.status = 'held') AS pending_jobs,
        COUNT(DISTINCT pj.id) FILTER (WHERE pj.status = 'sent_to_printer' AND pj.released_at::date = CURRENT_DATE) AS released_today
     FROM printers p
     LEFT JOIN queue_printers qp ON qp.printer_id = p.id AND qp.is_enabled = TRUE
     LEFT JOIN print_queues q ON q.id = qp.queue_id
     LEFT JOIN print_jobs pj ON pj.printer_id = p.id
     WHERE p.printer_uuid::text = $1 OR p.id::text = $1
     GROUP BY p.id, q.name, q.queue_uuid`,
    [id],
  )

  if (!result.rows[0]) {
    throw new NotFoundError('Printer')
  }

  return toPrinter(result.rows[0])
}

export async function createPrinter(input: Required<Pick<PrinterInput, 'name'>> & PrinterInput) {
  const existing = await query('SELECT id FROM printers WHERE name = $1', [input.name])
  if (existing.rows.length > 0) {
    throw new ConflictError('Printer name already exists')
  }

  const result = await query<{ printer_uuid: string }>(
    `INSERT INTO printers (
       name, model, ip_address, location, status, is_color, supports_duplex,
       serial_number, connector_type, connector_target
     )
     VALUES ($1, $2, NULLIF($3, '')::inet, $4, $5, $6, $7, $8, $9, $10)
     RETURNING printer_uuid`,
    [
      input.name,
      input.model ?? null,
      input.ipAddress ?? '',
      input.location ?? null,
      input.status ?? 'online',
      input.isColor ?? false,
      input.supportsDuplex ?? true,
      input.serialNumber ?? null,
      input.connectorType ?? 'raw_socket',
      input.connectorTarget ?? null,
    ],
  )

  return getPrinterById(String(result.rows[0].printer_uuid))
}

export async function updatePrinter(id: string, input: PrinterInput) {
  await getPrinterInternalId(id)
  const fields: string[] = []
  const params: unknown[] = []
  const fieldMap = {
    name: input.name,
    model: input.model,
    ip_address: input.ipAddress,
    location: input.location,
    status: input.status,
    is_color: input.isColor,
    supports_duplex: input.supportsDuplex,
    serial_number: input.serialNumber,
    notes: input.notes,
    connector_type: input.connectorType,
    connector_target: input.connectorTarget,
  }

  for (const [field, value] of Object.entries(fieldMap)) {
    if (value !== undefined) {
      params.push(field === 'ip_address' ? String(value) : value)
      fields.push(field === 'ip_address' ? `${field} = NULLIF($${params.length}, '')::inet` : `${field} = $${params.length}`)
    }
  }

  if (fields.length > 0) {
    params.push(id)
    await query(
      `UPDATE printers SET ${fields.join(', ')}, updated_at = NOW()
       WHERE printer_uuid::text = $${params.length} OR id::text = $${params.length}`,
      params,
    )
  }

  return getPrinterById(id)
}

export async function deletePrinter(id: string) {
  await query(
    `UPDATE printers SET status = 'archived', updated_at = NOW()
     WHERE printer_uuid::text = $1 OR id::text = $1`,
    [id],
  )
}

export async function getPrinterErrors(id: string) {
  const printerId = await getPrinterInternalId(id)
  const result = await query(
    `SELECT * FROM device_errors WHERE printer_id = $1 ORDER BY detected_at DESC`,
    [printerId],
  )

  return result.rows
}

async function getPrinterInternalId(id: string) {
  const result = await query<{ id: number }>(
    `SELECT id FROM printers WHERE printer_uuid::text = $1 OR id::text = $1`,
    [id],
  )

  if (!result.rows[0]) {
    throw new NotFoundError('Printer')
  }

  return Number(result.rows[0].id)
}

function toPrinter(row: Record<string, unknown>) {
  return {
    id: String(row.printer_uuid ?? row.id),
    internal_id: Number(row.id),
    name: String(row.name),
    device_code: row.device_code ? String(row.device_code) : null,
    model: row.model ? String(row.model) : null,
    ip_address: row.ip_address ? String(row.ip_address) : null,
    connector_type: String(row.connector_type),
    connector_target: row.connector_target ? String(row.connector_target) : null,
    connector_options: row.connector_options ?? {},
    location: row.location ? String(row.location) : null,
    status: String(row.status),
    is_color: Boolean(row.is_color),
    supports_duplex: Boolean(row.supports_duplex),
    serial_number: row.serial_number ? String(row.serial_number) : null,
    notes: row.notes ? String(row.notes) : '',
    queue_name: row.queue_name ? String(row.queue_name) : 'Unassigned',
    queue_id: row.queue_uuid ? String(row.queue_uuid) : null,
    pending_jobs: Number(row.pending_jobs ?? 0),
    released_today: Number(row.released_today ?? 0),
    toner_level: row.toner_level ? Number(row.toner_level) : 100,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
