import { api } from '@/lib/api'
import { listAdminQueues } from '@/mocks/admin-store'
import type { AdminPrinter } from '@/types/admin'

interface BackendPrinter {
  id: string
  name: string
  model: string | null
  location: string | null
  queue_name: string
  status: string
  pending_jobs: number
  released_today: number
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

export async function listPrinters() {
  const response = await api.get<PaginatedPrinters>('/printers?limit=100')
  return response.data.map(mapPrinter)
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

export function listPrinterQueueNames() {
  return ['Unassigned', ...new Set(listAdminQueues().map((queue) => queue.name))]
}

function mapStatus(status: string): AdminPrinter['status'] {
  if (status === 'online') return 'Online'
  if (status === 'maintenance') return 'Maintenance'
  return 'Offline'
}

function mapPrinter(printer: BackendPrinter): AdminPrinter {
  return {
    id: printer.id,
    name: printer.name,
    softwareVersion: 'Backend',
    hostedOn: printer.connector_type === 'windows_queue' ? 'Windows connector' : 'Raw socket connector',
    model: printer.model ?? 'Unknown model',
    location: printer.location ?? 'Unassigned',
    queue: printer.queue_name,
    deviceGroup: 'Backend managed',
    alternateId: printer.connector_target ?? printer.id,
    status: mapStatus(printer.status),
    pendingJobs: printer.pending_jobs,
    releasedToday: printer.released_today,
    toner: printer.toner_level,
    holdReleaseMode: 'Secure Release',
    failureMode: 'Hold until redirected',
    ipAddress: printer.ip_address ?? '',
    serialNumber: printer.serial_number ?? '—',
    notes: printer.notes,
  }
}
