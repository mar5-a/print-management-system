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
