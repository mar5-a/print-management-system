import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import { PDFDocument } from 'pdf-lib'
import { query, transaction } from '../db/pool.js'
import { ForbiddenError, NotFoundError, ValidationError } from '../lib/errors.js'
import { decryptDevicePin, encryptDevicePin, generateDevicePin } from './job-pin-secrets.js'
import { PrintDeliveryService } from './print-delivery-service.js'
import { resolveDefaultQueueForUser, listEligibleQueuesForUser } from './queues.service.js'
import type { AuthenticatedUser, PaginatedResult } from '../types/api.js'

interface SubmitJobInput {
  file: Express.Multer.File
  copyCount: number
  queueId?: string
  colorMode?: 'bw' | 'color'
  duplex?: boolean
  paperType?: string
}

interface ListJobFilters {
  userId?: number
  queueId?: string
  status?: string
  page?: number
  limit?: number
}

const reservedQuotaStatuses = ['held', 'submitting_to_device_storage', 'blocked']

export async function submitJob(user: AuthenticatedUser, input: SubmitJobInput) {
  let queue: Awaited<ReturnType<typeof resolveDefaultQueueForUser>>

  if (input.queueId) {
    const eligible = await listEligibleQueuesForUser(user.id)
    const found = eligible.find((q) => q.id === input.queueId || String(q.internal_id) === input.queueId)
    if (!found) throw new ForbiddenError()
    queue = found
  } else {
    queue = await resolveDefaultQueueForUser(user.id)
  }

  const colorMode = input.colorMode ?? 'bw'
  const duplex = input.duplex ?? false
  const paperType = input.paperType ?? 'standard'

  const pageCount = await inferPdfPageCount(input.file.path)
  const totalPages = pageCount * input.copyCount
  await assertQuotaAvailable(user.id, totalPages)

  const expiresAt = new Date(Date.now() + Number(queue.retention_hours) * 60 * 60 * 1000)
  const fileHash = await hashFile(input.file.path)
  const estimatedCost = await estimateCost(Number(queue.internal_id), paperType, colorMode, totalPages)

  const jobUuid = await transaction(async (client) => {
    const job = await client.query<{ id: number; job_uuid: string }>(
      `INSERT INTO print_jobs (
         user_id, queue_id, source_channel, page_count, page_count_source, copy_count,
         color_mode, duplex, paper_type, estimated_cost, status, expires_at
       )
       VALUES ($1, $2, 'web_upload', $3, 'pdf_inferred', $4, $5, $6, $7, $8, 'held', $9)
       RETURNING id, job_uuid`,
      [
        user.id,
        queue.internal_id,
        pageCount,
        input.copyCount,
        colorMode,
        duplex,
        paperType,
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
          pageCount,
          pageCountSource: 'pdf_inferred',
          copyCount: input.copyCount,
          totalPages,
        }),
      ],
    )
    await client.query(
      `INSERT INTO print_logs (
         print_job_id,
         user_id,
         user_name,
         printer_id,
         device_name,
         printed_at,
         pages,
         cost,
         status
       )
       SELECT $1, users.id, COALESCE(users.display_name, users.username), NULL, print_queues.name, NOW(), $2, $3, 'held'
       FROM users
       CROSS JOIN print_queues
       WHERE users.id = $4 AND print_queues.id = $5`,
      [jobId, totalPages, estimatedCost, user.id, queue.internal_id],
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

export async function storeJobOnDevice(id: string, user: AuthenticatedUser) {
  const job = await getReleaseCandidate(id, user)
  const deliveryService = new PrintDeliveryService()
  const pin = generateDevicePin()
  const deviceUsername = buildDeviceUsername(job)
  const deviceJobName = buildDeviceJobName(job)
  const encryptedPin = encryptDevicePin(pin)
  let sentToDeviceStorage = false
  let sentConnectorJobId: string | null = null

  // Temporary safety log for the current printer-panel spike. Remove or gate before production use.
  console.warn('TEMP DEVICE PIN GENERATED', {
    jobId: String(job.job_uuid ?? id),
    deviceUsername,
    deviceJobName,
    pin,
  })

  try {
    await transaction(async (client) => {
      await client.query(
        `UPDATE print_jobs
         SET status = 'submitting_to_device_storage',
             release_channel = 'web',
             device_storage_username = $1::text,
             device_storage_job_name = $2::text,
             device_storage_pin_secret = $3::text,
             updated_at = NOW()
         WHERE id = $4::bigint`,
        [deviceUsername, deviceJobName, encryptedPin, job.id],
      )
      await client.query(
        `INSERT INTO print_job_events (print_job_id, actor_user_id, event_type, event_source, message, metadata)
         VALUES ($1::bigint, $2::bigint, 'device_storage_prepared', 'api', 'Device storage PIN and printer metadata prepared before connector submission.', $3::jsonb)`,
        [
          job.id,
          user.id,
          JSON.stringify({
            username: deviceUsername,
            jobName: deviceJobName,
            printerId: job.printer_id,
          }),
        ],
      )
    })

    const delivery = await deliveryService.deliverPdf({
      uploadedPath: String(job.stored_file_path),
      originalFileName: String(job.original_file_name ?? 'print-job.pdf'),
      copyCount: Number(job.copy_count),
      deviceStorage: {
        username: deviceUsername,
        jobName: deviceJobName,
        pin,
      },
      printer: {
        connector_type: String(job.connector_type),
        connector_target: job.connector_target ? String(job.connector_target) : null,
        connector_options: (job.connector_options ?? {}) as Record<string, unknown>,
        name: String(job.printer_name),
      },
    })
    sentToDeviceStorage = delivery.channel === 'hp_pjl_stored_job'
    sentConnectorJobId = readConnectorJobId(delivery.details)

    const nextStatus = delivery.channel === 'hp_pjl_stored_job'
      ? 'stored_on_device'
      : delivery.channel === 'windows_queue' ? 'queued' : 'sent_to_printer'
    const totalPages = Number(job.page_count) * Number(job.copy_count)
    const eventType = delivery.channel === 'hp_pjl_stored_job' ? 'submitted_to_device_storage' : 'released'
    const eventMessage = delivery.channel === 'hp_pjl_stored_job'
      ? 'Job submitted to HP device memory for PIN release.'
      : 'Job submitted to printer connector.'

    await transaction(async (client) => {
      await client.query(
        `UPDATE print_jobs
         SET status = $1::text,
             printer_id = $2::bigint,
             release_channel = 'web',
             released_at = NOW(),
             final_cost = estimated_cost,
             device_storage_username = $3::text,
             device_storage_job_name = $4::text,
             device_storage_submitted_at = CASE WHEN $1::text = 'stored_on_device' THEN NOW() ELSE device_storage_submitted_at END,
             device_storage_pin_secret = $5::text,
             device_storage_connector_job_id = $6::text,
             updated_at = NOW()
         WHERE id = $7::bigint`,
        [
          nextStatus,
          job.printer_id,
          deviceUsername,
          deviceJobName,
          encryptedPin,
          sentConnectorJobId,
          job.id,
        ],
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
         VALUES ($1::bigint, $2::bigint, $3::text, 'api', $4::text, $5::jsonb)`,
        [job.id, user.id, eventType, eventMessage, JSON.stringify(redactDeliveryMetadata(delivery))],
      )
      await client.query(
        `UPDATE print_logs
         SET printer_id = $1,
             device_name = $2,
             printed_at = NOW(),
             status = $3,
             updated_at = NOW()
         WHERE print_job_id = $4::bigint`,
        [
          job.printer_id,
          String(job.printer_name),
          nextStatus === 'stored_on_device' ? 'stored_on_device' : nextStatus === 'queued' ? 'queued' : 'printing',
          job.id,
        ],
      )
    })

    const storedJob = await getJobById(id, user)

    if (nextStatus === 'stored_on_device') {
      return {
        job: storedJob,
        deviceRelease: buildDeviceReleasePayload(deviceUsername, deviceJobName, pin),
      }
    }

    return {
      job: storedJob,
      deviceRelease: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Print connector failed'

    if (sentToDeviceStorage) {
      await query(
        `UPDATE print_jobs
         SET status = 'stored_on_device',
             printer_id = $1::bigint,
             release_channel = 'web',
             released_at = COALESCE(released_at, NOW()),
             final_cost = estimated_cost,
             device_storage_username = $2::text,
             device_storage_job_name = $3::text,
             device_storage_submitted_at = COALESCE(device_storage_submitted_at, NOW()),
             device_storage_pin_secret = $4::text,
             device_storage_connector_job_id = $5::text,
             failure_reason = NULL,
             updated_at = NOW()
         WHERE id = $6::bigint`,
        [job.printer_id, deviceUsername, deviceJobName, encryptedPin, sentConnectorJobId, job.id],
      )
      await query(
        `INSERT INTO print_job_events (print_job_id, actor_user_id, event_type, event_source, message, metadata)
         VALUES ($1::bigint, $2::bigint, 'submitted_to_device_storage', 'api', $3::text, $4::jsonb)`,
        [
          job.id,
          user.id,
          'Job was submitted to HP device memory; backend recovered status after a post-send update failure.',
          JSON.stringify({ recoveredFromError: message, username: deviceUsername, jobName: deviceJobName }),
        ],
      )

      return {
        job: await getJobById(id, user),
        deviceRelease: buildDeviceReleasePayload(deviceUsername, deviceJobName, pin),
      }
    }

    await query(
      `UPDATE print_jobs SET status = 'failed', failure_reason = $1::text, updated_at = NOW() WHERE id = $2::bigint`,
      [message, job.id],
    )
    await query(
      `INSERT INTO print_job_events (print_job_id, actor_user_id, event_type, event_source, message)
       VALUES ($1::bigint, $2::bigint, 'failed', 'api', $3::text)`,
      [job.id, user.id, message],
    )
    await query(
      `UPDATE print_logs
       SET status = 'failed', updated_at = NOW()
       WHERE print_job_id = $1::bigint`,
      [job.id],
    )
    throw error
  }
}

export async function releaseJob(id: string, user: AuthenticatedUser) {
  const result = await storeJobOnDevice(id, user)
  return result.job
}

export async function getDevicePin(id: string, user: AuthenticatedUser) {
  const result = await query(
    `SELECT *
     FROM print_jobs
     WHERE job_uuid::text = $1 OR id::text = $1`,
    [id],
  )
  const job = result.rows[0]

  if (!job) {
    throw new NotFoundError('Job')
  }

  if (Number(job.user_id) !== user.id && !user.roles.includes('admin')) {
    throw new ForbiddenError()
  }

  if (job.status !== 'stored_on_device') {
    throw new ValidationError(`Job status is '${job.status}', must be 'stored_on_device' to reveal device PIN`)
  }

  if (job.expires_at && new Date(String(job.expires_at)).getTime() <= Date.now()) {
    throw new ValidationError('Device PIN is no longer available because the job has expired')
  }

  if (!job.device_storage_pin_secret || !job.device_storage_username || !job.device_storage_job_name) {
    throw new NotFoundError('Device PIN')
  }

  return buildDeviceReleasePayload(
    String(job.device_storage_username),
    String(job.device_storage_job_name),
    decryptDevicePin(String(job.device_storage_pin_secret)),
  )
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
  await query(
    `UPDATE print_logs
     SET status = 'cancelled', updated_at = NOW()
     WHERE print_job_id = $1`,
    [job.id],
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
       u.username,
       u.university_id,
       u.display_name,
       jf.original_file_name,
       jf.stored_file_path,
       p.id AS printer_id,
       p.name AS printer_name,
       p.connector_type,
       p.connector_target,
       p.connector_options
     FROM print_jobs pj
     JOIN users u ON u.id = pj.user_id
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
    [userId, reservedQuotaStatuses],
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

async function inferPdfPageCount(filePath: string) {
  try {
    const pdfBytes = await fs.readFile(filePath)
    const document = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
    const pageCount = document.getPageCount()

    if (pageCount < 1) {
      throw new Error('PDF has no pages')
    }

    return pageCount
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown PDF parsing error'
    throw new ValidationError(`Could not determine PDF page count: ${reason}`)
  }
}

async function hashFile(filePath: string) {
  const buffer = await fs.readFile(filePath)
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

function buildDeviceUsername(row: Record<string, unknown>) {
  return sanitizeDeviceText('PRINTSOL_TEST', 40, 'PRINTSOL_TEST')
}

function buildDeviceJobName(row: Record<string, unknown>) {
  const uuid = String(row.job_uuid ?? row.id)
  const shortId = uuid.slice(0, 8).toUpperCase()
  const originalName = row.original_file_name
    ? String(row.original_file_name).replace(/\.[^.]+$/, '')
    : 'JOB'
  const safeName = sanitizeDeviceText(originalName, 28, 'JOB')

  return sanitizeDeviceText(`PMS-${shortId}-${safeName}`, 60, `PMS-${shortId}`)
}

function sanitizeDeviceText(value: string, maxLength: number, fallback: string) {
  const sanitized = value
    .replace(/[\r\n"]/g, ' ')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)

  return sanitized || fallback
}

function buildDeviceReleasePayload(username: string, jobName: string, pin: string) {
  return {
    username,
    jobName,
    pin,
    instructions: `On the printer, open Retrieve from Device Memory, select folder "${username}", select job "${jobName}", then enter PIN ${pin}.`,
  }
}

function readConnectorJobId(details: unknown) {
  if (details && typeof details === 'object' && 'jobId' in details) {
    return String((details as { jobId: unknown }).jobId)
  }

  return null
}

function redactDeliveryMetadata(delivery: unknown) {
  if (!delivery || typeof delivery !== 'object') {
    return {}
  }

  const record = delivery as Record<string, unknown>
  const details = record.details && typeof record.details === 'object'
    ? { ...(record.details as Record<string, unknown>) }
    : record.details

  if (details && typeof details === 'object') {
    delete (details as Record<string, unknown>).pin
  }

  return {
    ...record,
    details,
  }
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
    device_storage_username: row.device_storage_username ? String(row.device_storage_username) : null,
    device_storage_job_name: row.device_storage_job_name ? String(row.device_storage_job_name) : null,
    device_storage_submitted_at: row.device_storage_submitted_at,
  }
}
