import { Router } from 'express'
import authRouter from './auth.router.js'
import usersRouter from './users.router.js'
import printersRouter from './printers.router.js'
import queuesRouter from './queues.router.js'
import jobsRouter from './jobs.router.js'
import groupsRouter from './groups.router.js'
import dashboardRouter from './dashboard.router.js'
import alertsRouter from './alerts.router.js'

const router = Router()

router.use('/auth', authRouter)
router.use('/users', usersRouter)
router.use('/printers', printersRouter)
router.use('/queues', queuesRouter)
router.use('/jobs', jobsRouter)
router.use('/groups', groupsRouter)
router.use('/dashboard', dashboardRouter)
router.use('/alerts', alertsRouter)

export default router
