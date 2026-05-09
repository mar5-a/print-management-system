import fs from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import crypto from 'node:crypto'
import { config } from '../config.js'
import { GhostscriptPdfConverter } from './ghostscript-pdf-converter.js'
import type { HpPjlStoredJobResult } from '../types.js'

interface StorePdfOnDeviceOptions {
  uploadedPath: string
  originalFileName: string
  printerHost: string
  printerPort: number
  username: string
  jobName: string
  pin: string
  copyCount: number
}

const esc = '\x1b'
const pjlHoldMode = 'ON'
const pjlHoldType = 'PRIVATE'

export class HpPjlStoredJobService {
  constructor(private readonly converter = new GhostscriptPdfConverter()) {}

  async storePdfOnDevice({
    uploadedPath,
    originalFileName,
    printerHost,
    printerPort,
    username,
    jobName,
    pin,
    copyCount,
  }: StorePdfOnDeviceOptions): Promise<HpPjlStoredJobResult> {
    const connectorJobId = crypto.randomUUID()
    const postScriptPath = path.join(config.convertedDir, `${connectorJobId}.ps`)
    const pjlPath = path.join(config.convertedDir, `${connectorJobId}.pjl.ps`)

    await fs.mkdir(config.convertedDir, { recursive: true })
    await this.converter.convertPdfToPostScript({
      ghostscriptBin: config.ghostscriptBin,
      inputPdfPath: uploadedPath,
      outputPostScriptPath: postScriptPath,
    })

    const postScript = await fs.readFile(postScriptPath)
    const payload = wrapPjlPostScript(postScript, {
      username,
      jobName,
      pin,
      copyCount,
    })

    await fs.writeFile(pjlPath, payload)
    const bytesSent = await sendRaw({ printerHost, printerPort, payload })

    return {
      jobId: connectorJobId,
      status: 'stored_on_device',
      printerHost,
      printerPort,
      username,
      jobName,
      originalFileName,
      uploadedPath,
      postScriptPath,
      pjlPath,
      bytesSent,
      storedAt: new Date().toISOString(),
    }
  }

  async sendDiagnosticStoredJob(printerHost = config.printer.host, printerPort = config.printer.port) {
    const connectorJobId = crypto.randomUUID()
    const username = 'PRINTSOL_TEST'
    const jobName = 'PJL_PERSONAL_001'
    const postScript = Buffer.from(`%!PS-Adobe-3.0
/Courier findfont 24 scalefont setfont
72 720 moveto
(HP PJL private personal job test) show
showpage
\x04`, 'latin1')
    const payload = wrapPjlPostScript(postScript, {
      username,
      jobName,
      pin: '1234',
      copyCount: 1,
    })
    const pjlPath = path.join(config.convertedDir, `${connectorJobId}.diagnostic.pjl.ps`)

    await fs.mkdir(config.convertedDir, { recursive: true })
    await fs.writeFile(pjlPath, payload)
    const bytesSent = await sendRaw({ printerHost, printerPort, payload })

    return {
      jobId: connectorJobId,
      status: 'stored_on_device' as const,
      printerHost,
      printerPort,
      username,
      jobName,
      originalFileName: 'diagnostic-postscript.ps',
      pjlPath,
      bytesSent,
      storedAt: new Date().toISOString(),
    }
  }
}

function wrapPjlPostScript(
  postScript: Buffer,
  options: {
    username: string
    jobName: string
    pin: string
    copyCount: number
  },
) {
  const username = sanitizePjlValue(options.username, 40)
  const jobName = sanitizePjlValue(options.jobName, 60)
  const pin = sanitizePin(options.pin)
  const copyCount = Math.max(1, Math.floor(options.copyCount))
  const header = Buffer.from(
    `${esc}%-12345X@PJL\r\n`
    + `@PJL JOB NAME = "${jobName}"\r\n`
    + `@PJL SET JOBNAME = "${jobName}"\r\n`
    + `@PJL SET USERNAME = "${username}"\r\n`
    + `@PJL SET QTY = ${copyCount}\r\n`
    + `@PJL SET HOLD = ${pjlHoldMode}\r\n`
    + `@PJL SET HOLDTYPE = ${pjlHoldType}\r\n`
    + `@PJL SET HOLDKEY = "${pin}"\r\n`
    + '@PJL ENTER LANGUAGE = POSTSCRIPT\r\n',
    'latin1',
  )
  const footer = Buffer.from(
    `${esc}%-12345X@PJL\r\n`
    + `@PJL EOJ NAME = "${jobName}"\r\n`
    + `${esc}%-12345X\r\n`,
    'latin1',
  )

  return Buffer.concat([header, postScript, footer])
}

function sanitizePjlValue(value: string, maxLength: number) {
  return value
    .replace(/[\r\n"]/g, ' ')
    .replace(/[^\x20-\x7E]/g, '')
    .trim()
    .slice(0, maxLength) || 'PMS_JOB'
}

function sanitizePin(pin: string) {
  const normalized = pin.replace(/\D/g, '').slice(0, 4)

  if (normalized.length !== 4) {
    throw new Error('Device PIN must be exactly 4 digits.')
  }

  return normalized
}

async function sendRaw({
  printerHost,
  printerPort,
  payload,
  timeoutMs = 20_000,
}: {
  printerHost: string
  printerPort: number
  payload: Buffer
  timeoutMs?: number
}) {
  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host: printerHost, port: printerPort })
    let settled = false

    function finish(error?: Error) {
      if (settled) {
        return
      }

      settled = true
      socket.destroy()

      if (error) {
        reject(error)
        return
      }

      resolve()
    }

    socket.setTimeout(timeoutMs)
    socket.on('connect', () => {
      socket.setNoDelay(true)
      socket.end(payload, () => finish())
    })
    socket.on('timeout', () => finish(new Error(`Timed out sending stored job to ${printerHost}:${printerPort}`)))
    socket.on('error', finish)
    socket.on('close', (hadError) => {
      if (!hadError) {
        finish()
      }
    })
  })

  return payload.byteLength
}
