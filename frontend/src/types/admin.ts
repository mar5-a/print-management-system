export type UserRole = 'Administrator' | 'Technician' | 'Student' | 'Faculty'
export type EntityStatus = 'Active' | 'Suspended' | 'Online' | 'Offline' | 'Maintenance'

export interface AdminUser {
  id: string
  username: string
  displayName: string
  email: string
  role: UserRole
  office: string
  status: 'Active' | 'Suspended'
  quotaUsed: number
  quotaTotal: number
  groups: string[]
  cardId: string
  primaryIdentity: string
  secondaryIdentity: string
  notes: string
  lastSeen: string
  jobCount: number
}

export interface AdminGroup {
  id: string
  name: string
  description: string
  userCount: number
  quotaPerPeriod: number
  schedule: 'Monthly' | 'Semester' | 'Weekly'
  studentRestricted: boolean
  defaultForNewUsers: boolean
  owner: string
}

export interface AdminPrinter {
  id: string
  name: string
  softwareVersion: string
  hostedOn: string
  model: string
  location: string
  queue: string
  deviceGroup: string
  alternateId: string
  status: 'Online' | 'Offline' | 'Maintenance'
  pendingJobs: number
  releasedToday: number
  toner: number
  holdReleaseMode: 'Secure Release' | 'Immediate'
  failureMode: 'Hold until redirected' | 'Retry then notify' | 'Cancel and notify'
  ipAddress: string
  serialNumber: string
  notes: string
}

export type QueueAccessScope = 'Students' | 'Staff' | 'Faculty' | 'Mixed'
export type QueueReleaseMode = 'Secure Release' | 'Immediate' | 'Kiosk Release'
export type QueueColorMode = 'Black & White' | 'Color'
export type QueueLogType = 'Release' | 'Routing' | 'Policy' | 'Error'
export type QueueLogState = 'Info' | 'Open' | 'Resolved'

export interface QueueLogEntry {
  id: string
  time: string
  type: QueueLogType
  state: QueueLogState
  actor: string
  message: string
}

export interface AdminQueue {
  id: string
  name: string
  description: string
  hostedOn: string
  status: 'Online' | 'Offline' | 'Maintenance'
  enabled: boolean
  releaseMode: QueueReleaseMode
  audience: QueueAccessScope
  department: string
  allowedGroups: string[]
  colorMode: QueueColorMode
  defaultDuplex: boolean
  costPerPage: number
  printerIds: string[]
  pendingJobs: number
  heldJobs: number
  releasedToday: number
  lastActivity: string
  autoDeleteAfterHours: number
  failureMode: 'Hold until redirected' | 'Retry then notify' | 'Cancel and notify'
  notes: string
  queueLogs: QueueLogEntry[]
}
