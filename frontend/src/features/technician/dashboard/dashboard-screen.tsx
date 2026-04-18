import {
  AlertTriangle,
  Ban,
  Bell,
  CheckCircle2,
  Clock3,
  Users,
} from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { PageHeader } from '@/components/ui/page-header'
import { getTechDashboardSnapshot } from './api'

function ShiftStat({
  label,
  value,
  tone = 'accent',
  icon,
}: {
  label: string
  value: string | number
  tone?: 'accent' | 'sky' | 'warn' | 'danger'
  icon: React.ReactNode
}) {
  const toneClass =
    tone === 'danger'
      ? 'bg-danger-500'
      : tone === 'warn'
        ? 'bg-warn-500'
        : tone === 'sky'
          ? 'bg-sky-500'
          : 'bg-accent-500'

  return (
    <section className="ui-panel overflow-hidden">
      <div className={`h-1 w-full ${toneClass}`} />
      <div className="flex items-start gap-4 px-4 py-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-mist-50 text-slate-600">
          {icon}
        </div>
        <div>
          <div className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-ink-950">{value}</div>
        </div>
      </div>
    </section>
  )
}

export function TechDashboardScreen() {
  const snapshot = getTechDashboardSnapshot()

  return (
    <div className="min-w-0">
      <PageHeader eyebrow="Dashboard" title="Shift overview" description="Operational view for alerts, device health, and queue backlog. Configuration stays with administrators." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ShiftStat label="Problem devices" value={snapshot.problemPrinters} tone="danger" icon={<AlertTriangle className="size-5" />} />
        <ShiftStat label="Active alerts" value={snapshot.unacknowledgedAlerts} tone="warn" icon={<Bell className="size-5" />} />
        <ShiftStat label="Held jobs" value={snapshot.pendingJobs} tone="sky" icon={<Clock3 className="size-5" />} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="ui-panel overflow-hidden">
          <div className="border-b border-line bg-mist-50/80 px-5 py-4">
            <div className="text-base font-semibold text-ink-950">Printer status</div>
          </div>
          <div className="px-5 py-4">
            <DataTable<typeof snapshot.printers[number]>
              columns={[
                {
                  key: 'name',
                  header: 'Printer',
                  render: (p) => <span className="ui-table-primary-strong">{p.name}</span>,
                },
                {
                  key: 'location',
                  header: 'Location',
                  render: (p) => <span className="ui-table-secondary">{p.location}</span>,
                },
                {
                  key: 'queue',
                  header: 'Queue',
                  render: (p) => <span className="ui-table-secondary">{p.queue}</span>,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (p) => (
                    <span
                      className={
                        p.status === 'Online'
                          ? 'text-sm text-accent-700'
                          : p.status === 'Offline'
                            ? 'text-sm text-danger-500'
                            : 'text-sm text-warn-500'
                      }
                    >
                      {p.status}
                    </span>
                  ),
                },
                {
                  key: 'pending',
                  header: 'Held jobs',
                  render: (p) => <span className="ui-table-secondary">{p.pendingJobs}</span>,
                },
              ]}
              rows={snapshot.printers}
              getRowKey={(p) => p.id}
              emptyLabel="No printers."
            />
          </div>
        </section>

        <section className="ui-panel overflow-hidden">
          <div className="border-b border-line bg-mist-50/80 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold text-ink-950">Active alerts</div>
              {snapshot.unacknowledgedAlerts > 0 && (
                <span className="rounded-full bg-danger-100 px-2.5 py-0.5 text-xs font-semibold text-danger-500">
                  {snapshot.unacknowledgedAlerts} new
                </span>
              )}
            </div>
          </div>
          <div className="divide-y divide-line/80">
            {snapshot.alerts.filter((a) => !a.acknowledged).length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">No active alerts.</div>
            ) : (
              snapshot.alerts
                .filter((a) => !a.acknowledged)
                .map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 px-5 py-4">
                    <span
                      className={
                        alert.severity === 'critical'
                          ? 'mt-0.5 text-danger-500'
                          : alert.severity === 'warning'
                            ? 'mt-0.5 text-warn-500'
                            : 'mt-0.5 text-slate-400'
                      }
                    >
                      {alert.severity === 'critical' ? (
                        <AlertTriangle className="size-4" />
                      ) : alert.severity === 'warning' ? (
                        <Bell className="size-4" />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-ink-950">{alert.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{alert.deviceName ?? alert.source} · {alert.createdAt}</div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ShiftStat label="Active users" value={snapshot.activeUsers} tone="accent" icon={<Users className="size-5" />} />
        <ShiftStat label="Suspended" value={snapshot.suspendedUsers} tone="danger" icon={<Ban className="size-5" />} />
        <ShiftStat label="Online devices" value={snapshot.onlinePrinters} tone="accent" icon={<CheckCircle2 className="size-5" />} />
      </div>
    </div>
  )
}
