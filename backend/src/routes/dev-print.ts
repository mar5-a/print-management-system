import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import express from 'express'
import multer from 'multer'
import { config } from '../config.js'
import { DirectPrintService } from '../services/direct-print-service.js'
import { WindowsQueuePrintClient } from '../services/windows-queue-print-client.js'

const router = express.Router()
const directPrintService = new DirectPrintService()
const windowsQueuePrintClient = new WindowsQueuePrintClient()

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      await fs.mkdir(config.uploadDir, { recursive: true })
      cb(null, config.uploadDir)
    } catch (error) {
      cb(error as Error, config.uploadDir)
    }
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase() || '.pdf'
    cb(null, `${crypto.randomUUID()}${extension}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase()
    const looksLikePdf = file.mimetype === 'application/pdf' || extension === '.pdf'

    if (!looksLikePdf) {
      cb(new Error('Only PDF uploads are supported for direct printing.'))
      return
    }

    cb(null, true)
  },
})

router.post('/print-direct', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Upload a PDF using multipart field "file".' })
      return
    }

    const result = await directPrintService.printUploadedPdf({
      uploadedPath: req.file.path,
      originalFileName: req.file.originalname,
    })

    res.status(202).json(result)
  } catch (error) {
    next(error)
  }
})

router.post('/print-windows-queue', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Upload a PDF using multipart field "file".' })
      return
    }

    const result = await windowsQueuePrintClient.printUploadedPdf({
      uploadedPath: req.file.path,
      originalFileName: req.file.originalname,
      printerName: req.body.printerName || config.windowsPrintQueue.target,
    })

    res.status(202).json(result)
  } catch (error) {
    next(error)
  }
})

export { router as devPrintRouter }
