import { api } from '@/lib/api'
import type { AdminGroup } from '@/types/admin'
import { mapUser, type BackendUser } from '../users/api'

interface BackendGroup {
  id: string
  name: string
  description: string
  quota_period: AdminGroup['schedule']
  initial_balance: number
  initial_restriction: boolean
  default_for_new_users: boolean
  user_count: number
}

interface PaginatedGroups {
  data: BackendGroup[]
}

interface PaginatedGroupUsers {
  data: BackendUser[]
}

interface ApiData<T> {
  data: T
}

export interface ListGroupsInput {
  search?: string
  limit?: number
}

export interface ListGroupUsersInput {
  search?: string
  limit?: number
}

export interface GroupMutationInput {
  name: string
  description: string
  schedule: AdminGroup['schedule']
  quotaPerPeriod: number
  studentRestricted: boolean
  defaultForNewUsers: boolean
}

export async function listGroups(input: ListGroupsInput = {}) {
  const params = new URLSearchParams()
  const search = input.search?.trim()

  params.set('limit', String(input.limit ?? 100))

  if (search) {
    params.set('search', search)
  }

  const response = await api.get<PaginatedGroups>(`/groups?${params.toString()}`)
  return response.data.map(mapGroup)
}

export async function getGroupByIdOrUndefined(groupId?: string) {
  if (!groupId) return undefined

  try {
    const response = await api.get<ApiData<BackendGroup>>(`/groups/${groupId}`)
    return mapGroup(response.data)
  } catch {
    return undefined
  }
}

export async function createGroup(input: GroupMutationInput) {
  const response = await api.post<ApiData<BackendGroup>>('/groups', toBackendInput(input))
  return mapGroup(response.data)
}

export async function updateGroup(groupId: string, input: GroupMutationInput) {
  const response = await api.patch<ApiData<BackendGroup>>(`/groups/${groupId}`, toBackendInput(input))
  return mapGroup(response.data)
}

export async function deleteGroup(groupId: string) {
  await api.delete<void>(`/groups/${groupId}`)
}

export async function listGroupUsers(groupId: string, input: ListGroupUsersInput = {}) {
  const params = new URLSearchParams()
  const search = input.search?.trim()

  params.set('limit', String(input.limit ?? 100))

  if (search) {
    params.set('search', search)
  }

  const response = await api.get<PaginatedGroupUsers>(`/groups/${groupId}/users?${params.toString()}`)
  return response.data.map(mapUser)
}

function toBackendInput(input: GroupMutationInput) {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    quotaPeriod: input.schedule,
    initialBalance: input.quotaPerPeriod,
    initialRestriction: input.studentRestricted,
    defaultForNewUsers: input.defaultForNewUsers,
  }
}

function mapGroup(group: BackendGroup): AdminGroup {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    userCount: group.user_count,
    quotaPerPeriod: group.initial_balance,
    schedule: group.quota_period,
    studentRestricted: group.initial_restriction,
    defaultForNewUsers: group.default_for_new_users,
    owner: 'System',
  }
}
