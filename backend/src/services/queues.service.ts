import { query } from '../db/client.js'
import { NotFoundError, ConflictError } from '../lib/errors.js'
import type { PaginatedResult } from '../types/index.js'

export async function listQueues(filters: {
  status?: string
  search?: string
  page?: number
  limit?: number
}): Promise<PaginatedResult<object>> {
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(100, filters.limit ?? 20)
  const offset = (page - 1) * limit

  const conditions = ['pq.deleted_at IS NULL']
  const params: unknown[] = []

  if (filters.status) { params.push(filters.status.toLowerCase()); conditions.push(`pq.status = $${params.length}`) }
  if (filters.search) {
    params.push(`%${filters.search}%`)
    conditions.push(`(pq.name ILIKE $${params.length} OR pq.description ILIKE $${params.length})`)
  }

  const where = conditions.join(' AND ')
  const countResult = await query(`SELECT COUNT(*) FROM print_queues pq WHERE ${where}`, params)
  const total = parseInt(countResult.rows[0].count, 10)

  params.push(limit, offset)
  const dataResult = await query(
    `SELECT pq.*, d.name AS department_name,
            COUNT(DISTINCT qp.printer_id) AS printer_count,
            COUNT(DISTINCT pj.id) FILTER (WHERE pj.status IN ('held','submitted')) AS pending_jobs
     FROM print_queues pq
     LEFT JOIN departments d ON d.id = pq.department_id
     LEFT JOIN queue_printers qp ON qp.queue_id = pq.id AND qp.is_enabled = true
     LEFT JOIN print_jobs pj ON pj.queue_id = pq.id AND pj.deleted_at IS NULL
     WHERE ${where}
     GROUP BY pq.id, d.name
     ORDER BY pq.name
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )

  return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getQueueById(id: string) {
  const result = await query(
    `SELECT pq.*, d.name AS department_name
     FROM print_queues pq
     LEFT JOIN departments d ON d.id = pq.department_id
     WHERE pq.id = $1 AND pq.deleted_at IS NULL`,
    [id]
  )
  if (!result.rows[0]) throw new NotFoundError('Queue')

  const printers = await query(
    `SELECT p.id, p.name, p.status, p.model, p.location, qp.is_primary, qp.priority_order
     FROM queue_printers qp
     JOIN printers p ON p.id = qp.printer_id
     WHERE qp.queue_id = $1 AND p.deleted_at IS NULL
     ORDER BY qp.priority_order`,
    [id]
  )

  return { ...result.rows[0], printers: printers.rows }
}

export async function createQueue(data: {
  name: string
  description?: string
  releaseMode?: string
  audience?: string
  departmentId?: string
  retentionHours?: number
  costPerPage?: number
  printerIds?: string[]
  createdBy?: string
}) {
  const existing = await query('SELECT id FROM print_queues WHERE name = $1 AND deleted_at IS NULL', [data.name])
  if (existing.rows.length) throw new ConflictError('Queue name already exists')

  const result = await query(
    `INSERT INTO print_queues (name, description, release_mode, audience, department_id,
       retention_hours, cost_per_page, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [
      data.name, data.description ?? null,
      data.releaseMode ?? 'secure_release',
      data.audience ?? 'mixed',
      data.departmentId ?? null,
      data.retentionHours ?? 24,
      data.costPerPage ?? 0.05,
      data.createdBy ?? null,
    ]
  )
  const queueId = result.rows[0].id

  if (data.printerIds?.length) {
    for (const pid of data.printerIds) {
      await query(
        `INSERT INTO queue_printers (queue_id, printer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [queueId, pid]
      )
    }
  }

  return getQueueById(queueId)
}

export async function updateQueue(id: string, data: Partial<{
  name: string; description: string; status: string; enabled: boolean
  releaseMode: string; audience: string; departmentId: string
  retentionHours: number; costPerPage: number; printerIds: string[]
}>) {
  await getQueueById(id)

  const map: Record<string, unknown> = {
    name: data.name, description: data.description,
    status: data.status?.toLowerCase(), enabled: data.enabled,
    release_mode: data.releaseMode, audience: data.audience?.toLowerCase(),
    department_id: data.departmentId, retention_hours: data.retentionHours,
    cost_per_page: data.costPerPage,
  }

  const fields: string[] = []
  const params: unknown[] = []
  for (const [col, val] of Object.entries(map)) {
    if (val !== undefined) { params.push(val); fields.push(`${col} = $${params.length}`) }
  }

  if (fields.length) {
    params.push(id)
    await query(`UPDATE print_queues SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`, params)
  }

  if (data.printerIds !== undefined) {
    await query('DELETE FROM queue_printers WHERE queue_id = $1', [id])
    for (const pid of data.printerIds) {
      await query('INSERT INTO queue_printers (queue_id, printer_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, pid])
    }
  }

  return getQueueById(id)
}

export async function deleteQueue(id: string) {
  const q = await getQueueById(id)
  const held = await query(
    `SELECT COUNT(*) FROM print_jobs WHERE queue_id = $1 AND status IN ('held','submitted') AND deleted_at IS NULL`,
    [id]
  )
  if (parseInt(held.rows[0].count, 10) > 0) {
    throw new ConflictError('Cannot delete queue with pending jobs')
  }
  await query('UPDATE print_queues SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1', [id])
  return q
}

export async function getQueueJobs(queueId: string, page = 1, limit = 20) {
  await getQueueById(queueId)
  const offset = (page - 1) * limit
  const result = await query(
    `SELECT pj.*, u.username, u.display_name, p.name AS printer_name
     FROM print_jobs pj
     JOIN users u ON u.id = pj.user_id
     LEFT JOIN printers p ON p.id = pj.printer_id
     WHERE pj.queue_id = $1 AND pj.deleted_at IS NULL
     ORDER BY pj.submitted_at DESC
     LIMIT $2 OFFSET $3`,
    [queueId, limit, offset]
  )
  return result.rows
}
