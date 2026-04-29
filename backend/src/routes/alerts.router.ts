import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import * as alertsService from '../services/alerts.service.js'
import { ok, created, noContent, paginated } from '../lib/response.js'

const router = Router()
router.use(authenticate)

const listSchema = z.object({
  printerId: z.string().uuid().optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  resolved: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const createSchema = z.object({
  printerId: z.string().uuid(),
  errorCode: z.string().max(50).optional(),
  severity: z.enum(['info', 'warning', 'critical']).default('warning'),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
})

// GET /api/alerts
router.get('/', requireRole('admin', 'technician'), validateQuery(listSchema), async (req, res) => {
  const filters = (req as any).parsedQuery as z.infer<typeof listSchema>
  const result = await alertsService.listAlerts(filters)
  paginated(res, result)
})

// POST /api/alerts
router.post('/', requireRole('admin', 'technician'), validateBody(createSchema), async (req, res) => {
  const alert = await alertsService.createAlert(req.body as z.infer<typeof createSchema>)
  created(res, alert)
})

// GET /api/alerts/:id
router.get('/:id', requireRole('admin', 'technician'), async (req, res) => {
  const alert = await alertsService.getAlertById(req.params.id)
  ok(res, alert)
})

// POST /api/alerts/:id/resolve
router.post('/:id/resolve', requireRole('admin', 'technician'), async (req, res) => {
  const alert = await alertsService.resolveAlert(req.params.id, req.user!.id)
  ok(res, alert)
})

// DELETE /api/alerts/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  await alertsService.deleteAlert(req.params.id)
  noContent(res)
})

export default router
