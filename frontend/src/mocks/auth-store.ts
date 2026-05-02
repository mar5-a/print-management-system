import type { AuthUser, AuthUserRecord, LoginResult } from '@/types/auth'

/**
 * Mock users for development and testing
 * When integrating with real SSO/API:
 * 1. Remove this file
 * 2. Replace validateUserCredentials with API call to your auth service
 * 3. The types and interface remain the same
 */
const mockUsers: AuthUserRecord[] = [
  {
    id: 'user-001',
    username: 'admin.user',
    email: 'admin@university.edu',
    role: 'Administrator',
    status: 'Active',
    password: '123456',
  },
  {
    id: 'user-002',
    username: 'tech.user',
    email: 'tech@university.edu',
    role: 'Technician',
    status: 'Active',
    password: '123456',
  },
  {
    id: 'user-003',
    username: 'student.user',
    email: 'student@university.edu',
    role: 'Student',
    status: 'Active',
    password: '123456',
  },
  {
    id: 'user-004',
    username: 'faculty.user',
    email: 'faculty@university.edu',
    role: 'Faculty',
    status: 'Active',
    password: '123456',
  },
  {
    id: 'user-005',
    username: 'suspended.user',
    email: 'suspended@university.edu',
    role: 'Student',
    status: 'Suspended',
    password: '123456',
  },
]

function toAuthUser(user: AuthUserRecord): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
  }
}

/**
 * Validate user credentials against mock database
 * Replace with API call to your SSO/authentication service
 *
 * @param emailOrUsername - User email or username
 * @param password - User password
 * @returns LoginResult with user data or error reason
 */
export function validateUserCredentials(
  emailOrUsername: string,
  password: string,
): LoginResult {
  // Trim whitespace
  const input = emailOrUsername.trim().toLowerCase()

  // Find user by email or username
  const user = mockUsers.find(
    (u) => u.email.toLowerCase() === input || u.username.toLowerCase() === input,
  )

  if (!user) {
    return {
      ok: false,
      reason: 'Invalid email/username or password',
    }
  }

  // Check password
  if (user.password !== password) {
    return {
      ok: false,
      reason: 'Invalid email/username or password',
    }
  }

  // Check if user is suspended
  if (user.status === 'Suspended') {
    return {
      ok: false,
      reason: 'Your account has been suspended. Please contact support.',
    }
  }

  return {
    ok: true,
    user: toAuthUser(user),
  }
}

/**
 * Get all mock users (for testing/debugging only)
 */
export function getMockUsers(): AuthUser[] {
  return mockUsers.map(toAuthUser)
}
