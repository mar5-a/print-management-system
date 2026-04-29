import type { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { ValidationError } from '../lib/errors.js'

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const first = (result.error as ZodError).errors[0]
      throw new ValidationError(`${first.path.join('.')}: ${first.message}`)
    }
    req.body = result.data
    next()
  }
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      const first = (result.error as ZodError).errors[0]
      throw new ValidationError(`query.${first.path.join('.')}: ${first.message}`)
    }
    // Express 5 makes req.query read-only — store parsed params on req object instead
    ;(req as Request & { parsedQuery: unknown }).parsedQuery = result.data
    next()
  }
}
