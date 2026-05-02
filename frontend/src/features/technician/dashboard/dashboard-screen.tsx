import { useEffect, useState } from 'react'
import { AlertTriangle, Ban, Bell, Clock3, Printer, Users } from 'lucide-react'
import { TechActiveAlertsPanel } from '@/components/technician/dashboard/TechActiveAlertsPanel'
import { TechPrinterHealthTable } from '@/components/technician/dashboard/TechPrinterHealthTable'
import { TechStatCard } from '@/components/technician/dashboard/TechStatCard'
import { PageHeader } from '@/components/ui/page-header'
import { getTechDashboardSnapshot, type TechDashboardSnapshot } from './api'

export function TechDashboardScreen() {
  const [snapshot, setSnapshot] = useState<TechDashboardSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isCurrent = true

    async function loadDashboard(showLoading: boolean) {
      if (showLoading) {
        setIsLoading(true)
      }

      try {
        const nextSnapshot = await getTechDashboardSnapshot()

        if (isCurrent) {
          setSnapshot(nextSnapshot)
          setLoadError('')
        }
      } catch (error) {
        if (isCurrent) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load technician dashboard.')
        }
      } finally {
        if (isCurrent && showLoading) {
          setIsLoading(false)
        }
      }
    }

    void loadDashboard(true)
    const intervalId = window.setInterval(() => {
      void loadDashboard(false)
    }, 30_000)

    return () => {
      isCurrent = false
      window.clearInterval(intervalId)
    }
  }, [])

  return (
    <div className="min-w-0">
      <PageHeader eyebrow="Dashboard" title="Technician operations" />

      {isLoading && !snapshot ? (
        <div className="ui-panel px-5 py-8 text-sm text-slate-500">Loading technician dashboard...</div>
      ) : loadError && !snapshot ? (
        <div className="ui-panel border-danger-200 bg-danger-50 px-5 py-4 text-sm font-medium text-danger-600">
          {loadError}
        </div>
      ) : snapshot ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <TechStatCard label="Active alerts" value={snapshot.unacknowledgedAlerts} tone="warn" icon={<Bell className="size-5" />} />
            <TechStatCard label="Problem devices" value={snapshot.problemPrinters} tone="danger" icon={<AlertTriangle className="size-5" />} />
            <TechStatCard label="Held jobs" value={snapshot.pendingJobs} tone="sky" icon={<Clock3 className="size-5" />} />
            <TechStatCard label="Suspended users" value={snapshot.suspendedUsers} tone="danger" icon={<Ban className="size-5" />} />
            <TechStatCard label="Online devices" value={snapshot.onlinePrinters} tone="accent" icon={<Printer className="size-5" />} />
            <TechStatCard label="Active users" value={snapshot.activeUsers} tone="accent" icon={<Users className="size-5" />} />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <TechActiveAlertsPanel alerts={snapshot.alerts} activeCount={snapshot.unacknowledgedAlerts} />
            <TechPrinterHealthTable printers={snapshot.printers} heldJobs={snapshot.pendingJobs} />
          </div>
        </>
      ) : null}
    </div>
  )
}
