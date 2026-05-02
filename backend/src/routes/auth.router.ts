import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { ok } from '../lib/response.js'
import * as authService from '../services/auth.service.js'

const router = Router()

const loginSchema = z.object({
  credential: z.string().min(1),
  password: z.string().min(1),
})

router.post('/login', validateBody(loginSchema), async (req, res) => {
  const result = await authService.login({
    credential: req.body.credential,
    password: req.body.password,
    sourceIp: req.ip,
  })

  ok(res, result)
})

router.post('/dev-login', validateBody(loginSchema), async (req, res) => {
  const result = await authService.login({
    credential: req.body.credential,
    password: req.body.password,
    sourceIp: req.ip,
  })

  ok(res, result)
})

router.post('/logout', authenticate, (_req, res) => {
  ok(res, { message: 'Logged out successfully' })
})

router.get('/me', authenticate, async (req, res) => {
  ok(res, await authService.getMe(req.user!.id))
})

export { router as authRouter }
