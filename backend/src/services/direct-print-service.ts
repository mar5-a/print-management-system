import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { config } from '../config.js'
import type { DirectPrintResult } from '../types.js'
import { GhostscriptPdfConverter } from './ghostscript-pdf-converter.js'
import { RawSocketPrintConnector } from './raw-socket-print-connector.js'

interface PrintUploadedPdfOptions {
  uploadedPath: string
  originalFileName: string
}

export class DirectPrintService {
  constructor(
    private readonly converter = new GhostscriptPdfConverter(),
    private readonly connector = new RawSocketPrintConnector(),
  ) {}

  async printUploadedPdf({
    uploadedPath,
    originalFileName,
  }: PrintUploadedPdfOptions): Promise<DirectPrintResult> {
    const jobId = crypto.randomUUID()
    const postScriptPath = path.join(config.convertedDir, `${jobId}.ps`)

    await fs.mkdir(config.convertedDir, { recursive: true })

    await this.converter.convertPdfToPostScript({
      ghostscriptBin: config.ghostscriptBin,
      inputPdfPath: uploadedPath,
      outputPostScriptPath: postScriptPath,
    })

    const { bytesSent } = await this.connector.sendPostScript({
      printerHost: config.printer.host,
      printerPort: config.printer.port,
      postScriptPath,
    })

    console.info('Direct print job sent', {
      jobId,
      originalFileName,
      printerHost: config.printer.host,
      printerPort: config.printer.port,
      uploadedPath,
      postScriptPath,
      bytesSent,
      sentAt: new Date().toISOString(),
    })

    return {
      jobId,
      status: 'sent_to_printer',
      printerHost: config.printer.host,
      printerPort: config.printer.port,
      originalFileName,
      uploadedPath,
      postScriptPath,
      bytesSent,
    }
  }
}
