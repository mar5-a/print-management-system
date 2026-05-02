import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import { ok } from '../lib/response.js'
import * as dashboardService from '../services/dashboard.service.js'

const router = Router()
router.use(authenticate)

router.get('/', requireRole('admin', 'technician'), async (_req, res) => {
  ok(res, await dashboardService.getDashboardSnapshot())
})

export { router as dashboardRouter }
