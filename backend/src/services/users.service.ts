import { query } from '../db/client.js'
import { NotFoundError, ConflictError } from '../lib/errors.js'
import type { PaginatedResult } from '../types/index.js'

export async function listUsers(filters: {
  search?: string
  status?: 'active' | 'suspended'
  role?: string
  page?: number
  limit?: number
}): Promise<PaginatedResult<object>> {
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20))
  const offset = (page - 1) * limit

  const conditions: string[] = ['u.deleted_at IS NULL']
  const params: unknown[] = []

  if (filters.search) {
    params.push(`%${filters.search}%`)
    conditions.push(`(u.username ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.display_name ILIKE $${params.length})`)
  }
  if (filters.status === 'active') conditions.push('u.is_suspended = false AND u.is_active = true')
  if (filters.status === 'suspended') conditions.push('u.is_suspended = true')
  if (filters.role) {
    params.push(filters.role)
    conditions.push(`r.name = $${params.length}`)
  }

  const where = conditions.join(' AND ')

  const countResult = await query(
    `SELECT COUNT(*) FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
     WHERE ${where}`,
    params
  )
  const total = parseInt(countResult.rows[0].count, 10)

  params.push(limit, offset)
  const dataResult = await query(
    `SELECT u.id, u.username, u.email, u.display_name, u.is_active, u.is_suspended,
            r.name AS role, d.name AS department_name,
            uq.allocated_pages, uq.used_pages,
            u.created_at, u.updated_at
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
     LEFT JOIN departments d ON d.id = u.department_id
     LEFT JOIN user_quotas uq ON uq.user_id = u.id
     WHERE ${where}
     ORDER BY u.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )

  return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function getUserById(id: string) {
  const result = await query(
    `SELECT u.id, u.username, u.email, u.display_name, u.is_active, u.is_suspended,
            u.ad_object_id, r.name AS role, d.name AS department_name, d.id AS department_id,
            uq.allocated_pages, uq.used_pages, uq.reserved_pages, uq.quota_period, uq.reset_at,
            u.created_at, u.updated_at
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
     LEFT JOIN departments d ON d.id = u.department_id
     LEFT JOIN user_quotas uq ON uq.user_id = u.id
     WHERE u.id = $1 AND u.deleted_at IS NULL`,
    [id]
  )
  if (!result.rows[0]) throw new NotFoundError('User')
  return result.rows[0]
}

export async function createUser(data: {
  username: string
  email: string
  displayName: string
  role: string
  departmentId?: string
  passwordHash: string
  allocatedPages?: number
}) {
  // Check uniqueness
  const existing = await query(
    'SELECT id FROM users WHERE (username = $1 OR email = $2) AND deleted_at IS NULL',
    [data.username.toLowerCase(), data.email.toLowerCase()]
  )
  if (existing.rows.length) throw new ConflictError('Username or email already in use')

  const roleResult = await query('SELECT id FROM roles WHERE name = $1', [data.role])
  if (!roleResult.rows[0]) throw new NotFoundError('Role')

  const userResult = await query(
    `INSERT INTO users (username, email, display_name, department_id)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [data.username.toLowerCase(), data.email.toLowerCase(), data.displayName, data.departmentId ?? null]
  )
  const userId = userResult.rows[0].id

  await query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, roleResult.rows[0].id])
  await query('INSERT INTO user_credentials (user_id, password_hash) VALUES ($1, $2)', [userId, data.passwordHash])
  await query(
    `INSERT INTO user_quotas (user_id, allocated_pages) VALUES ($1, $2)`,
    [userId, data.allocatedPages ?? 1000]
  )

  return getUserById(userId)
}

export async function updateUser(id: string, data: {
  displayName?: string
  email?: string
  departmentId?: string
  role?: string
  allocatedPages?: number
}) {
  await getUserById(id) // throws if not found

  if (data.displayName || data.email || data.departmentId !== undefined) {
    const fields: string[] = []
    const params: unknown[] = []

    if (data.displayName) { params.push(data.displayName); fields.push(`display_name = $${params.length}`) }
    if (data.email) { params.push(data.email.toLowerCase()); fields.push(`email = $${params.length}`) }
    if (data.departmentId !== undefined) { params.push(data.departmentId || null); fields.push(`department_id = $${params.length}`) }

    params.push(id)
    await query(`UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`, params)
  }

  if (data.role) {
    const roleResult = await query('SELECT id FROM roles WHERE name = $1', [data.role])
    if (roleResult.rows[0]) {
      await query('DELETE FROM user_roles WHERE user_id = $1', [id])
      await query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [id, roleResult.rows[0].id])
    }
  }

  if (data.allocatedPages !== undefined) {
    await query(
      `INSERT INTO user_quotas (user_id, allocated_pages) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET allocated_pages = $2, updated_at = NOW()`,
      [id, data.allocatedPages]
    )
  }

  return getUserById(id)
}

export async function suspendUser(id: string) {
  await getUserById(id)
  await query('UPDATE users SET is_suspended = true, updated_at = NOW() WHERE id = $1', [id])
}

export async function reactivateUser(id: string) {
  await getUserById(id)
  await query('UPDATE users SET is_suspended = false, is_active = true, updated_at = NOW() WHERE id = $1', [id])
}

export async function deleteUser(id: string) {
  await getUserById(id)
  await query('UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1', [id])
}

export async function getUserJobs(userId: string, limit = 20, page = 1) {
  const offset = (page - 1) * limit
  const result = await query(
    `SELECT pj.*, pq.name AS queue_name, p.name AS printer_name
     FROM print_jobs pj
     JOIN print_queues pq ON pq.id = pj.queue_id
     LEFT JOIN printers p ON p.id = pj.printer_id
     WHERE pj.user_id = $1 AND pj.deleted_at IS NULL
     ORDER BY pj.submitted_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  )
  return result.rows
}
