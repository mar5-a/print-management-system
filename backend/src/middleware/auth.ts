import type { Request, Response, NextFunction } from 'express'
import { verifyJwt } from '../lib/jwt.js'
import { UnauthorizedError, ForbiddenError } from '../lib/errors.js'
import type { AuthenticatedUser } from '../types/index.js'

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) throw new UnauthorizedError('Missing auth token')

  const token = auth.slice(7)
  const payload = verifyJwt(token)
  req.user = { id: payload.sub, role: payload.role }
  next()
}

export function requireRole(...roles: AuthenticatedUser['role'][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new UnauthorizedError()
    if (!roles.includes(req.user.role)) throw new ForbiddenError('Insufficient permissions')
    next()
  }
}
