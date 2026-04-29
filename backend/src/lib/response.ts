import type { Response } from 'express'
import type { PaginatedResult } from '../types/index.js'

export function ok<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data })
}

export function paginated<T>(res: Response, result: PaginatedResult<T>) {
  return res.status(200).json({ success: true, ...result })
}

export function created<T>(res: Response, data: T) {
  return ok(res, data, 201)
}

export function noContent(res: Response) {
  return res.status(204).send()
}
