import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { config } from '../config.js'
import type { WindowsQueuePrintResult } from '../types.js'

interface PrintViaConnectorOptions {
  uploadedPath: string
  originalFileName: string
  printerName?: string
}

export class WindowsQueuePrintClient {
  async printUploadedPdf({
    uploadedPath,
    originalFileName,
    printerName = config.windowsPrintQueue.target,
  }: PrintViaConnectorOptions): Promise<WindowsQueuePrintResult> {
    const jobId = crypto.randomUUID()
    const file = await fs.readFile(uploadedPath)
    const form = new FormData()

    form.append('jobId', jobId)
    form.append('printerName', printerName)
    form.append('file', new Blob([file], { type: 'application/pdf' }), path.basename(originalFileName))

    const headers: Record<string, string> = {}

    if (config.windowsConnector.token) {
      headers.Authorization = `Bearer ${config.windowsConnector.token}`
    }

    const response = await fetch(new URL('/print', config.windowsConnector.url), {
      method: 'POST',
      headers,
      body: form,
    })

    const payload = await response.json().catch(() => null) as WindowsQueuePrintResult | { error?: string } | null

    if (!response.ok) {
      const message = payload && 'error' in payload && payload.error
        ? payload.error
        : `Windows print connector failed with HTTP ${response.status}`
      throw new Error(message)
    }

    if (!payload || !('status' in payload)) {
      throw new Error('Windows print connector returned an invalid response.')
    }

    return {
      ...payload,
      connectorUrl: config.windowsConnector.url,
    }
  }
}
