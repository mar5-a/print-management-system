import { adminPrinters, adminUsers } from '@/mocks/admin-store'
import { isQueueDeleteBlocked } from '@/lib/status'
import { listQueues } from '../queues/api'

const trendValues = [
  180, 45, 20, 95, 170, 145, 205, 210, 120, 18, 25, 260, 190,
  680, 90, 12, 32, 260, 82, 12, 18, 590, 70, 205, 15, 80,
]

const trendLabels = ['01', '03', '05', '07', '09', '11', '13', '15', '17', '19', '21', '23']

const recentPrintRows = [
  { id: 'dash-log-01', user: 'john.smith', device: 'Printer A1', pages: 25, status: 'Completed' },
  { id: 'dash-log-02', user: 'emma.wilson', device: 'Printer D1', pages: 12, status: 'Held' },
  { id: 'dash-log-03', user: 'michael.brown', device: 'Printer B2', pages: 44, status: 'Completed' },
  { id: 'dash-log-04', user: 'lisa.anderson', device: 'Printer C3', pages: 8, status: 'Failed' },
]

export function getDashboardSnapshot() {
  const queues = listQueues()
  const queueMetrics = {
    total: queues.length,
    blocked: queues.filter(isQueueDeleteBlocked).length,
    secureRelease: queues.filter((queue) => queue.releaseMode === 'Secure Release').length,
    disabled: queues.filter((queue) => !queue.enabled).length,
  }

  return {
    adminPrinters,
    adminUsers,
    trendLabels,
    trendValues,
    recentPrintRows,
    queueMetrics,
  }
}
