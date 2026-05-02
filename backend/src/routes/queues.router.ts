import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import { created, noContent, ok, paginated } from '../lib/response.js'
import * as queuesService from '../services/queues.service.js'

const router = Router()
router.use(authenticate)

const listSchema = z.object({
  status: z.enum(['active', 'disabled', 'archived']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const queueSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().optional(),
  status: z.enum(['active', 'disabled', 'archived']).optional(),
  queueType: z.enum(['standard', 'student', 'staff', 'faculty', 'mixed', 'other']).optional(),
  releaseMode: z.enum(['secure_release', 'immediate']).optional(),
  retentionHours: z.number().int().positive().optional(),
  printerIds: z.array(z.string()).optional(),
  costPerPage: z.number().min(0).optional(),
})

router.get('/', validateQuery(listSchema), async (req, res) => {
  const filters = (req as typeof req & { parsedQuery: z.infer<typeof listSchema> }).parsedQuery
  paginated(res, await queuesService.listQueues(filters))
})

router.get('/eligible/mine', async (req, res) => {
  ok(res, await queuesService.listEligibleQueuesForUser(req.user!.id))
})

router.post('/', requireRole('admin'), validateBody(queueSchema), async (req, res) => {
  created(res, await queuesService.createQueue(req.body as z.infer<typeof queueSchema>, req.user!.id))
})

router.get('/:id', async (req, res) => {
  ok(res, await queuesService.getQueueById(String(req.params.id)))
})

router.patch('/:id', requireRole('admin'), validateBody(queueSchema.partial()), async (req, res) => {
  ok(res, await queuesService.updateQueue(String(req.params.id), req.body as z.infer<typeof queueSchema>))
})

router.delete('/:id', requireRole('admin'), async (req, res) => {
  await queuesService.deleteQueue(String(req.params.id))
  noContent(res)
})

export { router as queuesRouter }
