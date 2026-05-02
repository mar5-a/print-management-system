import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { devPrintRouter } from './routes/dev-print.js'
import { apiRouter } from './routes/index.js'
import { errorHandler } from './middleware/error-handler.js'

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
})
