import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { devPrintRouter } from './routes/dev-print.js'
import { apiRouter } from './routes/index.js'
import { errorHandler } from './middleware/error-handler.js'
import { cleanupExpiredJobsAndFiles } from './services/job-cleanup.service.js'

const app = express()

app.use(cors({ origin: config.frontendOrigins }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api', apiRouter)
app.use('/dev', devPrintRouter)

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`)
  console.log(`Direct printer target ${config.printer.host}:${config.printer.port}`)
  startJobCleanupWorker()
})

function startJobCleanupWorker() {
  if (!config.jobCleanup.enabled) {
    console.log('Job cleanup worker disabled')
    return
  }

  void runJobCleanup()
  setInterval(() => {
    void runJobCleanup()
  }, config.jobCleanup.intervalMs).unref()
}

async function runJobCleanup() {
  try {
    const result = await cleanupExpiredJobsAndFiles()

    if (result.expiredJobs > 0 || result.deletedFiles > 0 || result.failedFiles > 0) {
      console.log('Job cleanup worker finished', result)
    }
  } catch (error) {
    console.warn('Job cleanup worker failed', error instanceof Error ? error.message : error)
  }
}
