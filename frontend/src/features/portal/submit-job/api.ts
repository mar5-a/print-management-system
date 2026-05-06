import { api } from '@/lib/api'
import { getCurrentPortalUserProfile } from '@/features/portal/session/api'
import type { PortalPrintJob, PortalQueueOption, PortalSubmissionDraft } from '@/types/portal'

interface BackendQueue {
  id: string
  name: string
  queue_type: string
  status: string
  is_default: boolean
  release_mode: string
  retention_hours: number
  cost_per_page: number
  printer_count: number
  held_jobs: number
}

interface BackendJob {
  id: string
  file_name: string
  submitted_at: string
  printer_name: string | null
  queue_name: string
  page_count: number
  copy_count: number
  total_pages: number
  color_mode: string
  duplex: boolean
  paper_type: string
  estimated_cost: number
  final_cost: number | null
  status: string
  expires_at?: string
  failure_reason?: string | null
  device_storage_username?: string | null
  device_storage_job_name?: string | null
  device_storage_submitted_at?: string | null
}

interface ApiData<T> {
  data: T
}

export async function getPortalSubmissionSnapshot() {
  const queuesResponse = await api.get<ApiData<BackendQueue[]>>('/portal/queues')
  const queues = queuesResponse.data.map(mapQueue)

  return {
    profile: getCurrentPortalUserProfile(),
    queues,
    defaultQueue: queues.find((queue) => queue.isDefault) ?? queues[0],
  }
}

export async function submitPortalJob(draft: PortalSubmissionDraft, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('copyCount', String(draft.copies))

  const response = await api.post<ApiData<BackendJob>>('/jobs', formData)
  const portalJob = mapJob(response.data)

  return {
    portalJob,
    backendResult: response.data,
  }
}

function mapQueue(queue: BackendQueue): PortalQueueOption {
  return {
    id: queue.id,
    name: queue.name,
    location: 'Assigned campus route',
    queueHost: 'Backend policy route',
    printerName: `${queue.printer_count} assigned printer${queue.printer_count === 1 ? '' : 's'}`,
    pendingJobs: queue.held_jobs,
    releaseMode: queue.release_mode === 'immediate' ? 'Immediate' : 'Secure Release',
    access: queue.queue_type === 'faculty' ? 'Faculty' : queue.queue_type === 'staff' ? 'Staff' : queue.queue_type === 'mixed' ? 'Mixed' : 'Students',
    colorMode: 'Black & White',
    available: queue.status === 'active',
    isDefault: queue.is_default,
    submissionPath: 'Web upload',
    costPerPage: queue.cost_per_page,
  }
}

function mapJob(job: BackendJob): PortalPrintJob {
  return {
    id: job.id,
    userId: '',
    fileName: job.file_name,
    submittedAt: formatDate(job.submitted_at),
    printerName: job.printer_name ?? (job.status === 'held' ? 'Ready to send' : 'Pending printer'),
    queueName: job.queue_name,
    pages: job.page_count,
    copies: job.copy_count,
    totalPages: job.total_pages,
    colorMode: job.color_mode === 'color' ? 'Color' : 'Black & White',
    duplex: job.duplex,
    paperType: job.paper_type === 'glossy' ? 'Glossy' : job.paper_type === 'heavy' ? 'Heavy' : 'Standard',
    cost: Number(job.final_cost ?? job.estimated_cost ?? 0),
    status: mapStatus(job.status),
    retentionDeadline: job.expires_at ? formatDate(job.expires_at) : undefined,
    details: job.failure_reason ?? statusDetails(job.status),
    deviceStorageUsername: job.device_storage_username ?? null,
    deviceStorageJobName: job.device_storage_job_name ?? null,
    deviceStorageSubmittedAt: job.device_storage_submitted_at ? formatDate(job.device_storage_submitted_at) : undefined,
  }
}

function mapStatus(status: string): PortalPrintJob['status'] {
  if (status === 'held') return 'Ready to send'
  if (status === 'stored_on_device') return 'Stored on printer'
  if (status === 'failed') return 'Failed'
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'completed') return 'Completed'
  return 'In Progress'
}

function statusDetails(status: string) {
  if (status === 'held') return 'Stored by the backend and ready to send to printer memory.'
  if (status === 'stored_on_device') return 'Stored in printer memory. Retrieve it from the printer panel with your PIN.'
  if (status === 'submitting_to_device_storage') return 'Sending the job to printer memory.'
  if (status === 'sent_to_printer') return 'Submitted to the printer connector.'
  if (status === 'queued') return 'Accepted by the Windows print queue connector.'
  return 'Tracked by the backend job lifecycle.'
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export { mapJob as mapPortalJobFromBackend }
