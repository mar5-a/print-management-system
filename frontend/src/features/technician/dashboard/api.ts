import { listTechAlerts, listTechPrinters, listTechUsers } from '@/mocks/technician-store'

export function getTechDashboardSnapshot() {
  const users = listTechUsers()
  const printers = listTechPrinters()
  const alerts = listTechAlerts()

  const activeUsers = users.filter((u) => u.status === 'Active').length
  const suspendedUsers = users.filter((u) => u.status === 'Suspended').length
  const onlinePrinters = printers.filter((p) => p.status === 'Online').length
  const problemPrinters = printers.filter((p) => p.status !== 'Online').length
  const pendingJobs = printers.reduce((sum, p) => sum + p.pendingJobs, 0)
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged).length

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
