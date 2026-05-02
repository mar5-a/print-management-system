import { Router } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import { created, noContent, ok, paginated } from '../lib/response.js'
import * as printersService from '../services/printers.service.js'

const router = Router()
router.use(authenticate)

const listSchema = z.object({
  status: z.enum(['online', 'offline', 'maintenance', 'disabled']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const createSchema = z.object({
  name: z.string().min(1).max(150),
  model: z.string().max(150).optional(),
  ipAddress: z.string().max(45).optional(),
  location: z.string().max(255).optional(),
  status: z.enum(['online', 'offline', 'maintenance', 'disabled']).optional(),
  isColor: z.boolean().optional(),
  supportsDuplex: z.boolean().optional(),
  serialNumber: z.string().max(255).optional(),
  notes: z.string().optional(),
  connectorType: z.enum(['raw_socket', 'windows_queue', 'ipp', 'hp_oxp', 'manual']).optional(),
  connectorTarget: z.string().max(255).optional(),
})

router.get('/', validateQuery(listSchema), async (req, res) => {
  const filters = (req as typeof req & { parsedQuery: z.infer<typeof listSchema> }).parsedQuery
  paginated(res, await printersService.listPrinters(filters))
})

router.post('/', requireRole('admin'), validateBody(createSchema), async (req, res) => {
  created(res, await printersService.createPrinter(req.body as z.infer<typeof createSchema>))
})

router.get('/:id', async (req, res) => {
  ok(res, await printersService.getPrinterById(String(req.params.id)))
})

router.patch('/:id', requireRole('admin', 'technician'), validateBody(createSchema.partial()), async (req, res) => {
  ok(res, await printersService.updatePrinter(String(req.params.id), req.body as z.infer<typeof createSchema>))
})

router.delete('/:id', requireRole('admin'), async (req, res) => {
  await printersService.deletePrinter(String(req.params.id))
  noContent(res)
})

router.get('/:id/errors', requireRole('admin', 'technician'), async (req, res) => {
  ok(res, await printersService.getPrinterErrors(String(req.params.id)))
})

export { router as printersRouter }
