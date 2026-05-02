export type UserRole = 'admin' | 'technician' | 'standard_user'

export interface AuthenticatedUser {
  id: number
  role: UserRole
  roles: UserRole[]
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
