export type UserRole = 'Administrator' | 'Technician' | 'Student' | 'Faculty'
export type UserStatus = 'Active' | 'Suspended'

export interface AuthUserRecord {
  id: string
  username: string
  email: string
  role: UserRole
  status: UserStatus
  password: string // temporary for mock only - remove when integrating with real auth/SSO
}

export interface AuthUser {
  id: string
  username: string
  email: string
  role: UserRole
  status: UserStatus
  displayName?: string
  department?: string
  quotaUsed?: number
  quotaTotal?: number
}

export type LoginResult = 
  | { ok: true; user: AuthUser }
  | { ok: false; reason: string }

export interface AuthContext {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
}
