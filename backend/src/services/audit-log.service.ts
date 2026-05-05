import { query } from '../db/pool.js'
import type { AuthenticatedUser } from '../types/api.js'

type QueryExecutor = {
  query: (text: string, values?: unknown[]) => Promise<unknown>
}

interface AuditLogInput {
  actor?: AuthenticatedUser
  actionCategory: string
  actionType: string
  targetType: string
  targetId?: string | null
  reason?: string | null
  beforeState?: unknown
  afterState?: unknown
}

export async function recordAuditLog(input: AuditLogInput) {
  await insertAuditLog({ query }, input)
}

export async function recordAuditLogWithClient(client: QueryExecutor, input: AuditLogInput) {
  await insertAuditLog(client, input)
}

async function insertAuditLog(client: QueryExecutor, input: AuditLogInput) {
  await client.query(
    `INSERT INTO audit_logs (
       actor_user_id,
       actor_role,
       action_category,
       action_type,
       target_type,
       target_id,
       reason,
       before_state,
       after_state
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)`,
    [
      input.actor?.id ?? null,
      input.actor?.role ?? null,
      input.actionCategory,
      input.actionType,
      input.targetType,
      input.targetId ?? null,
      input.reason ?? null,
      serializeState(input.beforeState),
      serializeState(input.afterState),
    ],
  )
}

function serializeState(value: unknown) {
  return value === undefined ? null : JSON.stringify(value)
}
