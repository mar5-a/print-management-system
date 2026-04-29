import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../lib/errors.js'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    })
  }

  // JWT errors
  if (err instanceof Error && (err.message === 'Token expired' || err.message === 'Invalid signature' || err.message === 'Malformed token')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: err.message },
    })
  }

  // Unknown errors - don't leak internals
  console.error('Unhandled error:', err)
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  })
}
