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
  formData.append('pageCount', String(draft.pages))
  formData.append('copyCount', String(draft.copies))
  formData.append('colorMode', draft.colorMode === 'Color' ? 'color' : 'bw')
  formData.append('duplex', String(draft.duplex))
  formData.append('paperType', draft.paperType.toLowerCase())

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
    printerName: job.printer_name ?? 'Pending release',
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
  }
}

function mapStatus(status: string): PortalPrintJob['status'] {
  if (status === 'held') return 'Pending Release'
  if (status === 'failed') return 'Failed'
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'completed') return 'Completed'
  return 'In Progress'
}

function statusDetails(status: string) {
  if (status === 'held') return 'Stored by the backend and waiting for release.'
  if (status === 'sent_to_printer') return 'Submitted to the printer connector.'
  if (status === 'queued') return 'Accepted by the Windows print queue connector.'
  return 'Tracked by the backend job lifecycle.'
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export { mapJob as mapPortalJobFromBackend }
