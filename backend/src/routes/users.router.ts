import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import * as usersService from '../services/users.service.js'
import { hashPassword } from '../lib/jwt.js'
import { ok, created, noContent, paginated } from '../lib/response.js'

const router = Router()
router.use(authenticate)

const listSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'suspended']).optional(),
  role: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const createSchema = z.object({
  username: z.string().min(2).max(64),
  email: z.string().email(),
  displayName: z.string().min(1).max(255),
  password: z.string().min(6),
  role: z.enum(['admin', 'technician', 'standard_user']).default('standard_user'),
  departmentId: z.string().uuid().optional(),
  allocatedPages: z.number().int().positive().optional(),
})

const updateSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  allocatedPages: z.number().int().positive().optional(),
})

// GET /api/users
router.get('/', requireRole('admin', 'technician'), validateQuery(listSchema), async (req, res) => {
  const result = await usersService.listUsers((req as any).parsedQuery as z.infer<typeof listSchema>)
  paginated(res, result)
})

// POST /api/users
router.post('/', requireRole('admin'), validateBody(createSchema), async (req, res) => {
  const body = req.body as z.infer<typeof createSchema>
  const passwordHash = hashPassword(body.password)
  const user = await usersService.createUser({ ...body, passwordHash })
  created(res, user)
})

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  // Users can fetch themselves; admins/techs can fetch anyone
  const targetId = req.params.id === 'me' ? req.user!.id : req.params.id
  const user = await usersService.getUserById(targetId)
  ok(res, user)
})

// PATCH /api/users/:id
router.patch('/:id', requireRole('admin'), validateBody(updateSchema), async (req, res) => {
  const user = await usersService.updateUser(req.params.id, req.body as z.infer<typeof updateSchema>)
  ok(res, user)
})

// POST /api/users/:id/suspend
router.post('/:id/suspend', requireRole('admin', 'technician'), async (req, res) => {
  await usersService.suspendUser(req.params.id)
  ok(res, { message: 'User suspended' })
})

// POST /api/users/:id/reactivate
router.post('/:id/reactivate', requireRole('admin', 'technician'), async (req, res) => {
  await usersService.reactivateUser(req.params.id)
  ok(res, { message: 'User reactivated' })
})

// PATCH /api/users/:id/quota — technician can adjust quota
const quotaSchema = z.object({ allocatedPages: z.number().int().min(0) })
router.patch('/:id/quota', requireRole('admin', 'technician'), validateBody(quotaSchema), async (req, res) => {
  const body = req.body as z.infer<typeof quotaSchema>
  const user = await usersService.updateUser(req.params.id, { allocatedPages: body.allocatedPages })
  ok(res, user)
})

// DELETE /api/users/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  await usersService.deleteUser(req.params.id)
  noContent(res)
})

// GET /api/users/:id/jobs
router.get('/:id/jobs', requireRole('admin', 'technician'), async (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const jobs = await usersService.getUserJobs(req.params.id, limit, page)
  ok(res, jobs)
})

export default router
