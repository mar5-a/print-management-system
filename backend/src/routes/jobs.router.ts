import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { config } from '../config.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { validateQuery } from '../middleware/validate.js'
import { accepted, created, ok, paginated } from '../lib/response.js'
import { BadRequestError } from '../lib/errors.js'
import * as jobsService from '../services/jobs.service.js'

const router = Router()
router.use(authenticate)

const upload = multer({
  storage: multer.diskStorage({
    destination: async (_req, _file, cb) => {
      try {
        await fs.mkdir(config.uploadDir, { recursive: true })
        cb(null, config.uploadDir)
      } catch (error) {
        cb(error as Error, config.uploadDir)
      }
    },
    filename: (_req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase() || '.pdf'
      cb(null, `${crypto.randomUUID()}${extension}`)
    },
  }),
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase()
    const looksLikePdf = file.mimetype === 'application/pdf' || extension === '.pdf'

    if (!looksLikePdf) {
      cb(new Error('Only PDF uploads are supported.'))
      return
    }

    cb(null, true)
  },
})

const listSchema = z.object({
  queueId: z.string().optional(),
  status: z.enum(['held', 'sent_to_printer', 'failed', 'cancelled', 'expired', 'queued', 'printing', 'completed', 'blocked']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const submitSchema = z.object({
  pageCount: z.coerce.number().int().positive(),
  copyCount: z.coerce.number().int().positive().default(1),
  colorMode: z.enum(['bw', 'color']).default('bw'),
  duplex: z.coerce.boolean().default(false),
  paperType: z.string().min(1).max(64).default('standard'),
})

router.get('/', requireRole('admin', 'technician'), validateQuery(listSchema.extend({ userId: z.coerce.number().int().positive().optional() })), async (req, res) => {
  const filters = (req as typeof req & { parsedQuery: z.infer<typeof listSchema> & { userId?: number } }).parsedQuery
  paginated(res, await jobsService.listJobs(req.user!, filters))
})

router.get('/my', validateQuery(listSchema), async (req, res) => {
  const filters = (req as typeof req & { parsedQuery: z.infer<typeof listSchema> }).parsedQuery
  paginated(res, await jobsService.listMyJobs(req.user!, filters))
})

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    throw new BadRequestError('Upload a PDF using multipart field "file".')
  }

  const parsed = submitSchema.safeParse(req.body)
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.issues.map((issue) => issue.message).join('; '))
  }

  created(res, await jobsService.submitJob(req.user!, { file: req.file, ...parsed.data }))
})

router.get('/:id', async (req, res) => {
  ok(res, await jobsService.getJobById(req.params.id, req.user!))
})

router.get('/:id/events', async (req, res) => {
  ok(res, await jobsService.listJobEvents(req.params.id, req.user!))
})

router.post('/:id/release', async (req, res) => {
  accepted(res, await jobsService.releaseJob(req.params.id, req.user!))
})

router.post('/:id/cancel', async (req, res) => {
  ok(res, await jobsService.cancelJob(req.params.id, req.user!))
})

export { router as jobsRouter }
