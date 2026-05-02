import type { QueryResultRow } from 'pg'
import type { PoolClient } from 'pg'
import { query, transaction } from '../db/pool.js'
import { ConflictError, NotFoundError } from '../lib/errors.js'
import { toPublicUser } from './user-shape.js'
import type { PaginatedResult } from '../types/api.js'

type GroupPeriod = 'Weekly' | 'Monthly' | 'Semester'

interface ListGroupsFilters {
  search?: string
  page?: number
  limit?: number
}

interface ListGroupUsersFilters {
  search?: string
  page?: number
  limit?: number
}

interface GroupInput {
  name: string
  description?: string
  quotaPeriod: GroupPeriod
  initialBalance: number
  initialRestriction: boolean
  defaultForNewUsers: boolean
}

function toPublicGroup(row: QueryResultRow) {
  return {
    id: String(row.group_uuid ?? row.id),
    internal_id: Number(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : '',
    quota_period: row.quota_period as GroupPeriod,
    initial_balance: Number(row.initial_balance ?? 0),
    initial_restriction: Boolean(row.initial_restriction),
    default_for_new_users: Boolean(row.default_for_new_users),
    user_count: Number(row.user_count ?? 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

async function setSingleDefaultGroup(client: PoolClient, groupId: number) {
  await client.query('UPDATE ad_groups SET default_for_new_users = FALSE WHERE id <> $1', [groupId])
}

export async function listGroups(filters: ListGroupsFilters): Promise<PaginatedResult<ReturnType<typeof toPublicGroup>>> {
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(100, filters.limit ?? 20)
  const offset = (page - 1) * limit
  const params: unknown[] = []
  const conditions = ['TRUE']

  if (filters.search) {
    params.push(`%${filters.search}%`)
    conditions.push(`(ag.name ILIKE $${params.length} OR ag.description ILIKE $${params.length})`)
  }

  const where = conditions.join(' AND ')
  const count = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM ad_groups ag
     WHERE ${where}`,
    params,
  )

  params.push(limit, offset)
  const result = await query(
    `SELECT
        ag.*,
        COUNT(DISTINCT uagm.user_id)::int AS user_count
     FROM ad_groups ag
     LEFT JOIN user_ad_group_memberships uagm ON uagm.group_id = ag.id
     WHERE ${where}
     GROUP BY ag.id
     ORDER BY ag.name
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  )

  const total = Number(count.rows[0]?.count ?? 0)

  return {
    data: result.rows.map(toPublicGroup),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getGroupByPublicId(id: string) {
  const result = await query(
    `SELECT
        ag.*,
        COUNT(DISTINCT uagm.user_id)::int AS user_count
     FROM ad_groups ag
     LEFT JOIN user_ad_group_memberships uagm ON uagm.group_id = ag.id
     WHERE ag.group_uuid::text = $1 OR ag.id::text = $1
     GROUP BY ag.id`,
    [id],
  )

  if (!result.rows[0]) {
    throw new NotFoundError('Group')
  }

  return toPublicGroup(result.rows[0])
}

export async function listGroupUsers(
  publicId: string,
  filters: ListGroupUsersFilters,
): Promise<PaginatedResult<ReturnType<typeof toPublicUser>>> {
  const group = await getGroupByPublicId(publicId)
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(100, filters.limit ?? 20)
  const offset = (page - 1) * limit
  const params: unknown[] = [group.internal_id]
  const conditions = ['target_membership.group_id = $1']

  if (filters.search) {
    params.push(`%${filters.search}%`)
    conditions.push(
      `(u.display_name ILIKE $${params.length} OR u.username ILIKE $${params.length} OR u.email ILIKE $${params.length})`,
    )
  }

  const where = conditions.join(' AND ')
  const count = await query<{ count: string }>(
    `SELECT COUNT(DISTINCT u.id)::text AS count
     FROM users u
     JOIN user_ad_group_memberships target_membership ON target_membership.user_id = u.id
     WHERE ${where}`,
    params,
  )

  params.push(limit, offset)
  const result = await query(
    `SELECT
        u.*,
        COALESCE(array_agg(DISTINCT r.name ORDER BY r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles,
        COALESCE(array_agg(DISTINCT ag.name ORDER BY ag.name) FILTER (WHERE ag.name IS NOT NULL), '{}') AS groups,
        uq.used_pages,
        uq.allocated_pages,
        COUNT(DISTINCT pj.id) FILTER (WHERE pj.status = 'held') AS active_jobs,
        COUNT(DISTINCT pj.id) AS job_count
     FROM users u
     JOIN user_ad_group_memberships target_membership ON target_membership.user_id = u.id
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     LEFT JOIN user_ad_group_memberships uagm ON uagm.user_id = u.id
     LEFT JOIN ad_groups ag ON ag.id = uagm.group_id
     LEFT JOIN user_quotas uq ON uq.user_id = u.id
     LEFT JOIN print_jobs pj ON pj.user_id = u.id
     WHERE ${where}
     GROUP BY u.id, uq.used_pages, uq.allocated_pages
     ORDER BY u.display_name
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  )

  const total = Number(count.rows[0]?.count ?? 0)

  return {
    data: result.rows.map(toPublicUser),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function createGroup(input: GroupInput) {
  const groupUuid = await transaction(async (client) => {
    const existing = await client.query('SELECT id FROM ad_groups WHERE name = $1', [input.name])

    if (existing.rows.length > 0) {
      throw new ConflictError('Group name already exists')
    }

    const result = await client.query<{ id: number; group_uuid: string }>(
      `INSERT INTO ad_groups (
        name,
        description,
        quota_period,
        initial_balance,
        initial_restriction,
        default_for_new_users
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, group_uuid`,
      [
        input.name,
        input.description ?? '',
        input.quotaPeriod,
        input.initialBalance,
        input.initialRestriction,
        input.defaultForNewUsers,
      ],
    )

    const groupId = Number(result.rows[0].id)

    if (input.defaultForNewUsers) {
      await setSingleDefaultGroup(client, groupId)
    }

    return String(result.rows[0].group_uuid)
  })

  return getGroupByPublicId(groupUuid)
}

export async function updateGroup(publicId: string, input: GroupInput) {
  const group = await getGroupByPublicId(publicId)
  const updatedUuid = await transaction(async (client) => {
    const duplicate = await client.query(
      'SELECT id FROM ad_groups WHERE name = $1 AND id <> $2',
      [input.name, group.internal_id],
    )

    if (duplicate.rows.length > 0) {
      throw new ConflictError('Group name already exists')
    }

    const result = await client.query<{ id: number; group_uuid: string; old_name: string }>(
      `UPDATE ad_groups
       SET
         name = $1,
         description = $2,
         quota_period = $3,
         initial_balance = $4,
         initial_restriction = $5,
         default_for_new_users = $6,
         updated_at = NOW()
       WHERE id = $7
       RETURNING id, group_uuid, $8::text AS old_name`,
      [
        input.name,
        input.description ?? '',
        input.quotaPeriod,
        input.initialBalance,
        input.initialRestriction,
        input.defaultForNewUsers,
        group.internal_id,
        group.name,
      ],
    )

    const groupId = Number(result.rows[0].id)

    if (input.defaultForNewUsers) {
      await setSingleDefaultGroup(client, groupId)
    }

    if (group.name !== input.name) {
      await client.query(
        `UPDATE queue_access_rules
         SET rule_value = $1
         WHERE rule_type = 'ad_group' AND rule_value = $2`,
        [input.name, group.name],
      )
    }

    return String(result.rows[0].group_uuid)
  })

  return getGroupByPublicId(updatedUuid)
}

export async function deleteGroup(publicId: string) {
  const group = await getGroupByPublicId(publicId)

  await transaction(async (client) => {
    await client.query(
      `DELETE FROM queue_access_rules
       WHERE rule_type = 'ad_group' AND rule_value = $1`,
      [group.name],
    )
    await client.query('DELETE FROM ad_groups WHERE id = $1', [group.internal_id])
  })
}
