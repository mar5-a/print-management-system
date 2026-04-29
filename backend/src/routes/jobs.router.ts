import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import * as jobsService from '../services/jobs.service.js'
import { ok, created, paginated } from '../lib/response.js'

const router = Router()
router.use(authenticate)

const listSchema = z.object({
  queueId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  status: z.enum(['submitted', 'held', 'released', 'printing', 'completed', 'failed', 'cancelled', 'expired']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const submitSchema = z.object({
  queueId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  filePath: z.string().optional(),
  fileHash: z.string().optional(),
  fileSizeBytes: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
  pageCount: z.number().int().positive(),
  copyCount: z.number().int().positive().default(1),
  colorMode: z.enum(['black_white', 'color']).default('black_white'),
  duplex: z.boolean().default(true),
  paperType: z.enum(['standard', 'cardstock', 'glossy', 'envelope']).default('standard'),
})

// GET /api/jobs
router.get('/', validateQuery(listSchema), async (req, res) => {
  const filters = (req as any).parsedQuery as z.infer<typeof listSchema>

  // Standard users always filtered to their own jobs
  if (req.user!.role === 'standard_user') {
    filters.userId = req.user!.id
  }

  const result = await jobsService.listJobs({ ...filters, role: req.user!.role })
  paginated(res, result)
})

// POST /api/jobs
router.post('/', validateBody(submitSchema), async (req, res) => {
  const job = await jobsService.submitJob(req.user!.id, req.body as z.infer<typeof submitSchema>)
  created(res, job)
})

// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  const job = await jobsService.getJobById(req.params.id, req.user!.id, req.user!.role)
  ok(res, job)
})

// GET /api/jobs/:id/events
router.get('/:id/events', async (req, res) => {
  const events = await jobsService.getJobEvents(req.params.id, req.user!.id, req.user!.role)
  ok(res, events)
})

// POST /api/jobs/:id/release
router.post('/:id/release', async (req, res) => {
  const job = await jobsService.releaseJob(req.params.id, req.user!.id, req.user!.role)
  ok(res, job)
})

// POST /api/jobs/:id/cancel
router.post('/:id/cancel', async (req, res) => {
  const job = await jobsService.cancelJob(req.params.id, req.user!.id, req.user!.role)
  ok(res, job)
})

export default router
