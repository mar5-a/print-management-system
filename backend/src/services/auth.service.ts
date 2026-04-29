import { query } from '../db/client.js'
import { verifyPassword, signJwt } from '../lib/jwt.js'
import { UnauthorizedError } from '../lib/errors.js'

export async function login(credential: string, password: string) {
  // Accept email or username
  const result = await query(
    `SELECT u.id, u.username, u.email, u.display_name, u.is_active, u.is_suspended,
            r.name AS role, uc.password_hash
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
     JOIN user_credentials uc ON uc.user_id = u.id
     WHERE (u.email = $1 OR u.username = $1)
       AND u.deleted_at IS NULL
     LIMIT 1`,
    [credential.toLowerCase()]
  )

  const user = result.rows[0]
  if (!user) throw new UnauthorizedError('Invalid credentials')
  if (user.is_suspended) throw new UnauthorizedError('Account suspended')
  if (!user.is_active) throw new UnauthorizedError('Account inactive')
  if (!verifyPassword(password, user.password_hash)) throw new UnauthorizedError('Invalid credentials')

  const token = signJwt({ sub: user.id, role: user.role })

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
    },
  }
}

export async function getMe(userId: string) {
  const result = await query(
    `SELECT u.id, u.username, u.email, u.display_name, u.is_active, u.is_suspended,
            r.name AS role, d.name AS department_name
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
     LEFT JOIN departments d ON d.id = u.department_id
     WHERE u.id = $1 AND u.deleted_at IS NULL`,
    [userId]
  )
  return result.rows[0] ?? null
}
