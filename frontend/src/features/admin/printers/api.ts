import { api } from '@/lib/api'
import { listAdminQueues } from '@/mocks/admin-store'
import type { AdminPrinter } from '@/types/admin'

interface BackendPrinter {
  id: string
  name: string
  model: string | null
  hosted_on: string | null
  location: string | null
  queue_name: string
  status: string
  is_color: boolean
  release_mode?: string
  pending_jobs: number
  released_today: number
  total_pages?: number
  total_jobs?: number
  toner_level: number
  ip_address: string | null
  serial_number: string | null
  notes: string
  connector_type: string
  connector_target: string | null
}

interface PaginatedPrinters {
  data: BackendPrinter[]
}

interface ApiData<T> {
  data: T
}

export interface ListPrintersInput {
  search?: string
  status?: AdminPrinter['status'] | 'All statuses'
  limit?: number
}

export interface UpdatePrinterInput {
  name: string
  hostedOn: string
  ipAddress: string
  status: AdminPrinter['status']
  model: string
  serialNumber: string
  toner: number
  location: string
  holdReleaseMode: AdminPrinter['holdReleaseMode']
  isColor: boolean
}

export type CreatePrinterInput = UpdatePrinterInput

export async function listPrinters(input: ListPrintersInput = {}) {
  const params = new URLSearchParams()
  const search = input.search?.trim()

  params.set('limit', String(input.limit ?? 100))

  if (search) {
    params.set('search', search)
  }

  if (input.status && input.status !== 'All statuses') {
    params.set('status', mapStatusToBackend(input.status))
  }

  const response = await api.get<PaginatedPrinters>(`/printers?${params.toString()}`)
  return response.data.map(mapPrinter)
}

export async function createPrinter(input: CreatePrinterInput) {
  const response = await api.post<ApiData<BackendPrinter>>('/printers', {
    name: input.name.trim(),
    hostedOn: input.hostedOn.trim(),
    ipAddress: input.ipAddress.trim(),
    status: mapStatusToBackend(input.status),
    model: input.model.trim(),
    serialNumber: input.serialNumber.trim(),
    tonerLevel: Math.max(0, Math.min(100, input.toner)),
    location: input.location.trim(),
    releaseMode: mapReleaseModeToBackend(input.holdReleaseMode),
    isColor: input.isColor,
  })

  return mapPrinter(response.data)
}

export async function getPrinterByIdOrUndefined(printerId?: string) {
  if (!printerId) return undefined

  try {
    const response = await api.get<ApiData<BackendPrinter>>(`/printers/${printerId}`)
    return mapPrinter(response.data)
  } catch {
    return undefined
  }
}

export async function updatePrinter(printerId: string, input: UpdatePrinterInput) {
  const response = await api.patch<ApiData<BackendPrinter>>(`/printers/${printerId}`, {
    name: input.name.trim(),
    hostedOn: input.hostedOn.trim(),
    ipAddress: input.ipAddress.trim(),
    status: mapStatusToBackend(input.status),
    model: input.model.trim(),
    serialNumber: input.serialNumber.trim(),
    tonerLevel: Math.max(0, Math.min(100, input.toner)),
    location: input.location.trim(),
    releaseMode: mapReleaseModeToBackend(input.holdReleaseMode),
    isColor: input.isColor,
  })

  return mapPrinter(response.data)
}

export async function deletePrinter(printerId: string) {
  await api.delete<void>(`/printers/${printerId}`)
}

export function listPrinterQueueNames() {
  return ['Unassigned', ...new Set(listAdminQueues().map((queue) => queue.name))]
}

function mapStatus(status: string): AdminPrinter['status'] {
  if (status === 'online') return 'Online'
  if (status === 'maintenance') return 'Maintenance'
  return 'Offline'
}

function mapStatusToBackend(status: AdminPrinter['status']) {
  if (status === 'Online') return 'online'
  if (status === 'Maintenance') return 'maintenance'
  return 'offline'
}

function mapReleaseMode(releaseMode?: string): AdminPrinter['holdReleaseMode'] {
  return releaseMode === 'immediate' ? 'Immediate' : 'Secure Release'
}

function mapReleaseModeToBackend(releaseMode: AdminPrinter['holdReleaseMode']) {
  return releaseMode === 'Immediate' ? 'immediate' : 'secure_release'
}

function mapPrinter(printer: BackendPrinter): AdminPrinter {
  return {
    id: printer.id,
    name: printer.name,
    softwareVersion: 'Backend',
    hostedOn:
      printer.hosted_on ??
      (printer.connector_type === 'windows_queue' ? 'Windows connector' : 'Raw socket connector'),
    model: printer.model ?? 'Unknown model',
    location: printer.location ?? 'Unassigned',
    queue: printer.queue_name,
    deviceGroup: 'Backend managed',
    alternateId: printer.connector_target ?? printer.id,
    status: mapStatus(printer.status),
    pendingJobs: printer.pending_jobs,
    releasedToday: printer.released_today,
    totalPages: Number(printer.total_pages ?? 0),
    totalJobs: Number(printer.total_jobs ?? 0),
    isColor: Boolean(printer.is_color),
    toner: printer.toner_level,
    holdReleaseMode: mapReleaseMode(printer.release_mode),
    failureMode: 'Hold until redirected',
    ipAddress: printer.ip_address ?? '',
    serialNumber: printer.serial_number ?? '—',
    notes: printer.notes,
  }
}
