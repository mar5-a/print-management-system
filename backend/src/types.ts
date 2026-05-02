export interface DirectPrintResult {
  jobId: string
  status: 'sent_to_printer'
  printerHost: string
  printerPort: number
  originalFileName: string
  uploadedPath: string
  postScriptPath: string
  bytesSent: number
}

export interface WindowsQueuePrintResult {
  jobId: string
  status: 'queued'
  printerName: string
  originalFileName: string
  uploadedPath?: string
  connectorUrl?: string
  command?: string
  stdout?: string
  stderr?: string
  queuedAt: string
}
