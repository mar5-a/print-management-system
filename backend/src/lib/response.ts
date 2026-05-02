import type { Response } from 'express'
import type { PaginatedResult } from '../types/api.js'

export function ok<T>(res: Response, data: T) {
  return res.status(200).json({ data })
}

export function created<T>(res: Response, data: T) {
  return res.status(201).json({ data })
}

export function accepted<T>(res: Response, data: T) {
  return res.status(202).json({ data })
}

export function noContent(res: Response) {
  return res.status(204).send()
}

export function paginated<T>(res: Response, result: PaginatedResult<T>) {
  return res.status(200).json(result)
}
