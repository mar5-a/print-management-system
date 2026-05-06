import type { QueueAccessScope } from './admin'

export type PortalUserRole = 'Student' | 'Faculty'
export type PortalJobStatus = 'Ready to send' | 'Stored on printer' | 'In Progress' | 'Completed' | 'Failed' | 'Cancelled'

export interface PortalUserProfile {
  id: string
  displayName: string
  username: string
  department: string
  role: PortalUserRole
  assignedQueueId: string
  quotaUsed: number
  quotaTotal: number
  retentionHours: number
}

export interface PortalQueueOption {
  id: string
  name: string
  location: string
  queueHost: string
  printerName: string
  pendingJobs: number
  releaseMode: string
  access: QueueAccessScope
  colorMode: string
  available: boolean
  isDefault: boolean
  submissionPath: string
  reason?: string
  costPerPage: number
  supportsColor: boolean
  supportsDuplex: boolean
}

export interface PortalPrintJob {
  id: string
  userId: string
  fileName: string
  submittedAt: string
  printerName: string
  queueName: string
  pages: number
  copies: number
  totalPages: number
  colorMode: 'Black & White' | 'Color'
  duplex: boolean
  paperType: 'Standard' | 'Heavy' | 'Glossy'
  cost: number
  status: PortalJobStatus
  retentionDeadline?: string
  details: string
  deviceStorageUsername?: string | null
  deviceStorageJobName?: string | null
  deviceStorageSubmittedAt?: string
}

export interface PortalSubmissionDraft {
  fileName: string
  copies: number
  queueId?: string
  colorMode?: 'bw' | 'color'
  duplex?: boolean
  paperType?: string
}

export interface PortalDeviceReleaseInfo {
  username: string
  jobName: string
  pin: string
  instructions: string
}
