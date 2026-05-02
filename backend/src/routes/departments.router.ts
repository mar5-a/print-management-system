import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { ok } from '../lib/response.js'
import * as departmentsService from '../services/departments.service.js'

const router = Router()
router.use(authenticate)

router.get('/', async (_req, res) => {
  ok(res, await departmentsService.listDepartments())
})

export { router as departmentsRouter }
