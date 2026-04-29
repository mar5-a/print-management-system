import { api } from '@/lib/api'
import type { AdminGroup } from '@/types/admin'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGroup(g: any): AdminGroup {
  return {
    id: g.id,
    name: g.name,
    description: g.description ?? '',
    userCount: parseInt(g.user_count ?? '0', 10),
    quotaPerPeriod: 1000,
    schedule: 'Monthly',
    studentRestricted: false,
    newUserQuota: 1000,
    defaultForNewUsers: false,
    owner: '—',
  }
}

export async function listGroups(): Promise<AdminGroup[]> {
  const res = await api.get<{ data: AdminGroup[] }>('/groups')
  return res.data.map(mapGroup)
}

export async function getGroupByIdOrUndefined(groupId?: string): Promise<AdminGroup | undefined> {
  if (!groupId) return undefined
  try {
    const res = await api.get<{ data: AdminGroup }>(`/groups/${groupId}`)
    return mapGroup(res.data)
  } catch {
    return undefined
  }
}
