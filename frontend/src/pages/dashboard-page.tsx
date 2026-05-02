import { useEffect, useState } from 'react'
import { PageHeader } from '../components/ui/page-header'
import { PrintActivityChart } from '../components/dashboard/PrintActivityChart'
import { PrinterStatusPanel } from '../components/dashboard/PrinterStatusPanel'
import { RecentPrintLogsPanel } from '../components/dashboard/RecentPrintLogsPanel'
import { SummaryStat } from '../components/dashboard/SummaryStat'
import { SystemStatusPanel } from '../components/dashboard/SystemStatusPanel'
import { getDashboardSnapshot } from '../features/admin/dashboard/api'

export function DashboardPage() {
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getDashboardSnapshot>> | null>(null)
  const [error, setError] = useState<string | null>(null)

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
