import { api } from '@/lib/api'
import type { AdminPrinter, AdminGroup, AdminQueue } from '@/types/admin'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQueue(q: any): AdminQueue {
  const releaseMap: Record<string, AdminQueue['releaseMode']> = {
    secure_release: 'Secure Release',
    immediate: 'Immediate',
    kiosk_release: 'Kiosk Release',
  }
  const audienceMap: Record<string, AdminQueue['audience']> = {
    students: 'Students',
    faculty: 'Faculty',
    staff: 'Staff',
    mixed: 'Mixed',
  }
  const statusMap: Record<string, AdminQueue['status']> = {
    online: 'Online', offline: 'Offline', maintenance: 'Maintenance',
  }
  return {
    id: q.id,
    name: q.name,
    description: q.description ?? '',
    hostedOn: 'ccm-print-server',
    status: statusMap[q.status] ?? 'Offline',
    enabled: q.enabled ?? true,
    releaseMode: releaseMap[q.release_mode] ?? 'Secure Release',
    audience: audienceMap[q.audience] ?? 'Mixed',
    department: q.department_name ?? '—',
    allowedGroups: [],
    colorMode: 'Black & White',
    defaultDuplex: true,
    costPerPage: parseFloat(q.cost_per_page ?? '0.05'),
    printerIds: (q.printers ?? []).map((p: { id: string }) => p.id),
    pendingJobs: parseInt(q.pending_jobs ?? '0', 10),
    heldJobs: 0,
    releasedToday: 0,
    lastActivity: '—',
    autoDeleteAfterHours: q.retention_hours ?? 24,
    failureMode: 'Hold until redirected',
    notes: '',
    queueLogs: [],
  }
}

export async function listQueues(): Promise<AdminQueue[]> {
  const res = await api.get<{ data: AdminQueue[] }>('/queues?limit=100')
  return res.data.map(mapQueue)
}

export async function getQueueByIdOrUndefined(queueId?: string): Promise<AdminQueue | undefined> {
  if (!queueId) return undefined
  try {
    const res = await api.get<{ data: AdminQueue }>(`/queues/${queueId}`)
    return mapQueue(res.data)
  } catch {
    return undefined
  }
}

export async function listQueuePrinters(): Promise<AdminPrinter[]> {
  const res = await api.get<{ data: AdminPrinter[] }>('/printers?limit=100')
  return res.data
}

export async function listQueueGroups(): Promise<AdminGroup[]> {
  const res = await api.get<{ data: AdminGroup[] }>('/groups')
  return res.data
}

export async function createQueue(queue: AdminQueue): Promise<AdminQueue> {
  const res = await api.post<{ data: AdminQueue }>('/queues', {
    name: queue.name,
    description: queue.description,
    releaseMode: queue.releaseMode === 'Secure Release' ? 'secure_release' : queue.releaseMode === 'Immediate' ? 'immediate' : 'kiosk_release',
    audience: queue.audience.toLowerCase(),
    retentionHours: queue.autoDeleteAfterHours,
    costPerPage: queue.costPerPage,
    printerIds: queue.printerIds,
  })
  return mapQueue(res.data)
}

export async function saveQueue(queue: AdminQueue): Promise<AdminQueue> {
  const res = await api.patch<{ data: AdminQueue }>(`/queues/${queue.id}`, {
    name: queue.name,
    description: queue.description,
    enabled: queue.enabled,
    releaseMode: queue.releaseMode === 'Secure Release' ? 'secure_release' : queue.releaseMode === 'Immediate' ? 'immediate' : 'kiosk_release',
    audience: queue.audience.toLowerCase(),
    costPerPage: queue.costPerPage,
    printerIds: queue.printerIds,
  })
  return mapQueue(res.data)
}

export async function removeQueue(queueId: string): Promise<void> {
  await api.delete(`/queues/${queueId}`)
}
