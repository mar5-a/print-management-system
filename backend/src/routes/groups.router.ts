import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import { created, noContent, ok, paginated } from '../lib/response.js'
import * as groupsService from '../services/groups.service.js'

const router = Router()
router.use(authenticate)

const listSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const listGroupUsersSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const groupSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  quotaPeriod: z.enum(['Weekly', 'Monthly', 'Semester']),
  initialBalance: z.number().int().min(0),
  initialRestriction: z.boolean(),
  defaultForNewUsers: z.boolean(),
})

router.get('/', requireRole('admin', 'technician'), validateQuery(listSchema), async (req, res) => {
  const filters = (req as typeof req & { parsedQuery: z.infer<typeof listSchema> }).parsedQuery
  paginated(res, await groupsService.listGroups(filters))
})

router.post('/', requireRole('admin'), validateBody(groupSchema), async (req, res) => {
  created(res, await groupsService.createGroup(req.body as z.infer<typeof groupSchema>))
})

router.get('/:id/users', requireRole('admin', 'technician'), validateQuery(listGroupUsersSchema), async (req, res) => {
  const filters = (req as typeof req & { parsedQuery: z.infer<typeof listGroupUsersSchema> }).parsedQuery
  paginated(res, await groupsService.listGroupUsers(String(req.params.id), filters))
})

router.get('/:id', requireRole('admin', 'technician'), async (req, res) => {
  ok(res, await groupsService.getGroupByPublicId(String(req.params.id)))
})

router.patch('/:id', requireRole('admin'), validateBody(groupSchema), async (req, res) => {
  ok(res, await groupsService.updateGroup(String(req.params.id), req.body as z.infer<typeof groupSchema>))
})

router.delete('/:id', requireRole('admin'), async (req, res) => {
  await groupsService.deleteGroup(String(req.params.id))
  noContent(res)
})

export { router as groupsRouter }
