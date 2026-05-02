import { query } from '../db/pool.js'
import { UnauthorizedError } from '../lib/errors.js'
import { signJwt, verifyPassword } from '../lib/jwt.js'
import { pickPrimaryRole, toPublicUser, normalizeRoles } from './user-shape.js'
import type { UserRole } from '../types/api.js'

interface LoginOptions {
  credential: string
  password: string
  sourceIp?: string
}

export async function login({ credential, password, sourceIp }: LoginOptions) {
  const normalizedCredential = credential.trim().toLowerCase()
  const result = await query(
    `SELECT
        u.*,
        uc.password_hash,
        COALESCE(array_agg(DISTINCT r.name ORDER BY r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles,
        COALESCE(array_agg(DISTINCT ag.name ORDER BY ag.name) FILTER (WHERE ag.name IS NOT NULL), '{}') AS groups,
        uq.used_pages,
        uq.allocated_pages,
        COUNT(DISTINCT pj.id) FILTER (WHERE pj.status = 'held') AS active_jobs,
        COUNT(DISTINCT pj.id) AS job_count
     FROM users u
     LEFT JOIN user_credentials uc ON uc.user_id = u.id
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     LEFT JOIN user_ad_group_memberships uagm ON uagm.user_id = u.id
     LEFT JOIN ad_groups ag ON ag.id = uagm.group_id
     LEFT JOIN user_quotas uq ON uq.user_id = u.id
     LEFT JOIN print_jobs pj ON pj.user_id = u.id
     WHERE (LOWER(u.email) = $1 OR LOWER(u.username) = $1)
     GROUP BY u.id, uc.password_hash, uq.used_pages, uq.allocated_pages`,
    [normalizedCredential],
  )

  const user = result.rows[0]

  if (!user || !user.password_hash || !verifyPassword(password, String(user.password_hash))) {
    await logAuthAttempt(null, normalizedCredential, sourceIp, 'failure', 'Invalid credentials')
    throw new UnauthorizedError('Invalid email/username or password')
  }

  if (!user.is_active || user.is_suspended) {
    await logAuthAttempt(Number(user.id), normalizedCredential, sourceIp, 'failure', 'Inactive or suspended account')
    throw new UnauthorizedError('Your account is not allowed to sign in')
  }

  const roles = normalizeRoles(user.roles)
  const role = pickPrimaryRole(roles)
  const token = signJwt({ sub: String(user.id), role, roles })

  await logAuthAttempt(Number(user.id), normalizedCredential, sourceIp, 'success')

  return {
    token,
    user: toPublicUser(user),
  }
}

export async function getMe(userId: number) {
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
     WHERE u.id = $1
     GROUP BY u.id, uq.used_pages, uq.allocated_pages`,
    [userId],
  )

  const user = result.rows[0]
  if (!user) {
    throw new UnauthorizedError()
  }

  return toPublicUser(user)
}

async function logAuthAttempt(
  userId: number | null,
  usernameAttempted: string,
  sourceIp: string | undefined,
  result: 'success' | 'failure',
  failureReason?: string,
) {
  await query(
    `INSERT INTO auth_logs (user_id, username_attempted, source_ip, result, failure_reason)
     VALUES ($1, $2, NULLIF($3, '')::inet, $4, $5)`,
    [userId, usernameAttempted, sourceIp ?? '', result, failureReason ?? null],
  ).catch(() => {
    // Auth logging must not block login during local network/proxy oddities.
  })
}

export function roleFromApiRole(role: string): UserRole {
  if (role === 'admin' || role === 'technician' || role === 'standard_user') {
    return role
  }

  return 'standard_user'
}
