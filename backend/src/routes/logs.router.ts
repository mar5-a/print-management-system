import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth.js'
import { validateQuery } from '../middleware/validate.js'
import { ok } from '../lib/response.js'
import * as logsService from '../services/logs.service.js'

const router = Router()
router.use(authenticate)
router.use(requireRole('admin', 'technician'))

const rangeSchema = z.object({
  range: z.enum(['day', 'week', 'month']).optional(),
})

const operationalEventsSchema = rangeSchema.extend({
  search: z.string().optional(),
  type: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
})

router.get('/overview', validateQuery(rangeSchema), async (req, res) => {
  const filters = (req as typeof req & { parsedQuery: z.infer<typeof rangeSchema> }).parsedQuery
  ok(res, await logsService.getLogsOverview(filters))
})

router.get('/operational-events', validateQuery(operationalEventsSchema), async (req, res) => {
  const filters = (req as typeof req & { parsedQuery: z.infer<typeof operationalEventsSchema> }).parsedQuery
  ok(res, await logsService.listOperationalEvents(filters))
})

export { router as logsRouter }
