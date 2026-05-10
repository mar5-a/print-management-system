import { AlertTriangle, CircleAlert, MonitorX } from 'lucide-react'

type ActiveAlertsPanelProps = {
  recentWarnings: number
  recentErrors: number
  offlinePrinters: number
  maintenancePrinters: number
}

type AlertBucket = {
  key: string
  label: string
  value: number
  tone: 'warn' | 'danger' | 'info'
}

export function ActiveAlertsPanel({
  recentWarnings,
  recentErrors,
  offlinePrinters,
  maintenancePrinters,
}: ActiveAlertsPanelProps) {
  const alerts = [
    { key: 'errors', label: 'Recent system errors', value: recentErrors, tone: 'danger' },
    { key: 'warnings', label: 'Recent warnings', value: recentWarnings, tone: 'warn' },
    { key: 'offline', label: 'Offline printers', value: offlinePrinters, tone: 'danger' },
    { key: 'maintenance', label: 'Maintenance printers', value: maintenancePrinters, tone: 'info' },
  ] satisfies AlertBucket[]

  const activeAlerts = alerts.filter((item) => item.value > 0)

  return (
    <section className="ui-panel overflow-hidden">
      <div className="border-b border-line bg-mist-50/70 px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-base font-semibold text-ink-950">Active alerts</div>
          {activeAlerts.length > 0 ? (
            <span className="rounded-full bg-danger-100 px-2.5 py-1 text-xs font-semibold text-danger-500">{activeAlerts.length} signals</span>
          ) : null}
        </div>
      </div>

      <div className="px-4 py-4">
        {activeAlerts.length === 0 ? (
          <div className="rounded-xl border border-accent-500/25 bg-accent-100/40 px-3.5 py-3 text-sm text-accent-700">
            No active warnings or errors in the current dashboard snapshot.
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeAlerts.map((alert) => (
              <div key={alert.key} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-mist-50 px-3.5 py-2.5">
                <div className="inline-flex min-w-0 items-center gap-2.5">
                  <span className={getIconClass(alert.tone)}>{getAlertIcon(alert.tone)}</span>
                  <span className="text-sm text-ink-950">{alert.label}</span>
                </div>
                <span className={getValueClass(alert.tone)}>{alert.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function getAlertIcon(tone: AlertBucket['tone']) {
  if (tone === 'danger') {
    return <CircleAlert className="size-4" />
  }

  if (tone === 'warn') {
    return <AlertTriangle className="size-4" />
  }

  return <MonitorX className="size-4" />
}

function getIconClass(tone: AlertBucket['tone']) {
  if (tone === 'danger') {
    return 'text-danger-500'
  }

  if (tone === 'warn') {
    return 'text-warn-500'
  }

  return 'text-slate-500'
}

function getValueClass(tone: AlertBucket['tone']) {
  if (tone === 'danger') {
    return 'text-sm font-semibold text-danger-500'
  }

  if (tone === 'warn') {
    return 'text-sm font-semibold text-warn-500'
  }

  return 'text-sm font-semibold text-slate-600'
}
