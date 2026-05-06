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
  copyCount?: number
  connectorJobs?: WindowsQueuePrintResult[]
  uploadedPath?: string
  connectorUrl?: string
  command?: string
  stdout?: string
  stderr?: string
  queuedAt: string
}

export interface HpPjlStoredJobResult {
  jobId: string
  status: 'stored_on_device'
  printerHost: string
  printerPort: number
  username: string
  jobName: string
  originalFileName: string
  uploadedPath?: string
  postScriptPath?: string
  pjlPath?: string
  connectorUrl?: string
  bytesSent: number
  storedAt: string
}
