import { query } from '../db/client.js'
import { NotFoundError, ForbiddenError, ValidationError } from '../lib/errors.js'
import type { PaginatedResult } from '../types/index.js'

export async function listJobs(filters: {
  userId?: string
  queueId?: string
  status?: string
  role?: 'admin' | 'technician' | 'standard_user'
  page?: number
  limit?: number
}): Promise<PaginatedResult<object>> {
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(100, filters.limit ?? 20)
  const offset = (page - 1) * limit

  const conditions = ['pj.deleted_at IS NULL']
  const params: unknown[] = []

  // Standard users only see their own jobs
  if (filters.role === 'standard_user' && filters.userId) {
    params.push(filters.userId)
    conditions.push(`pj.user_id = $${params.length}`)
  } else if (filters.userId) {
    params.push(filters.userId)
    conditions.push(`pj.user_id = $${params.length}`)
  }

  if (filters.queueId) { params.push(filters.queueId); conditions.push(`pj.queue_id = $${params.length}`) }
  if (filters.status) { params.push(filters.status); conditions.push(`pj.status = $${params.length}`) }

  const where = conditions.join(' AND ')
  const countResult = await query(`SELECT COUNT(*) FROM print_jobs pj WHERE ${where}`, params)
  const total = parseInt(countResult.rows[0].count, 10)

  params.push(limit, offset)
  const dataResult = await query(
    `SELECT pj.*, u.username, u.display_name,
            pq.name AS queue_name, p.name AS printer_name
     FROM print_jobs pj
     JOIN users u ON u.id = pj.user_id
     JOIN print_queues pq ON pq.id = pj.queue_id
     LEFT JOIN printers p ON p.id = pj.printer_id
     WHERE ${where}
     ORDER BY pj.submitted_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )

  return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getJobById(id: string, userId: string, role: string) {
  const result = await query(
    `SELECT pj.*, u.username, u.display_name,
            pq.name AS queue_name, p.name AS printer_name
     FROM print_jobs pj
     JOIN users u ON u.id = pj.user_id
     JOIN print_queues pq ON pq.id = pj.queue_id
     LEFT JOIN printers p ON p.id = pj.printer_id
     WHERE pj.id = $1 AND pj.deleted_at IS NULL`,
    [id]
  )
  const job = result.rows[0]
  if (!job) throw new NotFoundError('Job')
  if (role === 'standard_user' && job.user_id !== userId) throw new ForbiddenError()
  return job
}

export async function submitJob(userId: string, data: {
  queueId: string
  fileName: string
  filePath?: string
  fileHash?: string
  fileSizeBytes?: number
  mimeType?: string
  pageCount: number
  copyCount?: number
  colorMode?: string
  duplex?: boolean
  paperType?: string
}) {
  // Validate queue exists and is enabled
  const queueResult = await query(
    'SELECT id, cost_per_page, retention_hours, enabled FROM print_queues WHERE id = $1 AND deleted_at IS NULL',
    [data.queueId]
  )
  const queue = queueResult.rows[0]
  if (!queue) throw new NotFoundError('Queue')
  if (!queue.enabled) throw new ValidationError('Queue is not accepting jobs')

  // Check user quota
  const quotaResult = await query(
    'SELECT allocated_pages, used_pages, reserved_pages FROM user_quotas WHERE user_id = $1',
    [userId]
  )
  const quota = quotaResult.rows[0]
  const copies = data.copyCount ?? 1
  const totalPages = data.pageCount * copies

  if (quota) {
    const available = quota.allocated_pages - quota.used_pages - quota.reserved_pages
    if (totalPages > available) throw new ValidationError('Insufficient print quota')
  }

  const costPerPage = parseFloat(queue.cost_per_page)
  const colorMultiplier = data.colorMode === 'color' ? 3 : 1
  const estimatedCost = totalPages * costPerPage * colorMultiplier

  const expiresAt = new Date(Date.now() + queue.retention_hours * 60 * 60 * 1000)

  const result = await query(
    `INSERT INTO print_jobs (user_id, queue_id, file_name, file_path, file_hash,
       file_size_bytes, mime_type, page_count, copy_count, total_pages,
       color_mode, duplex, paper_type, estimated_cost, status, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'held',$15) RETURNING id`,
    [
      userId, data.queueId, data.fileName, data.filePath ?? null,
      data.fileHash ?? null, data.fileSizeBytes ?? null, data.mimeType ?? null,
      data.pageCount, copies, totalPages,
      data.colorMode ?? 'black_white', data.duplex ?? true,
      data.paperType ?? 'standard', estimatedCost, expiresAt,
    ]
  )

  const jobId = result.rows[0].id

  // Reserve quota
  if (quota) {
    await query(
      'UPDATE user_quotas SET reserved_pages = reserved_pages + $1, updated_at = NOW() WHERE user_id = $2',
      [totalPages, userId]
    )
  }

  // Log event
  await query(
    `INSERT INTO print_job_events (job_id, event_type, details) VALUES ($1,'submitted',$2)`,
    [jobId, JSON.stringify({ queue_id: data.queueId, file_name: data.fileName })]
  )

  return getJobById(jobId, userId, 'standard_user')
}

export async function releaseJob(id: string, userId: string, role: string) {
  const job = await getJobById(id, userId, role)
  if (job.status !== 'held') throw new ValidationError(`Job status is '${job.status}', must be 'held' to release`)

  // Find an available printer in the queue
  const printerResult = await query(
    `SELECT p.id FROM printers p
     JOIN queue_printers qp ON qp.printer_id = p.id
     WHERE qp.queue_id = $1 AND p.status = 'online' AND qp.is_enabled = true
     ORDER BY qp.priority_order LIMIT 1`,
    [job.queue_id]
  )
  const printerId = printerResult.rows[0]?.id ?? null

  await query(
    `UPDATE print_jobs SET status = 'released', released_at = NOW(), printer_id = $1, updated_at = NOW() WHERE id = $2`,
    [printerId, id]
  )

  await query(
    `INSERT INTO print_job_events (job_id, event_type, details) VALUES ($1,'released',$2)`,
    [id, JSON.stringify({ released_by: userId, printer_id: printerId })]
  )

  return getJobById(id, userId, role)
}

export async function cancelJob(id: string, userId: string, role: string) {
  const job = await getJobById(id, userId, role)
  const cancellable = ['held', 'submitted', 'released']
  if (!cancellable.includes(job.status)) {
    throw new ValidationError(`Cannot cancel job in status '${job.status}'`)
  }

  await query(
    `UPDATE print_jobs SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
    [id]
  )

  // Release reserved quota
  await query(
    `UPDATE user_quotas SET reserved_pages = GREATEST(0, reserved_pages - $1), updated_at = NOW() WHERE user_id = $2`,
    [job.total_pages, job.user_id]
  )

  await query(
    `INSERT INTO print_job_events (job_id, event_type, details) VALUES ($1,'cancelled',$2)`,
    [id, JSON.stringify({ cancelled_by: userId })]
  )

  return getJobById(id, userId, role)
}

export async function getJobEvents(id: string, userId: string, role: string) {
  await getJobById(id, userId, role)
  const result = await query(
    'SELECT * FROM print_job_events WHERE job_id = $1 ORDER BY created_at',
    [id]
  )
  return result.rows
}
