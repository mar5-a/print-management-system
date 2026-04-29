import { Router } from 'express'
import { z } from 'zod'
import { validateBody } from '../middleware/validate.js'
import { authenticate } from '../middleware/auth.js'
import * as authService from '../services/auth.service.js'
import { ok } from '../lib/response.js'
import { UnauthorizedError } from '../lib/errors.js'

const router = Router()

const loginSchema = z.object({
  credential: z.string().min(1),
  password: z.string().min(1),
})

// POST /api/auth/login
router.post('/login', validateBody(loginSchema), async (req, res) => {
  const { credential, password } = req.body as z.infer<typeof loginSchema>
  const result = await authService.login(credential, password)
  ok(res, result)
})

// POST /api/auth/logout  (client drops token; endpoint for audit / future blocklist)
router.post('/logout', authenticate, (_req, res) => {
  ok(res, { message: 'Logged out successfully' })
})

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const user = await authService.getMe(req.user!.id)
  if (!user) throw new UnauthorizedError()
  ok(res, user)
})

export default router
