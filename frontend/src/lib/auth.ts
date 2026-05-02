import type { AuthUser } from '@/types/auth'
import { clearAuthToken, setAuthToken } from './api'

const AUTH_STORAGE_KEY = 'auth_user'

/**
 * Session management utilities for authentication
 * These functions handle storing and retrieving user session from localStorage
 * Easy to replace with context/state management or cookies when scaling
 */

/**
 * Save user session to localStorage
 * @param user - Authenticated user data
 */
export function login(user: AuthUser, token?: string): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
  if (token) {
    setAuthToken(token)
  }
}

/**
 * Clear user session from localStorage
 */
export function logout(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  clearAuthToken()
}

/**
 * Get current authenticated user from session
 * @returns User data or null if not authenticated
 */
export function getCurrentUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored) as AuthUser
  } catch {
    // Invalid JSON or other storage error
    return null
  }
}

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}
