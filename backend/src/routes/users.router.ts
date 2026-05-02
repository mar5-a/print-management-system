import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import { created, noContent, ok, paginated } from '../lib/response.js'
import * as usersService from '../services/users.service.js'

const router = Router()
router.use(authenticate)

const listSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['active', 'suspended']).optional(),
  role: z.enum(['admin', 'technician', 'standard_user']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const createSchema = z.object({
  username: z.string().min(2).max(120),
  email: z.string().email(),
  displayName: z.string().min(1).max(255),
  universityId: z.string().max(64).optional(),
  password: z.string().min(6),
  role: z.enum(['admin', 'technician', 'standard_user']).default('standard_user'),
  departmentId: z.coerce.number().int().positive().optional(),
  allocatedPages: z.number().int().min(0).optional(),
})

const updateSchema = z.object({
  email: z.string().email().optional(),
  displayName: z.string().min(1).max(255).optional(),
  role: z.enum(['admin', 'technician', 'standard_user']).optional(),
  departmentId: z.coerce.number().int().positive().nullable().optional(),
  allocatedPages: z.number().int().min(0).optional(),
})

router.get('/', requireRole('admin', 'technician'), validateQuery(listSchema), async (req, res) => {
  const filters = (req as typeof req & { parsedQuery: z.infer<typeof listSchema> }).parsedQuery
  paginated(res, await usersService.listUsers(filters))
})

router.post('/', requireRole('admin'), validateBody(createSchema), async (req, res) => {
  created(res, await usersService.createUser(req.body as z.infer<typeof createSchema>))
})

router.get('/:id', async (req, res) => {
  const id = String(req.params.id) === 'me' ? String(req.user!.id) : String(req.params.id)
  ok(res, await usersService.getUserByPublicId(id))
})

router.patch('/:id', requireRole('admin'), validateBody(updateSchema), async (req, res) => {
  ok(res, await usersService.updateUser(String(req.params.id), req.body as z.infer<typeof updateSchema>))
})

router.post('/:id/suspend', requireRole('admin', 'technician'), async (req, res) => {
  await usersService.assertTechnicianCanManageTarget(req.user!.roles, String(req.params.id))
  await usersService.suspendUser(String(req.params.id))
  ok(res, { message: 'User suspended' })
})

router.post('/:id/reactivate', requireRole('admin', 'technician'), async (req, res) => {
  await usersService.assertTechnicianCanManageTarget(req.user!.roles, String(req.params.id))
  await usersService.reactivateUser(String(req.params.id))
  ok(res, { message: 'User reactivated' })
})

router.patch('/:id/quota', requireRole('admin', 'technician'), validateBody(z.object({ allocatedPages: z.number().int().min(0) })), async (req, res) => {
  await usersService.assertTechnicianCanManageTarget(req.user!.roles, String(req.params.id))
  ok(res, await usersService.updateUser(String(req.params.id), { allocatedPages: req.body.allocatedPages }))
})

router.delete('/:id', requireRole('admin'), async (req, res) => {
  await usersService.deleteUser(String(req.params.id))
  noContent(res)
})

export { router as usersRouter }
