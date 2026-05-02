/**
 * error-handler.ts
 * Global Express error handler. Must be registered last with app.use().
 *
 * - Known AppError subclasses → returns their status code and machine-readable code.
 * - Unknown errors → returns 500 INTERNAL_ERROR (no stack traces leaked to the client).
 */
import type { ErrorRequestHandler } from 'express'
import { AppError } from '../lib/errors.js'

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    })
    return
  }

  const message = error instanceof Error ? error.message : 'Unexpected backend error'

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  })
}
