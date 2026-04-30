import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { query } from '../db/client.js'
import { ok } from '../lib/response.js'

const router = Router()
router.use(authenticate)

// GET /api/departments
router.get('/', async (_req, res) => {
  const result = await query('SELECT id, name FROM departments ORDER BY name')
  ok(res, result.rows)
})

export default router
