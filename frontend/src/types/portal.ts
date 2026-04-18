import type { QueueAccessScope } from './admin'

export type PortalUserRole = 'Student' | 'Faculty'
export type PortalJobStatus = 'Pending Release' | 'In Progress' | 'Completed' | 'Failed' | 'Cancelled'

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
}

export interface PortalPrintJob {
  id: string
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
}

export interface PortalSubmissionDraft {
  fileName: string
  pages: number
  copies: number
  colorMode: 'Black & White' | 'Color'
  paperType: 'Standard' | 'Heavy' | 'Glossy'
  duplex: boolean
}
