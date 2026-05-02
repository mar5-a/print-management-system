import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { config } from './config.js'
import { WindowsPrintCommand } from './services/windows-print-command.js'

const app = express()
const printCommand = new WindowsPrintCommand()

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      await fs.mkdir(config.windowsConnector.uploadDir, { recursive: true })
      cb(null, config.windowsConnector.uploadDir)
    } catch (error) {
      cb(error as Error, config.windowsConnector.uploadDir)
    }
  },
  filename: (req, file, cb) => {
    const requestedJobId = typeof req.body.jobId === 'string' ? req.body.jobId : ''
    const jobId = requestedJobId || crypto.randomUUID()
    const extension = path.extname(file.originalname).toLowerCase() || '.pdf'

    cb(null, `${jobId}${extension}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase()
    const looksLikePdf = file.mimetype === 'application/pdf' || extension === '.pdf'

    if (!looksLikePdf) {
      cb(new Error('Only PDF uploads are supported by the Windows print connector.'))
      return
    }

    cb(null, true)
  },
})

function requireConnectorToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!config.windowsConnector.token) {
    next()
    return
  }

  const expected = `Bearer ${config.windowsConnector.token}`

  if (req.header('authorization') !== expected) {
    res.status(401).json({ error: 'Invalid Windows print connector token.' })
    return
  }

  next()
}

app.use(cors({ origin: config.frontendOrigin }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    printerName: config.windowsPrintQueue.target,
    queueShare: config.windowsPrintQueue.share,
    printMode: config.windowsConnector.printMode,
  })
})

app.post('/print', requireConnectorToken, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Upload a PDF using multipart field "file".' })
      return
    }

    const jobId = typeof req.body.jobId === 'string' && req.body.jobId.trim()
      ? req.body.jobId.trim()
      : crypto.randomUUID()
    const printerName = typeof req.body.printerName === 'string' && req.body.printerName.trim()
      ? req.body.printerName.trim()
      : config.windowsPrintQueue.target

    const commandResult = await printCommand.printPdf({
      mode: config.windowsConnector.printMode,
      pdfPath: req.file.path,
      printerName,
      sumatraPdfPath: config.windowsConnector.sumatraPdfPath,
      printCommand: config.windowsConnector.printCommand,
      timeoutMs: config.windowsConnector.printTimeoutMs,
    })

    console.info('Windows queue print job submitted', {
      jobId,
      printerName,
      originalFileName: req.file.originalname,
      uploadedPath: req.file.path,
      printMode: config.windowsConnector.printMode,
      queuedAt: new Date().toISOString(),
    })

    res.status(202).json({
      jobId,
      status: 'queued',
      printerName,
      originalFileName: req.file.originalname,
      uploadedPath: req.file.path,
      command: commandResult.command,
      stdout: commandResult.stdout,
      stderr: commandResult.stderr,
      queuedAt: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

app.post(
  '/print-file',
  requireConnectorToken,
  express.raw({ type: ['application/pdf', 'application/octet-stream'], limit: '50mb' }),
  async (req, res, next) => {
    try {
      if (!Buffer.isBuffer(req.body) || req.body.byteLength === 0) {
        res.status(400).json({ error: 'Send a PDF file as the raw request body.' })
        return
      }

      const jobId = typeof req.query.jobId === 'string' && req.query.jobId.trim()
        ? req.query.jobId.trim()
        : crypto.randomUUID()
      const printerName = typeof req.query.printerName === 'string' && req.query.printerName.trim()
        ? req.query.printerName.trim()
        : config.windowsPrintQueue.target
      const originalFileName = typeof req.header('x-file-name') === 'string' && req.header('x-file-name')?.trim()
        ? req.header('x-file-name')?.trim() as string
        : `${jobId}.pdf`
      const storedPath = path.join(config.windowsConnector.uploadDir, `${jobId}.pdf`)

      await fs.mkdir(config.windowsConnector.uploadDir, { recursive: true })
      await fs.writeFile(storedPath, req.body)

      const commandResult = await printCommand.printPdf({
        mode: config.windowsConnector.printMode,
        pdfPath: storedPath,
        printerName,
        sumatraPdfPath: config.windowsConnector.sumatraPdfPath,
        printCommand: config.windowsConnector.printCommand,
        timeoutMs: config.windowsConnector.printTimeoutMs,
      })

      console.info('Windows queue raw PDF print job submitted', {
        jobId,
        printerName,
        originalFileName,
        uploadedPath: storedPath,
        printMode: config.windowsConnector.printMode,
        queuedAt: new Date().toISOString(),
      })

      res.status(202).json({
        jobId,
        status: 'queued',
        printerName,
        originalFileName,
        uploadedPath: storedPath,
        command: commandResult.command,
        stdout: commandResult.stdout,
        stderr: commandResult.stderr,
        queuedAt: new Date().toISOString(),
      })
    } catch (error) {
      next(error)
    }
  },
)

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Unexpected Windows print connector error'

  res.status(500).json({
    error: message,
  })
})

app.listen(config.windowsConnector.port, () => {
  console.log(`Windows print connector listening on http://localhost:${config.windowsConnector.port}`)
  console.log(`Windows queue target ${config.windowsPrintQueue.target}`)
  console.log(`Print mode ${config.windowsConnector.printMode}`)
})
