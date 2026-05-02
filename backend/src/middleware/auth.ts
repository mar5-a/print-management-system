import type { NextFunction, Request, Response } from 'express'
import { UnauthorizedError, ForbiddenError } from '../lib/errors.js'
import { verifyJwt } from '../lib/jwt.js'
import type { AuthenticatedUser, UserRole } from '../types/api.js'

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}

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
