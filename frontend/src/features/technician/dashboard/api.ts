import { api } from '@/lib/api'
import type { TechAlert } from '@/types/technician'
import { type BackendTechAlert, mapBackendTechAlert } from '../alerts/api'

interface ApiData<T> {
  data: T
}

export interface TechDashboardPrinter {
  id: string
  name: string
  status: 'Online' | 'Offline' | 'Maintenance' | string
  queue: string
  pendingJobs: number
  location: string
}

export interface TechDashboardSnapshot {
  activeUsers: number
  suspendedUsers: number
  onlinePrinters: number
  problemPrinters: number
  pendingJobs: number
  unacknowledgedAlerts: number
  printers: TechDashboardPrinter[]
  alerts: TechAlert[]
}

interface BackendTechDashboardSnapshot {
  active_users: number
  suspended_users: number
  online_printers: number
  problem_printers: number
  held_jobs: number
  active_alerts: number
  alerts: BackendTechAlert[]
  printer_health: Array<{
    id: string
    name: string
    status: string
    queue: string
    held_jobs: number
    location: string
  }>
}

export async function getTechDashboardSnapshot(): Promise<TechDashboardSnapshot> {
  const response = await api.get<ApiData<BackendTechDashboardSnapshot>>('/dashboard/technician')

  return {
    activeUsers: response.data.active_users,
    suspendedUsers: response.data.suspended_users,
    onlinePrinters: response.data.online_printers,
    problemPrinters: response.data.problem_printers,
    pendingJobs: response.data.held_jobs,
    unacknowledgedAlerts: response.data.active_alerts,
    printers: response.data.printer_health.map((printer) => ({
      id: printer.id,
      name: printer.name,
      status: formatPrinterStatus(printer.status),
      queue: printer.queue,
      pendingJobs: printer.held_jobs,
      location: printer.location,
    })),
    alerts: response.data.alerts.map(mapBackendTechAlert),
  }
}

function formatPrinterStatus(status: string): TechDashboardPrinter['status'] {
  return status
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ') as TechDashboardPrinter['status']
}
