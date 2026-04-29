import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import * as queuesService from '../services/queues.service.js'
import { ok, created, paginated } from '../lib/response.js'

const router = Router()
router.use(authenticate)

const listSchema = z.object({
  status: z.enum(['online', 'offline', 'error', 'maintenance']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const createSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  releaseMode: z.enum(['secure_release', 'immediate']).default('secure_release'),
  audience: z.enum(['students', 'faculty', 'staff', 'mixed']).default('mixed'),
  departmentId: z.string().uuid().optional(),
  retentionHours: z.number().int().positive().default(24),
  costPerPage: z.number().positive().default(0.05),
  printerIds: z.array(z.string().uuid()).default([]),
})

const updateSchema = createSchema.partial().extend({
  status: z.enum(['online', 'offline', 'error', 'maintenance']).optional(),
  enabled: z.boolean().optional(),
})

// GET /api/queues
router.get('/', validateQuery(listSchema), async (req, res) => {
  const result = await queuesService.listQueues((req as any).parsedQuery as z.infer<typeof listSchema>)
  paginated(res, result)
})

// POST /api/queues
router.post('/', requireRole('admin'), validateBody(createSchema), async (req, res) => {
  const queue = await queuesService.createQueue({ ...req.body, createdBy: req.user!.id })
  created(res, queue)
})

// GET /api/queues/:id
router.get('/:id', async (req, res) => {
  const queue = await queuesService.getQueueById(req.params.id)
  ok(res, queue)
})

// PATCH /api/queues/:id
router.patch('/:id', requireRole('admin'), validateBody(updateSchema), async (req, res) => {
  const queue = await queuesService.updateQueue(req.params.id, req.body as z.infer<typeof updateSchema>)
  ok(res, queue)
})

// DELETE /api/queues/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const queue = await queuesService.deleteQueue(req.params.id)
  ok(res, queue)
})

// GET /api/queues/:id/jobs
router.get('/:id/jobs', requireRole('admin', 'technician'), async (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const jobs = await queuesService.getQueueJobs(req.params.id, page, limit)
  ok(res, jobs)
})

export default router
