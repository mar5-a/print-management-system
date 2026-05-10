import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowRightLeft,
  Clock3,
  Printer,
  Search,
  Users,
} from 'lucide-react'
import { PrintActivityChart } from '../components/dashboard/PrintActivityChart'
import { PrinterStatusPanel } from '../components/dashboard/PrinterStatusPanel'
import { RecentPrintLogsPanel } from '../components/dashboard/RecentPrintLogsPanel'
import { SummaryStat } from '../components/dashboard/SummaryStat'
import { SystemStatusPanel } from '../components/dashboard/SystemStatusPanel'
import { PageHeader } from '../components/ui/page-header'
import { getDashboardSnapshot } from '../features/admin/dashboard/api'

const snapshotRefreshMs = 30_000

export function DashboardPage() {
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getDashboardSnapshot>> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [dashboardSearch, setDashboardSearch] = useState('')
  const [recentLogTotal, setRecentLogTotal] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      try {
        const nextSnapshot = await getDashboardSnapshot()

        if (isMounted) {
          setSnapshot(nextSnapshot)
          setError(null)
          setLastSyncedAt(new Date())
        }
      } catch (nextError) {
        if (isMounted) {
          setError(nextError instanceof Error ? nextError.message : 'Unable to load dashboard.')
        }
      }
    }

    void loadDashboard()

    const intervalId = window.setInterval(() => {
      void loadDashboard()
    }, snapshotRefreshMs)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  if (!snapshot) {
    return (
      <div className="min-w-0">
        <PageHeader
          title="Dashboard"
          description="Operational overview of the print environment."
        />
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

  const printerCounts = {
    online: printerStatuses.filter((printer) => printer.status === 'Online').length,
    offline: printerStatuses.filter((printer) => printer.status === 'Offline').length,
    maintenance: printerStatuses.filter((printer) => printer.status === 'Maintenance').length,
  }

  const systemStatus = deriveSystemStatus({
    recentErrors,
    recentWarnings,
    offlinePrinters: printerCounts.offline,
    maintenancePrinters: printerCounts.maintenance,
  })

  const syncLabel = formatSyncTime(lastSyncedAt)

  return (
    <div className="min-w-0">
      <PageHeader
        title="Dashboard"
        description="Operational overview of print queues, release jobs, device health, and log activity."
        meta={(
          <>
            <label className="relative w-full min-w-[15rem] max-w-[24rem] xl:w-[24rem]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                className="h-10 w-full rounded-xl border border-line bg-panel pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                value={dashboardSearch}
                placeholder="Search users or printers in logs"
                onChange={(event) => setDashboardSearch(event.currentTarget.value)}
              />
            </label>

            <span className={systemStatus.className}>{systemStatus.label}</span>
            <span className="text-xs text-slate-500">Last sync: {syncLabel}</span>
          </>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryStat
          label="Active users"
          value={activeUsers}
          icon={Users}
          tone="success"
          hint={`${suspendedUsers} suspended`}
        />
        <SummaryStat
          label="Recent print jobs"
          value={recentLogTotal ?? '--'}
          icon={Activity}
          tone="info"
          hint="From current print log dataset"
        />
        <SummaryStat
          label="Pages today"
          value={pagesToday.toLocaleString()}
          icon={Clock3}
          tone="violet"
          hint={`${totalPages.toLocaleString()} total pages tracked`}
        />
        <SummaryStat
          label="Held / release jobs"
          value={heldJobs}
          icon={ArrowRightLeft}
          tone="warn"
          hint="Held in queue or waiting release"
        />
        <SummaryStat
          label="Printers online"
          value={`${printerCounts.online}/${Math.max(printersCount, 0)}`}
          icon={Printer}
          tone="warn"
          progress={{
            value: printerCounts.online,
            total: Math.max(printersCount, 1),
            label: `${printerCounts.offline} offline, ${printerCounts.maintenance} maintenance`,
          }}
        />
      </div>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
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

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <RecentPrintLogsPanel externalSearch={dashboardSearch} onTotalChange={setRecentLogTotal} />
        <PrinterStatusPanel printers={printerStatuses} />
      </div>
    </div>
  )
}

function deriveSystemStatus(input: {
  recentErrors: number
  recentWarnings: number
  offlinePrinters: number
  maintenancePrinters: number
}) {
  const criticalSignals = input.recentErrors + input.offlinePrinters
  const warningSignals = input.recentWarnings + input.maintenancePrinters

  if (criticalSignals > 0) {
    return {
      label: 'System status: attention required',
      className: 'inline-flex min-h-10 items-center rounded-full border border-danger-500/35 bg-danger-100 px-3 text-xs font-semibold text-danger-500',
    }
  }

  if (warningSignals > 0) {
    return {
      label: 'System status: degraded',
      className: 'inline-flex min-h-10 items-center rounded-full border border-warn-500/35 bg-warn-100 px-3 text-xs font-semibold text-warn-500',
    }
  }

  return {
    label: 'System status: operational',
    className: 'inline-flex min-h-10 items-center rounded-full border border-emerald-500/35 bg-emerald-100/55 px-3 text-xs font-semibold text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/12 dark:text-emerald-300',
  }
}

function formatSyncTime(value: Date | null) {
  if (!value) {
    return '--'
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(value)
}
