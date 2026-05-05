import {
  AlertTriangle,
  ArrowRightLeft,
  Ban,
  Clock3,
  FileText,
  Power,
  Printer,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { AdvancedFilterPanel } from '../components/ui/advanced-filter-panel'
import { DataTable } from '../components/ui/data-table'
import { PageHeader } from '../components/ui/page-header'
import { PrintActivityChart } from '../components/dashboard/PrintActivityChart'
import { PrinterStatusPanel } from '../components/dashboard/PrinterStatusPanel'
import { RecentPrintLogsPanel } from '../components/dashboard/RecentPrintLogsPanel'
import { SummaryStat } from '../components/dashboard/SummaryStat'
import { SystemStatusPanel } from '../components/dashboard/SystemStatusPanel'
import { getDashboardSnapshot } from '../features/admin/dashboard/api'

export function DashboardPage() {
  const [snap, setSnap] = useState<Awaited<ReturnType<typeof getDashboardSnapshot>> | null>(null)
  useEffect(() => { getDashboardSnapshot().then(setSnap) }, [])
  const adminUsers = snap?.adminUsers ?? []
  const adminPrinters = snap?.adminPrinters ?? []
  const recentPrintRows = snap?.recentPrintRows ?? []
  const trendLabels = snap?.trendLabels ?? ['01', '03', '05', '07', '09', '11', '13', '15', '17', '19', '21', '23']
  const trendValues = snap?.trendValues ?? Array.from({ length: 13 }, () => 0)
  const [dateRange, setDateRange] = useState('Last 7 days')
  const [department, setDepartment] = useState('All departments')
  const [device, setDevice] = useState('All devices')
  const [userFilter, setUserFilter] = useState('All users')
  const activeUsers = adminUsers.filter((user) => user.status === 'Active').length
  const suspendedUsers = adminUsers.filter((user) => user.status === 'Suspended').length
  const printersCount = adminPrinters.length
  const devicesCount = adminPrinters.length
  const offlineCount = adminPrinters.filter((printer) => printer.status === 'Offline').length
  const maintenanceCount = adminPrinters.filter((printer) => printer.status === 'Maintenance').length
  const totalPages = adminUsers.reduce((total, user) => total + user.quotaUsed, 0)
  const pagesToday = trendValues[trendValues.length - 1]
  const holdReleaseJobs = adminPrinters.reduce((total, printer) => total + printer.pendingJobs, 0)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      try {
        const nextSnapshot = await getDashboardSnapshot()

        if (isMounted) {
          setSnapshot(nextSnapshot)
          setError(null)
        }
      } catch (nextError) {
        if (isMounted) {
          setError(nextError instanceof Error ? nextError.message : 'Unable to load dashboard.')
        }
      }
    }

    void loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  if (!snapshot) {
    return (
      <div className="min-w-0">
        <PageHeader eyebrow="Dashboard" title="Dashboard" />
        <section className="ui-panel px-5 py-4 text-sm text-slate-600">
          {error ?? 'Loading dashboard...'}
        </section>
      </div>
    )
  }

  const {
    activeUsers,
    activeUserClients,
    devicesCount,
    heldJobs,
    pagesToday,
    printerStatuses,
    printersCount,
    recentErrors,
    recentWarnings,
    suspendedUsers,
    systemUptime,
    totalPages,
  } = snapshot

  return (
    <div className="min-w-0">
      <PageHeader eyebrow="Dashboard" title="Dashboard" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryStat label="Active users" value={`${activeUsers}`} tone="accent" />
        <SummaryStat label="Suspended" value={`${suspendedUsers}`} tone="danger" />
        <SummaryStat label="Pages today" value={`${pagesToday}`} tone="sky" />
        <SummaryStat label="Pending release" value={`${heldJobs}`} tone="warn" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <SystemStatusPanel
          activeUsers={activeUsers}
          activeUserClients={activeUserClients}
          suspendedUsers={suspendedUsers}
          printersCount={printersCount}
          devicesCount={devicesCount}
          recentErrors={recentErrors}
          recentWarnings={recentWarnings}
          totalPages={totalPages}
          holdReleaseJobs={heldJobs}
          systemUptime={systemUptime}
        />

        <PrintActivityChart />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <RecentPrintLogsPanel />
        <PrinterStatusPanel printers={printerStatuses} />
      </div>
    </div>
  )
}
