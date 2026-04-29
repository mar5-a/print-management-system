import { query } from '../db/client.js'
import { NotFoundError } from '../lib/errors.js'
import type { PaginatedResult } from '../types/index.js'

export async function listPrinters(filters: {
  status?: string
  search?: string
  page?: number
  limit?: number
}): Promise<PaginatedResult<object>> {
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(100, filters.limit ?? 20)
  const offset = (page - 1) * limit

  const conditions = ['p.deleted_at IS NULL']
  const params: unknown[] = []

  if (filters.status) { params.push(filters.status.toLowerCase()); conditions.push(`p.status = $${params.length}`) }
  if (filters.search) {
    params.push(`%${filters.search}%`)
    conditions.push(`(p.name ILIKE $${params.length} OR p.location ILIKE $${params.length} OR p.model ILIKE $${params.length})`)
  }

  const where = conditions.join(' AND ')
  const countResult = await query(`SELECT COUNT(*) FROM printers p WHERE ${where}`, params)
  const total = parseInt(countResult.rows[0].count, 10)

  params.push(limit, offset)
  const dataResult = await query(
    `SELECT p.*, pq.name AS queue_name, pq.id AS queue_id
     FROM printers p
     LEFT JOIN queue_printers qp ON qp.printer_id = p.id
     LEFT JOIN print_queues pq ON pq.id = qp.queue_id AND pq.deleted_at IS NULL
     WHERE ${where}
     ORDER BY p.name
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )

  return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getPrinterById(id: string) {
  const result = await query(
    `SELECT p.*, pq.name AS queue_name, pq.id AS queue_id
     FROM printers p
     LEFT JOIN queue_printers qp ON qp.printer_id = p.id
     LEFT JOIN print_queues pq ON pq.id = qp.queue_id AND pq.deleted_at IS NULL
     WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [id]
  )
  if (!result.rows[0]) throw new NotFoundError('Printer')
  return result.rows[0]
}

export async function createPrinter(data: {
  name: string
  model?: string
  ipAddress?: string
  location?: string
  isColor?: boolean
  supportsDuplex?: boolean
  costPerBwPage?: number
  costPerColorPage?: number
  serialNumber?: string
  notes?: string
}) {
  const result = await query(
    `INSERT INTO printers (name, model, ip_address, location, is_color, supports_duplex,
       cost_per_bw_page, cost_per_color_page, serial_number, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [
      data.name, data.model ?? null, data.ipAddress ?? null, data.location ?? null,
      data.isColor ?? true, data.supportsDuplex ?? true,
      data.costPerBwPage ?? 0.05, data.costPerColorPage ?? 0.15,
      data.serialNumber ?? null, data.notes ?? null,
    ]
  )
  return getPrinterById(result.rows[0].id)
}

export async function updatePrinter(id: string, data: Partial<{
  name: string; model: string; ipAddress: string; location: string
  status: string; isColor: boolean; supportsDuplex: boolean
  costPerBwPage: number; costPerColorPage: number; tonerLevel: number
  serialNumber: string; notes: string
}>) {
  await getPrinterById(id)

  const map: Record<string, unknown> = {
    name: data.name, model: data.model, ip_address: data.ipAddress,
    location: data.location, status: data.status?.toLowerCase(),
    is_color: data.isColor, supports_duplex: data.supportsDuplex,
    cost_per_bw_page: data.costPerBwPage, cost_per_color_page: data.costPerColorPage,
    toner_level: data.tonerLevel, serial_number: data.serialNumber, notes: data.notes,
  }

  const fields: string[] = []
  const params: unknown[] = []
  for (const [col, val] of Object.entries(map)) {
    if (val !== undefined) { params.push(val); fields.push(`${col} = $${params.length}`) }
  }
  if (!fields.length) return getPrinterById(id)

  params.push(id)
  await query(`UPDATE printers SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`, params)
  return getPrinterById(id)
}

export async function deletePrinter(id: string) {
  await getPrinterById(id)
  // Remove from queues first
  await query('DELETE FROM queue_printers WHERE printer_id = $1', [id])
  await query('UPDATE printers SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1', [id])
}

export async function getPrinterErrors(printerId: string) {
  await getPrinterById(printerId)
  const result = await query(
    `SELECT * FROM device_errors WHERE printer_id = $1 AND deleted_at IS NULL ORDER BY detected_at DESC LIMIT 50`,
    [printerId]
  )
  return result.rows
}
