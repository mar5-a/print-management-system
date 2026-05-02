import type { QueryResultRow } from 'pg'
import type { UserRole } from '../types/api.js'

const rolePriority: UserRole[] = ['admin', 'technician', 'standard_user']

export function pickPrimaryRole(roles: UserRole[]): UserRole {
  return rolePriority.find((role) => roles.includes(role)) ?? 'standard_user'
}

export function normalizeRoles(value: unknown): UserRole[] {
  if (!Array.isArray(value)) {
    return ['standard_user']
  }

  const roles = value.filter((role): role is UserRole =>
    role === 'admin' || role === 'technician' || role === 'standard_user',
  )

  return roles.length > 0 ? roles : ['standard_user']
}

export function toPublicUser(row: QueryResultRow) {
  const roles = normalizeRoles(row.roles)
  const groups = Array.isArray(row.groups) ? row.groups.map(String) : []

  return {
    id: String(row.user_uuid ?? row.id),
    internal_id: Number(row.id),
    username: String(row.username),
    email: row.email ? String(row.email) : '',
    display_name: String(row.display_name),
    university_id: row.university_id ? String(row.university_id) : null,
    roles,
    groups,
    role: pickPrimaryRole(roles),
    is_active: Boolean(row.is_active),
    is_suspended: Boolean(row.is_suspended),
    quota_used: Number(row.used_pages ?? 0),
    quota_total: Number(row.allocated_pages ?? 0),
    active_jobs: Number(row.active_jobs ?? 0),
    job_count: Number(row.job_count ?? 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
