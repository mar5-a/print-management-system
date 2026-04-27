import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { devPrintRouter } from './routes/dev-print.js'

const app = express()

app.use(cors({ origin: config.frontendOrigin }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/dev', devPrintRouter)

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Unexpected backend error'

  res.status(500).json({
    error: message,
  })
})

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`)
  console.log(`Direct printer target ${config.printer.host}:${config.printer.port}`)
})
