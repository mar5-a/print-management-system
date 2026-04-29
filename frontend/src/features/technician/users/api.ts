import { api } from '@/lib/api'
import type { AdminUser } from '@/types/admin'

function mapRole(role: string): AdminUser['role'] {
  if (role === 'admin') return 'Administrator'
  if (role === 'technician') return 'Technician'
  return 'Student'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUser(u: any): AdminUser {
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    email: u.email,
    role: mapRole(u.role),
    department: u.department_name ?? '—',
    office: '—',
    status: u.is_suspended ? 'Suspended' : 'Active',
    quotaUsed: Number(u.used_pages ?? 0),
    quotaTotal: Number(u.allocated_pages ?? 1000),
    groups: [],
    cardId: '—',
    primaryIdentity: u.username.toUpperCase(),
    secondaryIdentity: '—',
    notes: '',
    lastSeen: '—',
    jobCount: 0,
  }
}

export async function listTechUsers(): Promise<AdminUser[]> {
  const res = await api.get<{ data: AdminUser[] }>('/users?limit=100')
  return res.data.map(mapUser)
}

export async function getTechUserOrUndefined(userId?: string): Promise<AdminUser | undefined> {
  if (!userId) return undefined
  try {
    const res = await api.get<{ data: AdminUser }>(`/users/${userId}`)
    return mapUser(res.data)
  } catch {
    return undefined
  }
}

export async function setTechUserStatus(userId: string, status: 'Active' | 'Suspended'): Promise<void> {
  const endpoint = status === 'Suspended' ? 'suspend' : 'reactivate'
  await api.post(`/users/${userId}/${endpoint}`, {})
}

export async function updateTechUserQuota(userId: string, quotaTotal: number): Promise<void> {
  await api.patch(`/users/${userId}/quota`, { allocatedPages: quotaTotal })
}
