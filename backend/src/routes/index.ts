import { Router } from 'express'
import { alertsRouter } from './alerts.router.js'
import { authRouter } from './auth.router.js'
import { dashboardRouter } from './dashboard.router.js'
import { jobsRouter } from './jobs.router.js'
import { portalRouter } from './portal.router.js'
import { printersRouter } from './printers.router.js'
import { queuesRouter } from './queues.router.js'
import { usersRouter } from './users.router.js'

const router = Router()

router.use('/alerts', alertsRouter)
router.use('/auth', authRouter)
router.use('/dashboard', dashboardRouter)
router.use('/jobs', jobsRouter)
router.use('/portal', portalRouter)
router.use('/printers', printersRouter)
router.use('/queues', queuesRouter)
router.use('/users', usersRouter)

export { router as apiRouter }
