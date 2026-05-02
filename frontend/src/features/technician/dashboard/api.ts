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
  const [dashboardRes, usersRes, printersRes, alertsRes] = await Promise.all([
    api.get<{ data: { active_users: number; suspended_users: number; online_printers: number; problem_printers: number; held_jobs: number; open_alerts: number } }>('/dashboard'),
    api.get<{ data: Array<{ is_suspended: boolean; is_active: boolean }> }>('/users?limit=100'),
    api.get<{ data: unknown[] }>('/printers?limit=100'),
    api.get<{ data: unknown[] }>('/alerts?limit=20'),
  ])

  const users = usersRes.data
  const printers = printersRes.data.map(mapPrinter)
  const alerts = alertsRes.data.map(mapAlert)

  const activeUsers = toNumber(dashboardRes.data.active_users)
  const suspendedUsers = toNumber(dashboardRes.data.suspended_users)
  const onlinePrinters = toNumber(dashboardRes.data.online_printers)
  const problemPrinters = toNumber(dashboardRes.data.problem_printers)
  const pendingJobs = toNumber(dashboardRes.data.held_jobs)
  const unacknowledgedAlerts = toNumber(dashboardRes.data.open_alerts)

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
