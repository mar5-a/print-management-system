import fs from 'node:fs/promises'
import { query, transaction } from '../db/pool.js'

interface CleanupResult {
  expiredJobs: number
  deletedFiles: number
  failedFiles: number
}

interface CleanupFileRow {
  id: string
  print_job_id: string
  stored_file_path: string
}

const expirableStatuses = [
  'held',
  'failed',
  'submitting_to_device_storage',
  'stored_on_device',
  'queued',
  'printing',
  'blocked',
]

export async function cleanupExpiredJobsAndFiles(): Promise<CleanupResult> {
  const expiredJobs = await markExpiredJobs()
  const files = await listCleanupCandidates()
  let deletedFiles = 0
  let failedFiles = 0

  for (const file of files) {
    const deleted = await deleteJobFile(file)

    if (deleted) {
      deletedFiles += 1
    } else {
      failedFiles += 1
    }
  }

  return {
    expiredJobs,
    deletedFiles,
    failedFiles,
  }
}

async function markExpiredJobs() {
  return transaction(async (client) => {
    const result = await client.query<{ id: string }>(
      `UPDATE print_jobs
       SET status = 'expired',
           failure_reason = COALESCE(failure_reason, 'Job expired before completion or confirmed release.'),
           updated_at = NOW()
       WHERE expires_at <= NOW()
         AND status = ANY($1::text[])
       RETURNING id`,
      [expirableStatuses],
    )
    const ids = result.rows.map((row) => Number(row.id))

    if (ids.length > 0) {
      await client.query(
        `INSERT INTO print_job_events (print_job_id, actor_user_id, event_type, event_source, message, metadata)
         SELECT id, NULL, 'expired', 'cleanup_worker', 'Job expired after its queue retention window.', '{}'::jsonb
         FROM unnest($1::bigint[]) AS id`,
        [ids],
      )
    }

    return ids.length
  })
}

async function listCleanupCandidates() {
  const result = await query<CleanupFileRow>(
    `SELECT jf.id::text, jf.print_job_id::text, jf.stored_file_path
     FROM job_files jf
     JOIN print_jobs pj ON pj.id = jf.print_job_id
     WHERE jf.deleted_at IS NULL
       AND (
         pj.status IN ('completed', 'cancelled', 'expired')
         OR pj.expires_at <= NOW()
       )
     ORDER BY jf.created_at
     LIMIT 200`,
  )

  return result.rows
}

async function deleteJobFile(file: CleanupFileRow) {
  try {
    await fs.unlink(file.stored_file_path)
  } catch (error) {
    if (!isMissingFileError(error)) {
      await query(
        `INSERT INTO print_job_events (print_job_id, actor_user_id, event_type, event_source, message, metadata)
         VALUES ($1::bigint, NULL, 'file_cleanup_failed', 'cleanup_worker', 'Stored file cleanup failed.', $2::jsonb)`,
        [
          file.print_job_id,
          JSON.stringify({
            jobFileId: file.id,
            path: file.stored_file_path,
            error: error instanceof Error ? error.message : 'Unknown file deletion error',
          }),
        ],
      )
      return false
    }
  }

  await transaction(async (client) => {
    await client.query(
      `UPDATE job_files
       SET deleted_at = NOW()
       WHERE id = $1::bigint
         AND deleted_at IS NULL`,
      [file.id],
    )
    await client.query(
      `INSERT INTO print_job_events (print_job_id, actor_user_id, event_type, event_source, message, metadata)
       VALUES ($1::bigint, NULL, 'file_deleted', 'cleanup_worker', 'Stored job file deleted after retention cleanup.', $2::jsonb)`,
      [
        file.print_job_id,
        JSON.stringify({
          jobFileId: file.id,
          path: file.stored_file_path,
        }),
      ],
    )
  })

  return true
}

function isMissingFileError(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
}
