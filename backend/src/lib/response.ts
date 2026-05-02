/**
 * response.ts
 * Thin wrappers around res.json() that enforce a consistent response envelope.
 * All success responses wrap their payload in { data: ... }.
 * Paginated responses include pagination metadata alongside data.
 */
import type { Response } from 'express'
import type { PaginatedResult } from '../types/index.js'

/** 200 OK — standard success response. */
export function ok<T>(res: Response, data: T) {
  return res.status(200).json({ data })
}

/** 201 Created — resource was successfully created. */
export function created<T>(res: Response, data: T) {
  return res.status(201).json({ data })
}

/** 202 Accepted — request accepted for async processing. */
export function accepted<T>(res: Response, data: T) {
  return res.status(202).json({ data })
}

/** 204 No Content — action succeeded with nothing to return (e.g. delete). */
export function noContent(res: Response) {
  return res.status(204).send()
}

/** 200 OK — paginated list response, includes total/page/limit metadata. */
export function paginated<T>(res: Response, result: PaginatedResult<T>) {
  return res.status(200).json(result)
}
