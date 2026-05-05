import { api } from '@/lib/api'

const DEFAULT_TREND_LABELS = ['01', '03', '05', '07', '09', '11', '13', '15', '17', '19', '21', '23']

export async function getDashboardSnapshot() {
  const res = await api.get<{ data: {
    users: { total: number; active: number; suspended: number }
    printers: { total: number; online: number; offline: number; maintenance: number; error: number }
    queues: { total: number; active: number; disabled: number; secure_release: number }
    jobs: { total: number; pending: number; completed_today: number; failed: number }
    quota: { total_used: number; total_allocated: number }
    recentJobs: Array<{ id: string; username: string; queue_name: string; printer_name?: string; total_pages: number; status: string }>
  } }>('/dashboard/admin')

  const d = res.data
  const perUserQuota = d.users.active > 0 ? Math.floor(d.quota.total_used / d.users.active) : 0
  const perPrinterJobs = d.printers.online > 0 ? Math.floor(d.jobs.pending / d.printers.online) : 0

  const adminUsers = [
    ...Array.from({ length: d.users.active }, () => ({ status: 'Active' as const, quotaUsed: perUserQuota })),
    ...Array.from({ length: d.users.suspended }, () => ({ status: 'Suspended' as const, quotaUsed: 0 })),
  ]

  const adminPrinters = [
    ...Array.from({ length: d.printers.online }, () => ({ status: 'Online' as const, pendingJobs: perPrinterJobs })),
    ...Array.from({ length: d.printers.offline + d.printers.error }, () => ({ status: 'Offline' as const, pendingJobs: 0 })),
    ...Array.from({ length: d.printers.maintenance }, () => ({ status: 'Maintenance' as const, pendingJobs: 0 })),
  ]

  const recentPrintRows = d.recentJobs.map((j) => ({
    id: j.id,
    user: j.username,
    device: j.printer_name ?? j.queue_name,
    pages: j.total_pages,
    status: j.status.charAt(0).toUpperCase() + j.status.slice(1),
  }))

  const trendValues = [...Array.from({ length: 12 }, () => 0), d.jobs.completed_today]

  return {
    adminUsers,
    adminPrinters,
    trendLabels: DEFAULT_TREND_LABELS,
    trendValues,
    recentPrintRows,
    queueMetrics: {
      total: d.queues.total,
      blocked: 0,
      secureRelease: d.queues.secure_release,
      disabled: d.queues.disabled,
    },
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
