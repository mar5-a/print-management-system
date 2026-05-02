import { query, transaction } from '../db/pool.js'
import { ConflictError, NotFoundError } from '../lib/errors.js'
import type { PaginatedResult } from '../types/api.js'

interface QueueFilters {
  status?: string
  search?: string
  page?: number
  limit?: number
}

interface QueueInput {
  name?: string
  description?: string
  status?: 'active' | 'disabled' | 'archived'
  queueType?: 'standard' | 'student' | 'staff' | 'faculty' | 'mixed' | 'other'
  releaseMode?: 'secure_release' | 'immediate'
  retentionHours?: number
  printerIds?: string[]
  costPerPage?: number
}

export async function listQueues(filters: QueueFilters): Promise<PaginatedResult<object>> {
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(100, filters.limit ?? 20)
  const offset = (page - 1) * limit
  const params: unknown[] = []
  const conditions = [`q.status <> 'archived'`]

  if (filters.status) {
    params.push(filters.status)
    conditions.push(`q.status = $${params.length}`)
  }

  if (filters.search) {
    params.push(`%${filters.search}%`)
    conditions.push(`(q.name ILIKE $${params.length} OR q.description ILIKE $${params.length})`)
  }

  const where = conditions.join(' AND ')
  const count = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM print_queues q WHERE ${where}`, params)

  params.push(limit, offset)
  const result = await query(
    `SELECT
        q.*,
        COALESCE(pr.cost_per_page, 0) AS cost_per_page,
        COUNT(DISTINCT qp.printer_id) FILTER (WHERE qp.is_enabled = TRUE) AS printer_count,
        COUNT(DISTINCT pj.id) FILTER (WHERE pj.status IN ('held', 'queued', 'printing')) AS pending_jobs,
        COUNT(DISTINCT pj.id) FILTER (WHERE pj.status = 'held') AS held_jobs,
        COUNT(DISTINCT pj.id) FILTER (WHERE pj.status = 'sent_to_printer' AND pj.released_at::date = CURRENT_DATE) AS released_today
     FROM print_queues q
     LEFT JOIN pricing_rules pr ON pr.queue_id = q.id AND pr.is_active = TRUE
     LEFT JOIN queue_printers qp ON qp.queue_id = q.id
     LEFT JOIN print_jobs pj ON pj.queue_id = q.id
     WHERE ${where}
     GROUP BY q.id, pr.cost_per_page
     ORDER BY q.priority_order, q.name
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  )
  const total = Number(count.rows[0]?.count ?? 0)

  return {
    data: result.rows.map(toQueue),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function listEligibleQueuesForUser(userId: number) {
  const result = await query(
    `WITH user_context AS (
        SELECT
          u.id,
          COALESCE(array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles,
          COALESCE(array_agg(DISTINCT ag.name) FILTER (WHERE ag.name IS NOT NULL), '{}') AS ad_groups
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        LEFT JOIN user_ad_group_memberships uagm ON uagm.user_id = u.id
        LEFT JOIN ad_groups ag ON ag.id = uagm.group_id
        WHERE u.id = $1
        GROUP BY u.id
      )
      SELECT
        q.*,
        COALESCE(pr.cost_per_page, 0) AS cost_per_page,
        COUNT(DISTINCT qp.printer_id) FILTER (WHERE qp.is_enabled = TRUE) AS printer_count,
        COUNT(DISTINCT pj.id) FILTER (WHERE pj.status = 'held') AS held_jobs
      FROM print_queues q
      CROSS JOIN user_context uc
      LEFT JOIN pricing_rules pr ON pr.queue_id = q.id AND pr.is_active = TRUE
      LEFT JOIN queue_printers qp ON qp.queue_id = q.id
      LEFT JOIN print_jobs pj ON pj.queue_id = q.id
      WHERE q.status = 'active'
        AND EXISTS (
          SELECT 1
          FROM queue_access_rules qar
          WHERE qar.queue_id = q.id
          AND (
            (qar.rule_type = 'role' AND qar.rule_value = ANY(uc.roles))
            OR (qar.rule_type = 'ad_group' AND qar.rule_value = ANY(uc.ad_groups))
            OR (qar.rule_type = 'user' AND qar.rule_value = uc.id::text)
          )
        )
      GROUP BY q.id, pr.cost_per_page
      ORDER BY q.is_default DESC, q.priority_order, q.name`,
    [userId],
  )

  return result.rows.map(toQueue)
}

export async function resolveDefaultQueueForUser(userId: number) {
  const queues = await listEligibleQueuesForUser(userId)
  const queue = queues[0]

  if (!queue) {
    throw new NotFoundError('Eligible queue')
  }

  return queue
}

export async function getQueueById(id: string) {
  const result = await query(
    `SELECT
        q.*,
        COALESCE(pr.cost_per_page, 0) AS cost_per_page,
        COUNT(DISTINCT qp.printer_id) FILTER (WHERE qp.is_enabled = TRUE) AS printer_count,
        COUNT(DISTINCT pj.id) FILTER (WHERE pj.status IN ('held', 'queued', 'printing')) AS pending_jobs,
        COUNT(DISTINCT pj.id) FILTER (WHERE pj.status = 'held') AS held_jobs,
        COUNT(DISTINCT pj.id) FILTER (WHERE pj.status = 'sent_to_printer' AND pj.released_at::date = CURRENT_DATE) AS released_today
     FROM print_queues q
     LEFT JOIN pricing_rules pr ON pr.queue_id = q.id AND pr.is_active = TRUE
     LEFT JOIN queue_printers qp ON qp.queue_id = q.id
     LEFT JOIN print_jobs pj ON pj.queue_id = q.id
     WHERE q.queue_uuid::text = $1 OR q.id::text = $1
     GROUP BY q.id, pr.cost_per_page`,
    [id],
  )

  if (!result.rows[0]) {
    throw new NotFoundError('Queue')
  }

  const queue = toQueue(result.rows[0])
  const printers = await query(
    `SELECT p.printer_uuid, p.id, p.name, p.status, p.model, p.location, qp.is_primary, qp.priority_order
     FROM queue_printers qp
     JOIN printers p ON p.id = qp.printer_id
     WHERE qp.queue_id = $1
     ORDER BY qp.priority_order, p.name`,
    [queue.internal_id],
  )

  return {
    ...queue,
    printers: printers.rows.map((row) => ({
      id: String(row.printer_uuid ?? row.id),
      name: String(row.name),
      status: String(row.status),
      model: row.model ? String(row.model) : null,
      location: row.location ? String(row.location) : null,
      is_primary: Boolean(row.is_primary),
      priority_order: Number(row.priority_order ?? 100),
    })),
  }
}

export async function createQueue(input: Required<Pick<QueueInput, 'name'>> & QueueInput, createdBy: number) {
  const existing = await query('SELECT id FROM print_queues WHERE name = $1 AND status <> \'archived\'', [input.name])
  if (existing.rows.length > 0) {
    throw new ConflictError('Queue name already exists')
  }

  const queueUuid = await transaction(async (client) => {
    const queue = await client.query<{ id: number; queue_uuid: string }>(
      `INSERT INTO print_queues (name, description, queue_type, release_mode, status, retention_hours, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, queue_uuid`,
      [
        input.name,
        input.description ?? null,
        input.queueType ?? 'standard',
        input.releaseMode ?? 'secure_release',
        input.status ?? 'active',
        input.retentionHours ?? 24,
        createdBy,
      ],
    )
    const queueId = Number(queue.rows[0].id)

    if (input.costPerPage !== undefined) {
      await client.query(
        `INSERT INTO pricing_rules (name, queue_id, paper_type, color_mode, cost_per_page, is_active)
         VALUES ($1, $2, 'standard', 'bw', $3, TRUE)`,
        [`${input.name} standard page`, queueId, input.costPerPage],
      )
    }

    await replaceQueuePrinters(client, queueId, input.printerIds ?? [])

    return String(queue.rows[0].queue_uuid)
  })

  return getQueueById(queueUuid)
}

export async function updateQueue(id: string, input: QueueInput) {
  const queue = await getQueueById(id)
  const fields: string[] = []
  const params: unknown[] = []
  const fieldMap = {
    name: input.name,
    description: input.description,
    queue_type: input.queueType,
    release_mode: input.releaseMode,
    status: input.status,
    retention_hours: input.retentionHours,
  }

  for (const [field, value] of Object.entries(fieldMap)) {
    if (value !== undefined) {
      params.push(value)
      fields.push(`${field} = $${params.length}`)
    }
  }

  await transaction(async (client) => {
    if (fields.length > 0) {
      params.push(queue.internal_id)
      await client.query(`UPDATE print_queues SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`, params)
    }

    if (input.printerIds !== undefined) {
      await replaceQueuePrinters(client, queue.internal_id, input.printerIds)
    }

    if (input.costPerPage !== undefined) {
      await client.query(
        `INSERT INTO pricing_rules (name, queue_id, paper_type, color_mode, cost_per_page, is_active)
         VALUES ($1, $2, 'standard', 'bw', $3, TRUE)
         ON CONFLICT (name) DO UPDATE SET cost_per_page = EXCLUDED.cost_per_page, is_active = TRUE`,
        [`${queue.name} standard page`, queue.internal_id, input.costPerPage],
      )
    }
  })

  return getQueueById(id)
}

export async function deleteQueue(id: string) {
  const queue = await getQueueById(id)
  if (queue.pending_jobs > 0) {
    throw new ConflictError('Cannot delete queue with pending jobs')
  }

  await query('UPDATE print_queues SET status = \'archived\', updated_at = NOW() WHERE id = $1', [queue.internal_id])
}

async function replaceQueuePrinters(client: { query: (text: string, values?: unknown[]) => Promise<unknown> }, queueId: number, printerIds: string[]) {
  await client.query('DELETE FROM queue_printers WHERE queue_id = $1', [queueId])

  for (const [index, printerPublicId] of printerIds.entries()) {
    await client.query(
      `INSERT INTO queue_printers (queue_id, printer_id, is_primary, priority_order)
       SELECT $1, id, $3, $4
       FROM printers
       WHERE printer_uuid::text = $2 OR id::text = $2
       ON CONFLICT (printer_id) DO UPDATE SET
         queue_id = EXCLUDED.queue_id,
         is_primary = EXCLUDED.is_primary,
         priority_order = EXCLUDED.priority_order,
         is_enabled = TRUE`,
      [queueId, printerPublicId, index === 0, index + 1],
    )
  }
}

function toQueue(row: Record<string, unknown>) {
  return {
    id: String(row.queue_uuid ?? row.id),
    internal_id: Number(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : '',
    queue_type: String(row.queue_type),
    status: String(row.status),
    enabled: row.status === 'active',
    is_default: Boolean(row.is_default),
    release_mode: String(row.release_mode),
    retention_hours: Number(row.retention_hours ?? 24),
    cost_per_page: Number(row.cost_per_page ?? 0),
    printer_count: Number(row.printer_count ?? 0),
    pending_jobs: Number(row.pending_jobs ?? 0),
    held_jobs: Number(row.held_jobs ?? 0),
    released_today: Number(row.released_today ?? 0),
    priority_order: Number(row.priority_order ?? 100),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
