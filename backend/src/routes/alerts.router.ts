import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import { ok } from '../lib/response.js'
import * as alertsService from '../services/alerts.service.js'

const router = Router()
router.use(authenticate)
router.use(requireRole('admin', 'technician'))

router.get('/', async (_req, res) => {
  ok(res, await alertsService.listAlerts())
})

router.get('/:id', async (req, res) => {
  ok(res, await alertsService.getAlertById(req.params.id))
})

router.post('/:id/acknowledge', async (req, res) => {
  ok(res, await alertsService.acknowledgeAlert(req.params.id, req.user!.id))
})

export { router as alertsRouter }
