import fs from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config.js'
import type { HpPjlStoredJobResult } from '../types.js'

interface StoreUploadedPdfOptions {
  uploadedPath: string
  originalFileName: string
  printerHost: string
  printerPort: number
  username: string
  jobName: string
  pin: string
  copyCount: number
}

export class HpPjlStoredJobClient {
  async storeUploadedPdf({
    uploadedPath,
    originalFileName,
    printerHost,
    printerPort,
    username,
    jobName,
    pin,
    copyCount,
  }: StoreUploadedPdfOptions): Promise<HpPjlStoredJobResult> {
    const file = await fs.readFile(uploadedPath)
    const form = new FormData()

    form.append('printerHost', printerHost)
    form.append('printerPort', String(printerPort))
    form.append('username', username)
    form.append('jobName', jobName)
    form.append('pin', pin)
    form.append('copyCount', String(copyCount))
    form.append('file', new Blob([file], { type: 'application/pdf' }), path.basename(originalFileName))

    const headers: Record<string, string> = {}

    if (config.windowsConnector.token) {
      headers.Authorization = `Bearer ${config.windowsConnector.token}`
    }

    const response = await fetch(new URL('/store-on-device', config.windowsConnector.url), {
      method: 'POST',
      headers,
      body: form,
    })

    const payload = await response.json().catch(() => null) as HpPjlStoredJobResult | { error?: string } | null

    if (!response.ok) {
      const message = payload && 'error' in payload && payload.error
        ? payload.error
        : `HP PJL stored-job connector failed with HTTP ${response.status}`
      throw new Error(message)
    }

    if (!payload || !('status' in payload)) {
      throw new Error('HP PJL stored-job connector returned an invalid response.')
    }

    return {
      ...payload,
      connectorUrl: config.windowsConnector.url,
    }
  }
}
