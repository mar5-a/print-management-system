export type UserRole = 'Administrator' | 'Technician' | 'Student' | 'Faculty'
export type EntityStatus = 'Active' | 'Suspended' | 'Online' | 'Offline' | 'Maintenance'

export interface AdminUser {
  id: string
  username: string
  displayName: string
  email: string
  role: UserRole
  department: string
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
  newUserQuota: number
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
