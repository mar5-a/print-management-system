import { api } from '@/lib/api'
import type { TechAlert } from '@/types/technician'

type TechDashboardPrinter = {
  id: string
  name: string
  location: string
  queue: string
  status: 'Online' | 'Offline' | 'Maintenance'
  pendingJobs: number
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

function toNumber(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : (value as number)
  return Number.isFinite(n) ? n : 0
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPrinter(p: any): TechDashboardPrinter {
  const statusMap: Record<string, TechDashboardPrinter['status']> = {
    online: 'Online',
    offline: 'Offline',
    maintenance: 'Maintenance',
    error: 'Offline',
  }

  return {
    id: p.id,
    name: p.name,
    location: p.location ?? '—',
    queue: p.queue_name ?? 'Unassigned',
    status: statusMap[p.status] ?? 'Offline',
    pendingJobs: toNumber(p.pending_jobs),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAlert(a: any): TechAlert {
  return {
    id: a.id,
    title: a.title,
    description: a.description ?? '',
    severity: a.severity ?? 'warning',
    source: 'device',
    deviceName: a.printer_name ?? undefined,
    createdAt: formatDateTime(a.detected_at),
    acknowledged: false,
  }
}

export async function getTechDashboardSnapshot() {
  const [dashboardRes, usersRes, printersRes] = await Promise.all([
    api.get<{ data: { alerts: { open: number }; printers: { online: number; needs_attention: number }; pendingJobs: { total: number }; activeAlerts: unknown[] } }>('/dashboard/tech'),
    api.get<{ data: Array<{ is_suspended: boolean; is_active: boolean }> }>('/users?limit=100'),
    api.get<{ data: unknown[] }>('/printers?limit=100'),
  ])

  const users = usersRes.data
  const printers = printersRes.data.map(mapPrinter)
  const alerts = dashboardRes.data.activeAlerts.map(mapAlert)

  const activeUsers = users.filter((u) => !u.is_suspended && u.is_active).length
  const suspendedUsers = users.filter((u) => u.is_suspended).length
  const onlinePrinters = toNumber(dashboardRes.data.printers.online)
  const problemPrinters = toNumber(dashboardRes.data.printers.needs_attention)
  const pendingJobs = toNumber(dashboardRes.data.pendingJobs.total)
  const unacknowledgedAlerts = toNumber(dashboardRes.data.alerts.open)

  return {
    activeUsers,
    suspendedUsers,
    onlinePrinters,
    problemPrinters,
    pendingJobs,
    unacknowledgedAlerts,
    printers,
    alerts,
  }
}
