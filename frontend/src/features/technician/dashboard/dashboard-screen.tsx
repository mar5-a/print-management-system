import {
  AlertTriangle,
  Ban,
  Bell,
  CheckCircle2,
  Clock3,
  Printer,
  Users,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { PageHeader } from '@/components/ui/page-header'
import { getTechDashboardSnapshot, type TechDashboardSnapshot } from './api'

export function TechDashboardScreen() {
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getTechDashboardSnapshot>> | null>(null)

  useEffect(() => {
    getTechDashboardSnapshot().then(setSnapshot)
  }, [])

  if (!snapshot) {
    return <div className="p-6 text-sm text-slate-500">Loading...</div>
  }

  const activeAlerts = snapshot.alerts.filter((alert) => !alert.acknowledged)

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
