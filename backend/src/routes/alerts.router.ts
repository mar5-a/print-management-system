import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth.js'
import { ok } from '../lib/response.js'
import { validateQuery } from '../middleware/validate.js'
import * as alertsService from '../services/alerts.service.js'

const router = Router()
router.use(authenticate)
router.use(requireRole('admin', 'technician'))

const listSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'acknowledged', 'all']).default('all'),
  severity: z.enum(['critical', 'warning', 'info']).optional(),
})

router.get('/', validateQuery(listSchema), async (req, res) => {
  const filters = (req as typeof req & { parsedQuery: z.infer<typeof listSchema> }).parsedQuery
  ok(res, await alertsService.listAlerts(filters))
})

router.get('/:id', async (req, res) => {
  ok(res, await alertsService.getAlertById(req.params.id))
})

router.post('/:id/acknowledge', async (req, res) => {
  ok(res, await alertsService.acknowledgeAlert(req.params.id, req.user!.id))
})

export { router as alertsRouter }
