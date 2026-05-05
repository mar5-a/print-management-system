import { query } from '../db/pool.js'

export type LogsRange = 'day' | 'week' | 'month'

interface LogsOverviewOptions {
  range?: LogsRange
}

interface ListOperationalEventsOptions {
  range?: LogsRange
  search?: string
  type?: string
  page?: number
  limit?: number
}

interface OperationalEventRow {
  id: string
  type: string
  action: string
  actor: string
  occurred_at: Date
}

export async function getLogsOverview(options: LogsOverviewOptions = {}) {
  const rangeSql = getRangeSql(options.range)
  const [printResult, eventResult] = await Promise.all([
    query<{ total_jobs: string; held_jobs: string }>(
      `SELECT
         COUNT(*)::text AS total_jobs,
         COUNT(*) FILTER (WHERE status = 'held')::text AS held_jobs
       FROM print_logs
       WHERE printed_at >= ${rangeSql}`,
    ),
    query<{ device_auth_events: string }>(
      `SELECT (
         (SELECT COUNT(*) FROM device_errors WHERE detected_at >= ${rangeSql})
         +
         (SELECT COUNT(*) FROM auth_logs WHERE created_at >= ${rangeSql})
       )::text AS device_auth_events`,
    ),
  ])

  return {
    total_jobs: Number(printResult.rows[0]?.total_jobs ?? 0),
    held_jobs: Number(printResult.rows[0]?.held_jobs ?? 0),
    device_auth_events: Number(eventResult.rows[0]?.device_auth_events ?? 0),
  }
}

export async function listOperationalEvents(options: ListOperationalEventsOptions = {}) {
  const rangeSql = getRangeSql(options.range)
  const limit = normalizeLimit(options.limit, 25)
  const page = normalizePositiveInteger(options.page, 1)
  const offset = (page - 1) * limit
  const values: unknown[] = []
  const conditions = [`occurred_at >= ${rangeSql}`]
  const search = options.search?.trim()
  const type = normalizeFilter(options.type)

  if (search) {
    values.push(`%${search}%`)
    conditions.push(`(type ILIKE $${values.length} OR action ILIKE $${values.length} OR actor ILIKE $${values.length})`)
  }

  if (type) {
    values.push(type)
    conditions.push(`type = $${values.length}`)
  }

  const whereSql = conditions.join(' AND ')
  const eventSql = getOperationalEventsSql()
  const rowValues = [...values, limit, offset]
  const [countResult, result, typeResult] = await Promise.all([
    query<{ total: string }>(
      `${eventSql}
       SELECT COUNT(*)::text AS total
       FROM events
       WHERE ${whereSql}`,
      values,
    ),
    query<OperationalEventRow>(
      `${eventSql}
       SELECT id, type, action, actor, occurred_at
       FROM events
       WHERE ${whereSql}
       ORDER BY occurred_at DESC
       LIMIT $${rowValues.length - 1} OFFSET $${rowValues.length}`,
      rowValues,
    ),
    query<{ type: string }>(
      `${eventSql}
       SELECT DISTINCT type
       FROM events
       WHERE occurred_at >= ${rangeSql}
       ORDER BY type`,
    ),
  ])
  const total = Number(countResult.rows[0]?.total ?? 0)
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return {
    rows: result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      action: row.action,
      actor: row.actor,
      time: row.occurred_at.toISOString(),
    })),
    total,
    page: Math.min(page, totalPages),
    limit,
    totalPages,
    typeOptions: typeResult.rows.map((row) => row.type),
  }
}

function getOperationalEventsSql() {
  return `WITH events AS (
       SELECT
         'audit-' || audit_logs.id::text AS id,
         initcap(replace(audit_logs.action_category, '_', ' ')) AS type,
         CASE
           WHEN audit_logs.action_type LIKE 'create_%' THEN 'Create'
           WHEN audit_logs.action_type LIKE 'update_%' THEN 'Update'
           WHEN audit_logs.action_type LIKE 'delete_%' THEN 'Delete'
           WHEN audit_logs.action_type LIKE 'suspend_%' THEN 'Suspend'
           WHEN audit_logs.action_type LIKE 'reactivate_%' THEN 'Reactivate'
           WHEN audit_logs.action_type LIKE 'review_%' THEN 'Review'
           WHEN audit_logs.action_type LIKE 'acknowledge_%' THEN 'Acknowledge'
           ELSE initcap(replace(audit_logs.action_type, '_', ' '))
         END AS action,
         COALESCE(actor.username, audit_logs.actor_role, 'system') AS actor,
         audit_logs.created_at AS occurred_at
       FROM audit_logs
       LEFT JOIN users actor ON actor.id = audit_logs.actor_user_id

       UNION ALL

       SELECT
         'job-' || print_job_events.id::text AS id,
         CASE
           WHEN print_job_events.event_type IN ('submitted', 'held') THEN 'Release'
           WHEN print_job_events.event_type IN ('released', 'completed', 'queued', 'printing') THEN 'Print'
           WHEN print_job_events.event_type IN ('failed', 'cancelled') THEN initcap(print_job_events.event_type)
           ELSE initcap(print_job_events.event_type)
         END AS type,
         initcap(replace(print_job_events.event_type, '_', ' ')) AS action,
         COALESCE(actor.username, print_job_events.event_source, 'system') AS actor,
         print_job_events.created_at AS occurred_at
       FROM print_job_events
       LEFT JOIN users actor ON actor.id = print_job_events.actor_user_id

       UNION ALL

       SELECT
         'device-' || device_errors.id::text AS id,
         'Device' AS type,
         initcap(device_errors.status) AS action,
         COALESCE(resolver.username, 'system') AS actor,
         device_errors.detected_at AS occurred_at
       FROM device_errors
       LEFT JOIN users resolver ON resolver.id = device_errors.resolved_by

       UNION ALL

       SELECT
         'auth-' || auth_logs.id::text AS id,
         'Auth' AS type,
         initcap(auth_logs.result) AS action,
         COALESCE(actor.username, auth_logs.username_attempted, 'system') AS actor,
         auth_logs.created_at AS occurred_at
       FROM auth_logs
       LEFT JOIN users actor ON actor.id = auth_logs.user_id
     )`
}

function getRangeSql(range: LogsRange = 'week') {
  if (range === 'day') {
    return `NOW() - INTERVAL '24 hours'`
  }

  if (range === 'month') {
    return `NOW() - INTERVAL '30 days'`
  }

  return `NOW() - INTERVAL '7 days'`
}

function normalizeLimit(value: number | undefined, fallback: number) {
  if (!value || !Number.isFinite(value) || value < 1) {
    return fallback
  }

  return Math.min(100, Math.floor(value))
}

function normalizePositiveInteger(value: number | undefined, fallback: number) {
  if (!value || !Number.isFinite(value) || value < 1) {
    return fallback
  }

  return Math.floor(value)
}

function normalizeFilter(value?: string) {
  const trimmed = value?.trim()

  if (!trimmed || trimmed === 'all') {
    return undefined
  }

  return trimmed
}
