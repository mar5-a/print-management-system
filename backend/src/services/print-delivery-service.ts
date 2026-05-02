import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { config } from '../config.js'
import { GhostscriptPdfConverter } from './ghostscript-pdf-converter.js'
import { RawSocketPrintConnector } from './raw-socket-print-connector.js'

interface PrinterDeliveryTarget {
  connector_type: string
  connector_target: string | null
  connector_options: Record<string, unknown>
  name: string
}

interface DeliverPrintJobOptions {
  uploadedPath: string
  originalFileName: string
  printer: PrinterDeliveryTarget
}

export class PrintDeliveryService {
  constructor(
    private readonly converter = new GhostscriptPdfConverter(),
    private readonly rawSocket = new RawSocketPrintConnector(),
  ) {}

  async deliverPdf({ uploadedPath, originalFileName: _originalFileName, printer }: DeliverPrintJobOptions) {
    const { host, port } = parseRawSocketTarget(printer.connector_target)
    const deliveryId = crypto.randomUUID()
    const postScriptPath = path.join(config.convertedDir, `${deliveryId}.ps`)

    await fs.mkdir(config.convertedDir, { recursive: true })
    await this.converter.convertPdfToPostScript({
      ghostscriptBin: config.ghostscriptBin,
      inputPdfPath: uploadedPath,
      outputPostScriptPath: postScriptPath,
    })

    const { bytesSent } = await this.rawSocket.sendPostScript({
      printerHost: host,
      printerPort: port,
      postScriptPath,
    })

    return {
      channel: 'raw_socket',
      status: 'sent_to_printer',
      details: {
        printerHost: host,
        printerPort: port,
        postScriptPath,
        bytesSent,
      },
    }
  }
}

function parseRawSocketTarget(target: string | null) {
  const fallback = `${config.printer.host}:${config.printer.port}`
  const [host, portText] = (target || fallback).split(':')
  const port = Number(portText || config.printer.port)

  return {
    host: host || config.printer.host,
    port: Number.isFinite(port) ? port : config.printer.port,
  }
}
