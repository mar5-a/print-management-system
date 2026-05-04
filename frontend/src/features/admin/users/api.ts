import { api } from '@/lib/api'
import type { AdminUser } from '@/types/admin'

export interface BackendUser {
  id: string
  username: string
  email: string
  display_name: string
  role: 'admin' | 'technician' | 'standard_user'
  groups?: string[]
  is_suspended: boolean
  quota_used: number
  quota_total: number
  job_count: number
}

export type NewUserRole = 'Administrator' | 'Technician' | 'Student'

export interface CreateUserInput {
  username: string
  displayName: string
  email: string
  groupName: string
  role: NewUserRole
  status: 'Active' | 'Suspended'
  restricted: boolean
  balance: number
}

export interface UpdateUserInput {
  displayName: string
  email: string
  groupName: string
  role: AdminUser['role']
  status: AdminUser['status']
  restricted: boolean
  allocatedPages: number
}

interface PaginatedUsers {
  data: BackendUser[]
}

interface ApiData<T> {
  data: T
}

export interface ListUsersInput {
  search?: string
  status?: 'active' | 'suspended'
  role?: AdminUser['role'] | 'All roles'
  groupName?: string
  limit?: number
}

export async function listUsers(input: ListUsersInput = {}) {
  const params = new URLSearchParams()
  const search = input.search?.trim()

  params.set('limit', String(input.limit ?? 100))

  if (search) {
    params.set('search', search)
  }

  if (input.status) {
    params.set('status', input.status)
  }

  if (input.role && input.role !== 'All roles') {
    params.set('role', mapRoleFilterToBackend(input.role))
  }

  if (input.groupName) {
    params.set('groupName', input.groupName)
  }

  const response = await api.get<PaginatedUsers>(`/users?${params.toString()}`)
  return response.data.map(mapUser)
}

export async function listUserGroups() {
  const response = await api.get<ApiData<string[]>>('/users/groups')
  return response.data
}

export async function createUser(input: CreateUserInput) {
  const response = await api.post<ApiData<BackendUser>>('/users', {
    username: input.username.trim(),
    displayName: input.displayName.trim(),
    email: input.email.trim(),
    password: '123456',
    role: mapRoleToBackend(input.role),
    groupName: input.groupName,
    isSuspended: input.restricted || input.status === 'Suspended',
    allocatedPages: input.balance,
  })

  return mapUser(response.data)
}

export async function updateUser(userId: string, input: UpdateUserInput) {
  const response = await api.patch<ApiData<BackendUser>>(`/users/${userId}`, {
    displayName: input.displayName.trim(),
    email: input.email.trim(),
    role: mapRoleToBackend(input.role),
    groupName: input.groupName,
    isSuspended: input.restricted || input.status === 'Suspended',
    allocatedPages: input.allocatedPages,
  })

  return mapUser(response.data)
}

export async function deleteUser(userId: string) {
  await api.delete<void>(`/users/${userId}`)
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

function mapRoleToBackend(role: AdminUser['role']): BackendUser['role'] {
  if (role === 'Administrator') return 'admin'
  if (role === 'Technician') return 'technician'
  return 'standard_user'
}

function mapRoleFilterToBackend(role: AdminUser['role']) {
  if (role === 'Administrator') return 'admin'
  if (role === 'Technician') return 'technician'
  if (role === 'Faculty') return 'faculty'
  return 'standard_user'
}

export function mapUser(user: BackendUser): AdminUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    email: user.email,
    role: mapRole(user.role),
    office: '-',
    status: user.is_suspended ? 'Suspended' : 'Active',
    quotaUsed: user.quota_used,
    quotaTotal: user.quota_total,
    groups: user.groups ?? [],
    cardId: '-',
    primaryIdentity: user.username.toUpperCase(),
    secondaryIdentity: '-',
    notes: '',
    lastSeen: '-',
    jobCount: user.job_count,
  }
}
