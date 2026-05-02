import { query, transaction } from '../db/pool.js'
import { ConflictError, ForbiddenError, NotFoundError } from '../lib/errors.js'
import { hashPassword } from '../lib/jwt.js'
import { recordAuditLog, recordAuditLogWithClient } from './audit-log.service.js'
import { toPublicUser } from './user-shape.js'
import type { AuthenticatedUser, PaginatedResult, UserRole } from '../types/api.js'

interface ListUsersFilters {
  search?: string
  status?: 'active' | 'suspended'
  role?: string
  groupName?: string
  page?: number
  limit?: number
}

interface CreateUserInput {
  username: string
  email: string
  displayName: string
  universityId?: string
  password: string
  role: UserRole
  groupName?: string
  isSuspended?: boolean
  allocatedPages?: number
}

interface UpdateUserInput {
  email?: string
  displayName?: string
  role?: UserRole
  groupName?: string
  isSuspended?: boolean
  allocatedPages?: number
}

export async function listUsers(filters: ListUsersFilters): Promise<PaginatedResult<ReturnType<typeof toPublicUser>>> {
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(100, filters.limit ?? 20)
  const offset = (page - 1) * limit
  const params: unknown[] = []
  const conditions = ['TRUE']

  if (filters.search) {
    params.push(`%${filters.search}%`)
    conditions.push(`(u.username ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.display_name ILIKE $${params.length})`)
  }

  if (filters.status === 'active') {
    conditions.push('u.is_suspended = FALSE AND u.is_active = TRUE')
  } else if (filters.status === 'suspended') {
    conditions.push('u.is_suspended = TRUE')
  }

  if (filters.role) {
    params.push(filters.role)
    conditions.push(`EXISTS (
      SELECT 1
      FROM user_roles role_filter_ur
      JOIN roles role_filter_r ON role_filter_r.id = role_filter_ur.role_id
      WHERE role_filter_ur.user_id = u.id AND role_filter_r.name = $${params.length}
    )`)
  }

  if (filters.groupName) {
    params.push(filters.groupName)
    conditions.push(`EXISTS (
      SELECT 1
      FROM user_ad_group_memberships group_filter_membership
      JOIN ad_groups group_filter_group ON group_filter_group.id = group_filter_membership.group_id
      WHERE group_filter_membership.user_id = u.id AND group_filter_group.name = $${params.length}
    )`)
  }

  const where = conditions.join(' AND ')
  const count = await query<{ count: string }>(
    `SELECT COUNT(DISTINCT u.id)::text AS count FROM users u WHERE ${where}`,
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

export async function getUserByPublicId(id: string) {
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
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     LEFT JOIN user_ad_group_memberships uagm ON uagm.user_id = u.id
     LEFT JOIN ad_groups ag ON ag.id = uagm.group_id
     LEFT JOIN user_quotas uq ON uq.user_id = u.id
     LEFT JOIN print_jobs pj ON pj.user_id = u.id
     WHERE u.user_uuid::text = $1 OR u.id::text = $1
     GROUP BY u.id, uq.used_pages, uq.allocated_pages`,
    [id],
  )

  if (!result.rows[0]) {
    throw new NotFoundError('User')
  }

  return toPublicUser(result.rows[0])
}

export async function getUserInternalId(publicId: string) {
  const result = await query<{ id: number }>(
    `SELECT id FROM users WHERE user_uuid::text = $1 OR id::text = $1`,
    [publicId],
  )

  if (!result.rows[0]) {
    throw new NotFoundError('User')
  }

  return Number(result.rows[0].id)
}

async function assertUserManagementTargetIsEditable(publicId: string) {
  const target = await getUserByPublicId(publicId)

  if (target.role === 'admin') {
    throw new ForbiddenError('Administrator accounts are view-only')
  }
}

export async function listUserGroups() {
  const result = await query<{ name: string }>('SELECT name FROM ad_groups ORDER BY name')
  return result.rows.map((row) => row.name)
}

export async function createUser(input: CreateUserInput, actor?: AuthenticatedUser) {
  const userUuid = await transaction(async (client) => {
    const existing = await client.query('SELECT id FROM users WHERE username = $1 OR email = $2', [
      input.username,
      input.email,
    ])

    if (existing.rows.length > 0) {
      throw new ConflictError('Username or email already exists')
    }

    const user = await client.query<{ id: number; user_uuid: string }>(
      `INSERT INTO users (username, email, display_name, university_id, is_suspended)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_uuid`,
      [input.username, input.email, input.displayName, input.universityId ?? null, input.isSuspended ?? false],
    )
    const userId = Number(user.rows[0].id)

    await client.query(
      `INSERT INTO user_credentials (user_id, password_hash) VALUES ($1, $2)`,
      [userId, hashPassword(input.password)],
    )
    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, id FROM roles WHERE name = $2
       ON CONFLICT DO NOTHING`,
      [userId, input.role],
    )
    await client.query(
      `INSERT INTO user_quotas (user_id, quota_period, allocated_pages, used_pages)
       VALUES ($1, 'semester', $2, 0)`,
      [userId, input.allocatedPages ?? 500],
    )

    if (input.groupName) {
      const group = await client.query<{ id: number }>(
        `INSERT INTO ad_groups (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [input.groupName],
      )

      await client.query(
        `INSERT INTO user_ad_group_memberships (user_id, group_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [userId, Number(group.rows[0].id)],
      )
    }

    await recordAuditLogWithClient(client, {
      actor,
      actionCategory: 'user',
      actionType: 'create_user',
      targetType: 'user',
      targetId: String(user.rows[0].user_uuid),
      afterState: {
        username: input.username,
        email: input.email,
        displayName: input.displayName,
        role: input.role,
        groupName: input.groupName ?? null,
        isSuspended: input.isSuspended ?? false,
        allocatedPages: input.allocatedPages ?? 500,
      },
    })

    return String(user.rows[0].user_uuid)
  })

  return getUserByPublicId(userUuid)
}

export async function updateUser(publicId: string, input: UpdateUserInput, actor?: AuthenticatedUser) {
  await assertUserManagementTargetIsEditable(publicId)
  const before = await getUserByPublicId(publicId)
  const userId = await getUserInternalId(publicId)
  const fields: string[] = []
  const params: unknown[] = []

  const fieldMap = {
    email: input.email,
    display_name: input.displayName,
    is_suspended: input.isSuspended,
  }

  for (const [field, value] of Object.entries(fieldMap)) {
    if (value !== undefined) {
      params.push(value)
      fields.push(`${field} = $${params.length}`)
    }
  }

  if (fields.length > 0) {
    params.push(userId)
    await query(`UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`, params)
  }

  if (input.role) {
    await query('DELETE FROM user_roles WHERE user_id = $1', [userId])
    await query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, id FROM roles WHERE name = $2
       ON CONFLICT DO NOTHING`,
      [userId, input.role],
    )
  }

  if (input.allocatedPages !== undefined) {
    await query(
      `INSERT INTO user_quotas (user_id, quota_period, allocated_pages, used_pages)
       VALUES ($1, 'semester', $2, 0)
       ON CONFLICT (user_id, quota_period) DO UPDATE SET
         allocated_pages = EXCLUDED.allocated_pages,
         updated_at = NOW()`,
      [userId, input.allocatedPages],
    )
  }

  if (input.groupName !== undefined) {
    await transaction(async (client) => {
      const group = await client.query<{ id: number }>(
        `INSERT INTO ad_groups (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [input.groupName],
      )

      await client.query('DELETE FROM user_ad_group_memberships WHERE user_id = $1', [userId])
      await client.query(
        `INSERT INTO user_ad_group_memberships (user_id, group_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [userId, Number(group.rows[0].id)],
      )
    })
  }

  const updatedUser = await getUserByPublicId(publicId)
  await recordAuditLog({
    actor,
    actionCategory: 'user',
    actionType: 'update_user',
    targetType: 'user',
    targetId: publicId,
    beforeState: before,
    afterState: updatedUser,
  })

  return updatedUser
}

export async function suspendUser(publicId: string, actor?: AuthenticatedUser) {
  await assertUserManagementTargetIsEditable(publicId)
  const before = await getUserByPublicId(publicId)
  const userId = await getUserInternalId(publicId)
  await query('UPDATE users SET is_suspended = TRUE, updated_at = NOW() WHERE id = $1', [userId])
  await recordAuditLog({
    actor,
    actionCategory: 'user',
    actionType: 'suspend_user',
    targetType: 'user',
    targetId: publicId,
    beforeState: before,
    afterState: await getUserByPublicId(publicId),
  })
}

export async function reactivateUser(publicId: string, actor?: AuthenticatedUser) {
  await assertUserManagementTargetIsEditable(publicId)
  const before = await getUserByPublicId(publicId)
  const userId = await getUserInternalId(publicId)
  await query('UPDATE users SET is_suspended = FALSE, is_active = TRUE, updated_at = NOW() WHERE id = $1', [userId])
  await recordAuditLog({
    actor,
    actionCategory: 'user',
    actionType: 'reactivate_user',
    targetType: 'user',
    targetId: publicId,
    beforeState: before,
    afterState: await getUserByPublicId(publicId),
  })
}

export async function deleteUser(publicId: string, actor?: AuthenticatedUser) {
  await assertUserManagementTargetIsEditable(publicId)
  const before = await getUserByPublicId(publicId)
  const userId = await getUserInternalId(publicId)
  await transaction(async (client) => {
    await recordAuditLogWithClient(client, {
      actor,
      actionCategory: 'user',
      actionType: 'delete_user',
      targetType: 'user',
      targetId: publicId,
      beforeState: before,
      afterState: {
        deleted: true,
        username: before.username,
        displayName: before.display_name,
      },
    })
    await client.query('UPDATE technician_privileges SET updated_by = NULL WHERE updated_by = $1', [userId])
    await client.query('UPDATE user_quotas SET updated_by = NULL WHERE updated_by = $1', [userId])
    await client.query('UPDATE print_queues SET created_by = NULL WHERE created_by = $1', [userId])
    await client.query('UPDATE device_errors SET resolved_by = NULL WHERE resolved_by = $1', [userId])
    await client.query(
      `DELETE FROM queue_access_rules
       WHERE rule_type = 'user' AND rule_value IN ($1, $2)`,
      [String(userId), publicId],
    )
    await client.query('DELETE FROM print_jobs WHERE user_id = $1', [userId])
    await client.query('DELETE FROM users WHERE id = $1', [userId])
  })
}

export async function assertTechnicianCanManageTarget(actorRoles: UserRole[], targetPublicId: string) {
  if (!actorRoles.includes('technician') || actorRoles.includes('admin')) {
    return
  }

  const target = await getUserByPublicId(targetPublicId)

  if (target.role !== 'standard_user') {
    throw new ForbiddenError('Technicians can only manage standard user accounts')
  }
}

export function assertTechnicianCanCreateRole(actorRoles: UserRole[], role: UserRole) {
  if (!actorRoles.includes('technician') || actorRoles.includes('admin')) {
    return
  }

  if (role !== 'standard_user') {
    throw new ForbiddenError('Technicians can only create standard user accounts')
  }
}

export function assertTechnicianCanAssignRole(actorRoles: UserRole[], role?: UserRole) {
  if (!actorRoles.includes('technician') || actorRoles.includes('admin') || !role) {
    return
  }

  if (role !== 'standard_user') {
    throw new ForbiddenError('Technicians can only assign standard user access')
  }
}
