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
