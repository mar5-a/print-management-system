import { api } from '@/lib/api'
import type { AdminUser } from '@/types/admin'

interface BackendUser {
  id: string
  username: string
  email: string
  display_name: string
  department_name: string | null
  role: 'admin' | 'technician' | 'standard_user'
  is_suspended: boolean
  quota_used: number
  quota_total: number
  job_count: number
}

interface PaginatedUsers {
  data: BackendUser[]
}

interface ApiData<T> {
  data: T
}

export async function listUsers() {
  const response = await api.get<PaginatedUsers>('/users?limit=100')
  return response.data.map(mapUser)
}

export async function getUserByIdOrUndefined(userId?: string) {
  if (!userId) return undefined

  try {
    const response = await api.get<ApiData<BackendUser>>(`/users/${userId}`)
    return mapUser(response.data)
  } catch {
    return undefined
  }
}

function mapRole(role: BackendUser['role']): AdminUser['role'] {
  if (role === 'admin') return 'Administrator'
  if (role === 'technician') return 'Technician'
  return 'Student'
}

function mapUser(user: BackendUser): AdminUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    email: user.email,
    role: mapRole(user.role),
    department: user.department_name ?? 'General Access',
    office: '—',
    status: user.is_suspended ? 'Suspended' : 'Active',
    quotaUsed: user.quota_used,
    quotaTotal: user.quota_total,
    groups: [],
    cardId: '—',
    primaryIdentity: user.username.toUpperCase(),
    secondaryIdentity: '—',
    notes: '',
    lastSeen: '—',
    jobCount: user.job_count,
  }
}
