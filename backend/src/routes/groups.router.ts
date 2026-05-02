import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import * as groupsService from '../services/groups.service.js'
import { ok, created, noContent } from '../lib/response.js'

const router = Router()
router.use(authenticate)

const createSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
})

const updateSchema = createSchema.partial()

// GET /api/groups
router.get('/', async (_req, res) => {
  const groups = await groupsService.listGroups()
  ok(res, groups)
})

// POST /api/groups
router.post('/', requireRole('admin'), validateBody(createSchema), async (req, res) => {
  const group = await groupsService.createGroup(req.body as z.infer<typeof createSchema>)
  created(res, group)
})

// GET /api/groups/:id
router.get('/:id', async (req, res) => {
  const group = await groupsService.getGroupById(req.params.id)
  ok(res, group)
})

// PATCH /api/groups/:id
router.patch('/:id', requireRole('admin'), validateBody(updateSchema), async (req, res) => {
  const group = await groupsService.updateGroup(String(req.params['id']), req.body as z.infer<typeof updateSchema>)
  ok(res, group)
})

// DELETE /api/groups/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  await groupsService.deleteGroup(String(req.params['id']))
  noContent(res)
})

export default router
