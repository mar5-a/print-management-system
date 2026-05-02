/**
 * auth.ts
 * Express middleware for JWT authentication and role-based access control.
 *
 * Usage:
 *   router.use(authenticate)                        — require a valid JWT on every route
 *   router.post('/', requireRole('admin'), ...)     — additionally restrict to admins
 */
import type { NextFunction, Request, Response } from 'express'
import { UnauthorizedError, ForbiddenError } from '../lib/errors.js'
import { verifyJwt } from '../lib/jwt.js'
import type { AuthenticatedUser, UserRole } from '../types/index.js'

// Extend Express's Request type so req.user is available throughout the app
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}

/**
 * Reads the Bearer token from the Authorization header, verifies it,
 * and attaches the decoded user to req.user. Calls next(UnauthorizedError)
 * if the token is missing or invalid.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing auth token')
    }

    const payload = verifyJwt(header.slice('Bearer '.length))
    req.user = {
      id: Number(payload.sub),
      role: payload.role,
      roles: payload.roles,
    }

    next()
  } catch {
    next(new UnauthorizedError('Invalid auth token'))
  }
}

/**
 * Returns middleware that allows only users whose roles include at least
 * one of the specified allowedRoles. Must be used after authenticate().
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new UnauthorizedError())
      return
    }

    if (!req.user.roles.some((role) => allowedRoles.includes(role))) {
      next(new ForbiddenError('Insufficient permissions'))
      return
    }

    next()
  }
}
