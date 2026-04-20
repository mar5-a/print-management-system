import { adminPrinters, listAdminQueues } from './admin-store'
import { getCurrentUser } from '@/lib/auth'
import type { AuthUser } from '@/types/auth'
import type { PortalPrintJob, PortalQueueOption, PortalSubmissionDraft, PortalUserProfile } from '../types/portal'

interface PortalUserProfileRecord extends PortalUserProfile {
  email: string
}

const portalUserProfiles: PortalUserProfileRecord[] = [
  {
    id: 'user-003',
    displayName: 'Student User',
    username: 'student.user',
    email: 'student@university.edu',
    department: 'Computer Science',
    role: 'Student',
    assignedQueueId: 'que-01',
    quotaUsed: 140,
    quotaTotal: 1000,
    retentionHours: 24,
  },
  {
    id: 'user-004',
    displayName: 'Faculty User',
    username: 'faculty.user',
    email: 'faculty@university.edu',
    department: 'Information Systems',
    role: 'Faculty',
    assignedQueueId: 'que-04',
    quotaUsed: 320,
    quotaTotal: 5000,
    retentionHours: 48,
  },
]

function toPortalUserProfile(profile: PortalUserProfileRecord): PortalUserProfile {
  const { email: _, ...safeProfile } = profile
  return safeProfile
}

function getDefaultPortalProfile(): PortalUserProfileRecord {
  return portalUserProfiles[0]
}

function getCurrentPortalProfileRecord(): PortalUserProfileRecord {
  const authUser = getCurrentUser()
  return resolvePortalProfileRecord(authUser) ?? getDefaultPortalProfile()
}

function resolvePortalProfileRecord(authUser: AuthUser | null): PortalUserProfileRecord | undefined {
  if (!authUser) {
    return undefined
  }

  return (
    portalUserProfiles.find((profile) => profile.id === authUser.id) ??
    portalUserProfiles.find((profile) => profile.username === authUser.username) ??
    portalUserProfiles.find((profile) => profile.email.toLowerCase() === authUser.email.toLowerCase())
  )
}

export function getPortalProfileForAuthUser(authUser: AuthUser | null): PortalUserProfile {
  return toPortalUserProfile(resolvePortalProfileRecord(authUser) ?? getDefaultPortalProfile())
}

const weeklyUsageSeed = [18, 12, 26, 34, 20, 8, 22]

let portalJobsData: PortalPrintJob[] = [
  {
    id: 'JOB-A1B2C3D',
    userId: 'user-003',
    fileName: 'Quarterly_Report.pdf',
    submittedAt: '2026-04-07 08:15',
    printerName: 'Printer A1',
    queueName: 'Student Standard',
    pages: 25,
    copies: 2,
    totalPages: 50,
    colorMode: 'Black & White',
    duplex: true,
    paperType: 'Standard',
    cost: 2.5,
    status: 'Pending Release',
    retentionDeadline: '2026-04-08 08:15',
    details: 'Held for card or credential release at Printer A1.',
  },
  {
    id: 'JOB-P2A3B4C',
    userId: 'user-003',
    fileName: 'Document_Report.pdf',
    submittedAt: '2026-04-06 09:30',
    printerName: 'Printer A1',
    queueName: 'Student Standard',
    pages: 18,
    copies: 1,
    totalPages: 18,
    colorMode: 'Black & White',
    duplex: true,
    paperType: 'Standard',
    cost: 0.9,
    status: 'In Progress',
    retentionDeadline: '2026-04-07 09:30',
    details: 'Accepted by the queue and waiting for device availability.',
  },
  {
    id: 'JOB-X5Y6Z7D',
    userId: 'user-004',
    fileName: 'Presentation.pdf',
    submittedAt: '2026-04-05 14:45',
    printerName: 'Printer D1',
    queueName: 'Student Color',
    pages: 10,
    copies: 1,
    totalPages: 10,
    colorMode: 'Color',
    duplex: false,
    paperType: 'Standard',
    cost: 1.2,
    status: 'Failed',
    details: 'Submission failed after the selected device went offline.',
  },
  {
    id: 'JOB-M8N9O0P',
    userId: 'user-003',
    fileName: 'Invoice_Feb.pdf',
    submittedAt: '2026-04-04 11:20',
    printerName: 'Printer A1',
    queueName: 'Student Standard',
    pages: 10,
    copies: 1,
    totalPages: 10,
    colorMode: 'Black & White',
    duplex: true,
    paperType: 'Standard',
    cost: 0.5,
    status: 'Completed',
    details: 'Released successfully with duplex pricing applied.',
  },
  {
    id: 'JOB-Q1R2S3T',
    userId: 'user-004',
    fileName: 'Meeting_Notes.docx',
    submittedAt: '2026-04-03 16:15',
    printerName: 'Printer A1',
    queueName: 'Student Standard',
    pages: 20,
    copies: 1,
    totalPages: 20,
    colorMode: 'Black & White',
    duplex: true,
    paperType: 'Standard',
    cost: 1,
    status: 'Completed',
    details: 'Completed and retained in personal history.',
  },
  {
    id: 'JOB-U4V5W6X',
    userId: 'user-003',
    fileName: 'Spreadsheet.xlsx',
    submittedAt: '2026-04-02 10:00',
    printerName: 'Printer A1',
    queueName: 'Student Standard',
    pages: 32,
    copies: 1,
    totalPages: 32,
    colorMode: 'Black & White',
    duplex: false,
    paperType: 'Standard',
    cost: 1.6,
    status: 'Completed',
    details: 'Single-sided spreadsheet output completed on the student queue.',
  },
]

let jobCounter = 700

function cloneJob(job: PortalPrintJob): PortalPrintJob {
  return { ...job }
}

export function listPortalJobs() {
  const currentProfile = getCurrentPortalProfileRecord()
  return portalJobsData.filter((job) => job.userId === currentProfile.id).map(cloneJob)
}

export function cancelPortalJob(jobId: string) {
  const currentProfile = getCurrentPortalProfileRecord()
  const job = portalJobsData.find((entry) => entry.id === jobId && entry.userId === currentProfile.id)

  if (!job || job.status !== 'Pending Release') {
    return false
  }

  job.status = 'Cancelled'
  job.details = 'Cancelled by the user before device release.'
  return true
}

export function createPortalJob(draft: PortalSubmissionDraft) {
  const currentProfile = getCurrentPortalProfileRecord()
  const selectedQueue = getDefaultPortalQueueForCurrentUser()

  if (!selectedQueue || !selectedQueue.available) {
    return undefined
  }

  if (draft.colorMode === 'Color' && selectedQueue.colorMode !== 'Color') {
    return undefined
  }

  jobCounter += 1
  const totalPages = draft.pages * draft.copies
  const duplexFactor = draft.duplex ? 0.9 : 1
  const colorFactor = draft.colorMode === 'Color' ? 2 : 1
  const cost = Number((totalPages * selectedQueue.costPerPage * duplexFactor * colorFactor).toFixed(2))

  const createdJob: PortalPrintJob = {
    id: `JOB-${jobCounter.toString(36).toUpperCase()}`,
    userId: currentProfile.id,
    fileName: draft.fileName,
    submittedAt: '2026-04-07 10:20',
    printerName: selectedQueue.printerName,
    queueName: selectedQueue.name,
    pages: draft.pages,
    copies: draft.copies,
    totalPages,
    colorMode: draft.colorMode,
    duplex: draft.duplex,
    paperType: draft.paperType,
    cost,
    status: 'Pending Release',
    retentionDeadline: '2026-04-08 10:20',
    details: `Submitted through the supplementary web portal to ${selectedQueue.name} and waiting for release at ${selectedQueue.printerName}.`,
  }

  portalJobsData = [createdJob, ...portalJobsData]
  currentProfile.quotaUsed += totalPages
  weeklyUsageSeed[weeklyUsageSeed.length - 1] += totalPages

  return cloneJob(createdJob)
}

export function listPortalQueuesForCurrentUser() {
  const currentProfile = getCurrentPortalProfileRecord()
  const role = currentProfile.role
  const printerById = new Map(adminPrinters.map((printer) => [printer.id, printer]))
  const adminQueues = listAdminQueues()
  const defaultQueueId = currentProfile.assignedQueueId

  const mappedQueues = adminQueues.map<PortalQueueOption>((queue) => {
    const assignedPrinter = queue.printerIds
      .map((printerId) => printerById.get(printerId))
      .find(Boolean)

    const accessAllowed =
      role === 'Student'
        ? queue.audience === 'Students' || queue.audience === 'Mixed'
        : queue.audience === 'Faculty' || queue.audience === 'Mixed' || queue.audience === 'Staff'

    const available = accessAllowed && queue.enabled && queue.status === 'Online'
    const reason = !accessAllowed
      ? 'Not available for your role'
      : !queue.enabled || queue.status !== 'Online'
        ? 'Currently unavailable'
        : undefined

    return {
      id: queue.id,
      name: queue.name,
      location: assignedPrinter?.location ?? queue.department,
      queueHost: queue.hostedOn,
      printerName: assignedPrinter?.name ?? 'Printer assignment pending',
      pendingJobs: queue.pendingJobs,
      releaseMode: queue.releaseMode,
      access: queue.audience,
      colorMode: queue.colorMode,
      available,
      isDefault: queue.id === defaultQueueId,
      submissionPath: queue.id === defaultQueueId ? 'Default web upload route' : 'Eligible campus queue',
      reason,
      costPerPage: queue.costPerPage,
    }
  })

  return mappedQueues
}

export function getDefaultPortalQueueForCurrentUser() {
  return listPortalQueuesForCurrentUser().find((queue) => queue.isDefault)
}

export function getPortalWeeklyUsage() {
  return [...weeklyUsageSeed]
}
