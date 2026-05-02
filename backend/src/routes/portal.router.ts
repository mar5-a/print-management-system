import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { ok } from '../lib/response.js'
import * as authService from '../services/auth.service.js'
import * as queuesService from '../services/queues.service.js'
import * as jobsService from '../services/jobs.service.js'

const router = Router()
router.use(authenticate)

router.get('/profile', async (req, res) => {
  ok(res, await authService.getMe(req.user!.id))
})

router.get('/queues', async (req, res) => {
  ok(res, await queuesService.listEligibleQueuesForUser(req.user!.id))
})

router.get('/dashboard', async (req, res) => {
  const [profile, queues, jobs] = await Promise.all([
    authService.getMe(req.user!.id),
    queuesService.listEligibleQueuesForUser(req.user!.id),
    jobsService.listMyJobs(req.user!, { limit: 20 }),
  ])

  ok(res, {
    profile,
    queues,
    jobs: jobs.data,
  })
})

export { router as portalRouter }
