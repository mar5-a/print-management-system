import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import * as printersService from '../services/printers.service.js'
import { ok, created, noContent, paginated } from '../lib/response.js'

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
  model: z.string().max(255).optional(),
  ipAddress: z.string().max(45).optional(),
  location: z.string().max(255).optional(),
  isColor: z.boolean().default(true),
  supportsDuplex: z.boolean().default(true),
  costPerBwPage: z.number().positive().default(0.05),
  costPerColorPage: z.number().positive().default(0.15),
  serialNumber: z.string().max(255).optional(),
  notes: z.string().optional(),
})

const updateSchema = createSchema.partial().extend({
  status: z.enum(['online', 'offline', 'error', 'maintenance']).optional(),
  tonerLevel: z.number().int().min(0).max(100).optional(),
})

// GET /api/printers
router.get('/', validateQuery(listSchema), async (req, res) => {
  const result = await printersService.listPrinters((req as any).parsedQuery as z.infer<typeof listSchema>)
  paginated(res, result)
})

// POST /api/printers
router.post('/', requireRole('admin'), validateBody(createSchema), async (req, res) => {
  const printer = await printersService.createPrinter(req.body as z.infer<typeof createSchema>)
  created(res, printer)
})

// GET /api/printers/:id
router.get('/:id', async (req, res) => {
  const printer = await printersService.getPrinterById(req.params.id)
  ok(res, printer)
})

// PATCH /api/printers/:id
router.patch('/:id', requireRole('admin', 'technician'), validateBody(updateSchema), async (req, res) => {
  const printer = await printersService.updatePrinter(req.params.id, req.body as z.infer<typeof updateSchema>)
  ok(res, printer)
})

// DELETE /api/printers/:id
router.delete('/:id', requireRole('admin'), async (req, res) => {
  await printersService.deletePrinter(req.params.id)
  noContent(res)
})

// GET /api/printers/:id/errors
router.get('/:id/errors', requireRole('admin', 'technician'), async (req, res) => {
  const errors = await printersService.getPrinterErrors(req.params.id)
  ok(res, errors)
})

export default router
