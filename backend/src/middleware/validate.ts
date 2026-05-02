import type { NextFunction, Request, Response } from 'express'
import type { z } from 'zod'
import { ValidationError } from '../lib/errors.js'

export function validateBody<T extends z.ZodType>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      next(new ValidationError(result.error.issues.map((issue) => issue.message).join('; ')))
      return
    }

    req.body = result.data
    next()
  }
}

export function validateQuery<T extends z.ZodType>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)

    if (!result.success) {
      next(new ValidationError(result.error.issues.map((issue) => issue.message).join('; ')))
      return
    }

    ;(req as Request & { parsedQuery?: unknown }).parsedQuery = result.data
    next()
  }
}
