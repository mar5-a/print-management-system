import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import { ok } from '../lib/response.js'
import * as dashboardService from '../services/dashboard.service.js'

const router = Router()
router.use(authenticate)

router.get('/', requireRole('admin', 'technician'), async (_req, res) => {
  ok(res, await dashboardService.getDashboardSnapshot())
})

router.get('/technician', requireRole('admin', 'technician'), async (_req, res) => {
  ok(res, await dashboardService.getTechnicianDashboardSnapshot())
})

router.get('/print-logs', requireRole('admin', 'technician'), async (req, res) => {
  ok(res, await dashboardService.listRecentPrintLogs({
    search: getQueryString(req.query.search),
    status: getQueryString(req.query.status),
    device: getQueryString(req.query.device),
    page: getQueryNumber(req.query.page),
    limit: getQueryNumber(req.query.limit),
  }))
})

router.get('/print-activity', requireRole('admin', 'technician'), async (req, res) => {
  ok(res, await dashboardService.getPrintActivity(getActivityRange(req.query.range)))
})

export { router as dashboardRouter }

function getQueryString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function getQueryNumber(value: unknown) {
  if (typeof value !== 'string') {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function getActivityRange(value: unknown) {
  return value === 'month' ? 'month' : 'week'
}
