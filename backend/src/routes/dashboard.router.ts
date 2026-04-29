import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import * as dashboardService from '../services/dashboard.service.js'
import { ok } from '../lib/response.js'

const router = Router()
router.use(authenticate)

// GET /api/dashboard/admin
router.get('/admin', requireRole('admin'), async (_req, res) => {
  const data = await dashboardService.getAdminDashboard()
  ok(res, data)
})

// GET /api/dashboard/tech
router.get('/tech', requireRole('admin', 'technician'), async (_req, res) => {
  const data = await dashboardService.getTechDashboard()
  ok(res, data)
})

// GET /api/dashboard/portal
router.get('/portal', async (req, res) => {
  const data = await dashboardService.getPortalDashboard(req.user!.id)
  ok(res, data)
})

export default router
