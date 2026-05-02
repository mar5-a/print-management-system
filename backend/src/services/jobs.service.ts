/**
 * jobs.service.ts
 * Core print job lifecycle: submit, list, release, cancel, and expire jobs.
 * Jobs start in 'held' status and must be released by the user before printing.
 * Page quota is checked on submit and deducted on release.
 */
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import { query, transaction } from '../db/client.js'
import { ForbiddenError, NotFoundError, ValidationError } from '../lib/errors.js'
import { PrintDeliveryService } from './print-delivery-service.js'
import { resolveDefaultQueueForUser } from './queues.service.js'
import type { AuthenticatedUser, PaginatedResult } from '../types/index.js'

interface SubmitJobInput {
  file: Express.Multer.File
  pageCount: number
  copyCount: number
  colorMode: 'bw' | 'color'
  duplex: boolean
  paperType: string
}

interface ListJobFilters {
  userId?: number
  queueId?: string
  status?: string
  page?: number
  limit?: number
}

const activeHeldStatuses = ['held', 'queued', 'printing', 'blocked']

export async function submitJob(user: AuthenticatedUser, input: SubmitJobInput) {
  const queue = await resolveDefaultQueueForUser(user.id)
  const totalPages = input.pageCount * input.copyCount
  await assertQuotaAvailable(user.id, totalPages)

  const expiresAt = new Date(Date.now() + Number(queue.retention_hours) * 60 * 60 * 1000)
  const fileHash = await hashFile(input.file.path)
  const estimatedCost = await estimateCost(Number(queue.internal_id), input.paperType, input.colorMode, totalPages)

  const jobUuid = await transaction(async (client) => {
    const job = await client.query<{ id: number; job_uuid: string }>(
      `INSERT INTO print_jobs (
         user_id, queue_id, source_channel, page_count, page_count_source, copy_count,
         color_mode, duplex, paper_type, estimated_cost, status, expires_at
       )
       VALUES ($1, $2, 'web_upload', $3, 'user_estimate', $4, $5, $6, $7, $8, 'held', $9)
       RETURNING id, job_uuid`,
      [
        user.id,
        queue.internal_id,
        input.pageCount,
        input.copyCount,
        input.colorMode,
        input.duplex,
        input.paperType,
        estimatedCost,
        expiresAt,
      ],
    )
    const jobId = Number(job.rows[0].id)

    await client.query(
      `INSERT INTO job_files (
         print_job_id, file_role, original_file_name, stored_file_path, mime_type, file_size, file_hash
       )
       VALUES ($1, 'original', $2, $3, $4, $5, $6)`,
      [
        jobId,
        input.file.originalname,
        input.file.path,
        input.file.mimetype,
        input.file.size,
        fileHash,
      ],
    )
    await client.query(
      `INSERT INTO print_job_events (print_job_id, actor_user_id, event_type, event_source, message, metadata)
       VALUES ($1, $2, 'submitted', 'api', 'Job uploaded through portal and held for release.', $3)`,
      [
        jobId,
        user.id,
        JSON.stringify({
          originalFileName: input.file.originalname,
          queueId: queue.id,
          totalPages,
        }),
      ],
    )

    return String(job.rows[0].job_uuid)
  })

  return getJobById(jobUuid, user)
}

export async function listJobs(user: AuthenticatedUser, filters: ListJobFilters): Promise<PaginatedResult<object>> {
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(100, filters.limit ?? 20)
  const offset = (page - 1) * limit
  const params: unknown[] = []
  const conditions = ['TRUE']

  if (user.role === 'standard_user') {
    params.push(user.id)
    conditions.push(`pj.user_id = $${params.length}`)
  } else if (filters.userId) {
    params.push(filters.userId)
    conditions.push(`pj.user_id = $${params.length}`)
  }

  if (filters.queueId) {
    params.push(filters.queueId)
    conditions.push(`(q.queue_uuid::text = $${params.length} OR q.id::text = $${params.length})`)
  }

  if (filters.status) {
    params.push(filters.status)
    conditions.push(`pj.status = $${params.length}`)
  }

  const where = conditions.join(' AND ')
  const count = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM print_jobs pj
     JOIN print_queues q ON q.id = pj.queue_id
     WHERE ${where}`,
    params,
  )

  params.push(limit, offset)
  const result = await query(
    `${jobSelectSql}
     WHERE ${where}
     GROUP BY pj.id, u.user_uuid, u.username, u.display_name, q.queue_uuid, q.name, p.printer_uuid, p.name, jf.original_file_name, jf.stored_file_path
     ORDER BY pj.submitted_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  )
  const total = Number(count.rows[0]?.count ?? 0)

  return {
    data: result.rows.map(toJob),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export function listMyJobs(user: AuthenticatedUser, filters: Omit<ListJobFilters, 'userId'>) {
  return listJobs(user, { ...filters, userId: user.id })
}

export async function getJobById(id: string, user: AuthenticatedUser) {
  const result = await query(
    `${jobSelectSql}
     WHERE pj.job_uuid::text = $1 OR pj.id::text = $1
     GROUP BY pj.id, u.user_uuid, u.username, u.display_name, q.queue_uuid, q.name, p.printer_uuid, p.name, jf.original_file_name, jf.stored_file_path`,
    [id],
  )
  const job = result.rows[0]

  if (!job) {
    throw new NotFoundError('Job')
  }

  if (user.role === 'standard_user' && Number(job.user_id) !== user.id) {
    throw new ForbiddenError()
  }

  return toJob(job)
}

export async function releaseJob(id: string, user: AuthenticatedUser) {
  const job = await getReleaseCandidate(id, user)
  const deliveryService = new PrintDeliveryService()

  try {
    const delivery = await deliveryService.deliverPdf({
      uploadedPath: String(job.stored_file_path),
      originalFileName: String(job.original_file_name ?? 'print-job.pdf'),
      printer: {
        connector_type: String(job.connector_type),
        connector_target: job.connector_target ? String(job.connector_target) : null,
        connector_options: (job.connector_options ?? {}) as Record<string, unknown>,
        name: String(job.printer_name),
      },
    })

    const nextStatus = delivery.channel === 'windows_queue' ? 'queued' : 'sent_to_printer'
    const totalPages = Number(job.page_count) * Number(job.copy_count)

    await transaction(async (client) => {
      await client.query(
        `UPDATE print_jobs
         SET status = $1, printer_id = $2, release_channel = 'web', released_at = NOW(), final_cost = estimated_cost
         WHERE id = $3`,
        [nextStatus, job.printer_id, job.id],
      )

      if (delivery.channel === 'raw_socket' && 'postScriptPath' in delivery.details) {
        await client.query(
          `INSERT INTO job_files (print_job_id, file_role, original_file_name, stored_file_path, mime_type)
           VALUES ($1, 'converted', $2, $3, 'application/postscript')`,
          [job.id, job.original_file_name, delivery.details.postScriptPath],
        )
      }

      await client.query(
        `UPDATE user_quotas
         SET used_pages = used_pages + $1, updated_at = NOW()
         WHERE user_id = $2 AND quota_period = 'semester'`,
        [totalPages, job.user_id],
      )
      await client.query(
        `INSERT INTO print_job_events (print_job_id, actor_user_id, event_type, event_source, message, metadata)
         VALUES ($1, $2, 'released', 'api', 'Job submitted to printer connector.', $3)`,
        [job.id, user.id, JSON.stringify(delivery)],
      )
    })

    return getJobById(id, user)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Print connector failed'
    await query(
      `UPDATE print_jobs SET status = 'failed', failure_reason = $1, updated_at = NOW() WHERE id = $2`,
      [message, job.id],
    )
    await query(
      `INSERT INTO print_job_events (print_job_id, actor_user_id, event_type, event_source, message)
       VALUES ($1, $2, 'failed', 'api', $3)`,
      [job.id, user.id, message],
    )
    throw error
  }
}

export async function cancelJob(id: string, user: AuthenticatedUser) {
  const job = await getReleaseCandidate(id, user, false)

  if (job.status !== 'held') {
    throw new ValidationError(`Cannot cancel job in status '${job.status}'`)
  }

  await query(
    `UPDATE print_jobs SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
    [job.id],
  )
  await query(
    `INSERT INTO print_job_events (print_job_id, actor_user_id, event_type, event_source, message)
     VALUES ($1, $2, 'cancelled', 'api', 'Job cancelled before release.')`,
    [job.id, user.id],
  )

  return getJobById(id, user)
}

export async function listJobEvents(id: string, user: AuthenticatedUser) {
  const job = await getReleaseCandidate(id, user, false)
  const result = await query(
    `SELECT event_type, event_source, message, metadata, created_at
     FROM print_job_events
     WHERE print_job_id = $1
     ORDER BY created_at`,
    [job.id],
  )

  return result.rows
}

async function getReleaseCandidate(id: string, user: AuthenticatedUser, requireHeld = true) {
  const result = await query(
    `SELECT
       pj.*,
       jf.original_file_name,
       jf.stored_file_path,
       p.id AS printer_id,
       p.name AS printer_name,
       p.connector_type,
       p.connector_target,
       p.connector_options
     FROM print_jobs pj
     JOIN job_files jf ON jf.print_job_id = pj.id AND jf.file_role = 'original'
     JOIN queue_printers qp ON qp.queue_id = pj.queue_id AND qp.is_enabled = TRUE
     JOIN printers p ON p.id = qp.printer_id AND p.status = 'online'
     WHERE pj.job_uuid::text = $1 OR pj.id::text = $1
     ORDER BY qp.is_primary DESC, qp.priority_order
     LIMIT 1`,
    [id],
  )
  const job = result.rows[0]

  if (!job) {
    throw new NotFoundError('Releasable job')
  }

  if (user.role === 'standard_user' && Number(job.user_id) !== user.id) {
    throw new ForbiddenError()
  }

  if (requireHeld && job.status !== 'held') {
    throw new ValidationError(`Job status is '${job.status}', must be 'held' to release`)
  }

  return job
}

async function assertQuotaAvailable(userId: number, requestedPages: number) {
  const result = await query(
    `SELECT
       uq.allocated_pages,
       uq.used_pages,
       COALESCE(SUM(pj.page_count * pj.copy_count) FILTER (WHERE pj.status = ANY($2::text[])), 0) AS reserved_pages
     FROM user_quotas uq
     LEFT JOIN print_jobs pj ON pj.user_id = uq.user_id
     WHERE uq.user_id = $1 AND uq.quota_period = 'semester'
     GROUP BY uq.user_id, uq.allocated_pages, uq.used_pages`,
    [userId, activeHeldStatuses],
  )
  const quota = result.rows[0]

  if (!quota) {
    return
  }

  const available = Number(quota.allocated_pages) - Number(quota.used_pages) - Number(quota.reserved_pages)

  if (requestedPages > available) {
    throw new ValidationError('Insufficient print quota')
  }
}

async function estimateCost(queueId: number, paperType: string, colorMode: string, totalPages: number) {
  const result = await query<{ cost_per_page: string }>(
    `SELECT cost_per_page::text
     FROM pricing_rules
     WHERE queue_id = $1
       AND is_active = TRUE
       AND (paper_type = $2 OR paper_type IS NULL)
       AND (color_mode = $3 OR color_mode IS NULL)
     ORDER BY paper_type NULLS LAST, color_mode NULLS LAST
     LIMIT 1`,
    [queueId, paperType, colorMode],
  )
  const costPerPage = Number(result.rows[0]?.cost_per_page ?? 0)

  return Number((costPerPage * totalPages).toFixed(4))
}

async function hashFile(filePath: string) {
  const buffer = await fs.readFile(filePath)
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

const jobSelectSql = `
  SELECT
    pj.*,
    u.user_uuid,
    u.username,
    u.display_name,
    q.queue_uuid,
    q.name AS queue_name,
    p.printer_uuid,
    p.name AS printer_name,
    jf.original_file_name,
    jf.stored_file_path,
    (pj.page_count * pj.copy_count) AS total_pages
  FROM print_jobs pj
  JOIN users u ON u.id = pj.user_id
  JOIN print_queues q ON q.id = pj.queue_id
  LEFT JOIN printers p ON p.id = pj.printer_id
  LEFT JOIN job_files jf ON jf.print_job_id = pj.id AND jf.file_role = 'original'
`

function toJob(row: Record<string, unknown>) {
  return {
    id: String(row.job_uuid ?? row.id),
    internal_id: Number(row.id),
    user_id: String(row.user_uuid ?? row.user_id),
    username: String(row.username),
    display_name: String(row.display_name),
    queue_id: String(row.queue_uuid ?? row.queue_id),
    queue_name: String(row.queue_name),
    printer_id: row.printer_uuid ? String(row.printer_uuid) : null,
    printer_name: row.printer_name ? String(row.printer_name) : null,
    file_name: row.original_file_name ? String(row.original_file_name) : 'Unknown file',
    page_count: Number(row.page_count),
    copy_count: Number(row.copy_count),
    total_pages: Number(row.total_pages),
    color_mode: String(row.color_mode),
    duplex: Boolean(row.duplex),
    paper_type: String(row.paper_type),
    estimated_cost: Number(row.estimated_cost ?? 0),
    final_cost: row.final_cost === null ? null : Number(row.final_cost ?? 0),
    status: String(row.status),
    submitted_at: row.submitted_at,
    released_at: row.released_at,
    completed_at: row.completed_at,
    expires_at: row.expires_at,
    failure_reason: row.failure_reason ? String(row.failure_reason) : null,
  }
}
