/**
 * validate.ts
 * Express middleware factories for Zod schema validation.
 * On failure, forwards a ValidationError to the error handler instead of
 * letting invalid data reach the route handler.
 */
import type { NextFunction, Request, Response } from 'express'
import type { z } from 'zod'
import { ValidationError } from '../lib/errors.js'

/** Validate req.body against a Zod schema. Replaces req.body with the parsed (typed) value on success. */
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

/** Validate req.query against a Zod schema. Attaches the parsed value to req.parsedQuery on success. */
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
