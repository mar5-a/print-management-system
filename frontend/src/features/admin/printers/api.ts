import { api } from '@/lib/api'
import type { AdminPrinter } from '@/types/admin'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPrinter(p: any): AdminPrinter {
  const statusMap: Record<string, AdminPrinter['status']> = {
    online: 'Online', offline: 'Offline', maintenance: 'Maintenance', error: 'Offline',
  }
  return {
    id: p.id,
    name: p.name,
    softwareVersion: '1.0',
    hostedOn: 'ccm-printer',
    model: p.model ?? '—',
    location: p.location ?? '—',
    queue: p.queue_name ?? 'Unassigned',
    deviceGroup: '—',
    alternateId: '—',
    status: statusMap[p.status] ?? 'Offline',
    pendingJobs: 0,
    releasedToday: 0,
    toner: p.toner_level ?? 0,
    holdReleaseMode: 'Secure Release',
    failureMode: 'Hold until redirected',
    ipAddress: p.ip_address ?? '—',
    serialNumber: p.serial_number ?? '—',
    notes: p.notes ?? '',
  }
}

export async function listPrinters(): Promise<AdminPrinter[]> {
  const res = await api.get<{ data: AdminPrinter[] }>('/printers?limit=100')
  return res.data.map(mapPrinter)
}

export async function getPrinterByIdOrUndefined(printerId?: string): Promise<AdminPrinter | undefined> {
  if (!printerId) return undefined
  try {
    const res = await api.get<{ data: AdminPrinter }>(`/printers/${printerId}`)
    return mapPrinter(res.data)
  } catch {
    return undefined
  }
}

export async function listPrinterQueueNames(): Promise<string[]> {
  const printers = await listPrinters()
  return ['Unassigned', ...new Set(printers.map(p => p.queue).filter(q => q !== 'Unassigned'))]
}
