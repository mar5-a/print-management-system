import { api } from '@/lib/api'
export type RecentPrintRow = {
  id: string
  time: string
  user: string
  device: string
  pages: number
  cost: number
  status: string
}

export type DashboardPrinterStatus = {
  id: string
  name: string
  status: 'Online' | 'Offline' | 'Maintenance' | string
  pendingJobs: number
}

export type PrintActivityRange = 'week' | 'month'

export type PrintActivityPoint = {
  date: string
  label: string
  pages: number
}

export type PrintActivitySnapshot = {
  range: PrintActivityRange
  points: PrintActivityPoint[]
  totalPages: number
}

export type PrintLogFilters = {
  search: string
  status: string
  device: string
  page: number
  limit: number
}

export type PrintLogFilterOption = {
  value: string
  label: string
}

export type PrintLogPage = {
  rows: RecentPrintRow[]
  total: number
  page: number
  limit: number
  totalPages: number
  statusOptions: PrintLogFilterOption[]
  deviceOptions: PrintLogFilterOption[]
}

interface ApiData<T> {
  data: T
}

interface BackendPrintLog {
  id: string
  date: string
  user: string
  device: string
  pages: number
  cost: number
  status: string
}

interface BackendPrintLogPage {
  rows: BackendPrintLog[]
  total: number
  page: number
  limit: number
  totalPages: number
  statusOptions: string[]
  deviceOptions: string[]
}

interface BackendPrintActivitySnapshot {
  range: PrintActivityRange
  points: Array<{
    date: string
    label: string
    pages: number
  }>
  totalPages: number
}

interface BackendDashboardSnapshot {
  active_users: number
  suspended_users: number
  total_printers: number
  device_count: number
  recent_errors: number
  recent_warnings: number
  total_pages: number
  pages_today: number
  held_jobs: number
  active_user_clients: number
  system_uptime: string
  print_activity_labels: string[]
  print_activity_values: number[]
  printer_statuses: Array<{
    id: string
    name: string
    status: string
    pending_jobs: number
  }>
}

export async function getDashboardSnapshot() {
  const response = await api.get<ApiData<BackendDashboardSnapshot>>('/dashboard')

  return {
    activeUsers: response.data.active_users,
    suspendedUsers: response.data.suspended_users,
    printersCount: response.data.total_printers,
    devicesCount: response.data.device_count,
    recentErrors: response.data.recent_errors,
    recentWarnings: response.data.recent_warnings,
    totalPages: response.data.total_pages,
    pagesToday: response.data.pages_today,
    heldJobs: response.data.held_jobs,
    activeUserClients: response.data.active_user_clients,
    systemUptime: response.data.system_uptime,
    trendLabels: response.data.print_activity_labels,
    trendValues: response.data.print_activity_values,
    printerStatuses: response.data.printer_statuses.map((printer) => ({
      id: printer.id,
      name: printer.name,
      status: formatPrinterStatus(printer.status),
      pendingJobs: printer.pending_jobs,
    })),
  }
}

export async function listRecentPrintRows(filters: PrintLogFilters): Promise<PrintLogPage> {
  const searchParams = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  })

  if (filters.search.trim()) {
    searchParams.set('search', filters.search.trim())
  }

  if (filters.status !== 'all') {
    searchParams.set('status', filters.status)
  }

  if (filters.device !== 'all') {
    searchParams.set('device', filters.device)
  }

  const response = await api.get<ApiData<BackendPrintLogPage>>(`/dashboard/print-logs?${searchParams.toString()}`)

  return {
    ...response.data,
    rows: response.data.rows.map((row) => ({
      id: row.id,
      time: formatPrintLogTime(row.date),
      user: row.user,
      device: row.device,
      pages: row.pages,
      cost: row.cost,
      status: formatStatus(row.status),
    })),
    statusOptions: response.data.statusOptions.map((option) => ({
      value: option,
      label: formatStatus(option),
    })),
    deviceOptions: response.data.deviceOptions.map((option) => ({
      value: option,
      label: option,
    })),
  }
}

export async function getPrintActivity(range: PrintActivityRange): Promise<PrintActivitySnapshot> {
  const response = await api.get<ApiData<BackendPrintActivitySnapshot>>(`/dashboard/print-activity?range=${range}`)

  return {
    range: response.data.range,
    points: response.data.points,
    totalPages: response.data.totalPages,
  }
}

function formatPrintLogTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  const rawHours = date.getHours()
  const hours = rawHours % 12 || 12
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const period = rawHours >= 12 ? 'PM' : 'AM'

  return `${month} ${day}, ${year} ${hours}:${minutes} ${period}`
}

function formatStatus(status: string) {
  return status
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

function formatPrinterStatus(status: string): DashboardPrinterStatus['status'] {
  return formatStatus(status) as DashboardPrinterStatus['status']
}
