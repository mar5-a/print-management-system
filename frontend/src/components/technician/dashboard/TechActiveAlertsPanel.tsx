import { AlertTriangle, Bell, CheckCircle2 } from 'lucide-react'
import type { TechAlert } from '@/types/technician'

interface TechActiveAlertsPanelProps {
  alerts: TechAlert[]
  activeCount: number
}

export function TechActiveAlertsPanel({ alerts, activeCount }: TechActiveAlertsPanelProps) {
  const activeAlerts = alerts.filter((alert) => !alert.acknowledged)

  return (
    <section className="ui-panel overflow-hidden">
      <div className="border-b border-line bg-mist-50/80 px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold text-ink-950">Active alerts</div>
          {activeCount > 0 && (
            <span className="rounded-full bg-danger-100 px-2.5 py-0.5 text-xs font-semibold text-danger-500">
              {activeCount} new
            </span>
          )}
        </div>
      </div>
      <div className="divide-y divide-line/80">
        {activeAlerts.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">No active alerts.</div>
        ) : (
          activeAlerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 px-4 py-3.5">
              <span className={getAlertIconClass(alert.severity)}>{getAlertIcon(alert.severity)}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink-950">{alert.title}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {alert.deviceName ?? alert.source} - {alert.createdAt}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function getAlertIcon(severity: TechAlert['severity']) {
  if (severity === 'critical') return <AlertTriangle className="size-4" />
  if (severity === 'warning') return <Bell className="size-4" />
  return <CheckCircle2 className="size-4" />
}

function getAlertIconClass(severity: TechAlert['severity']) {
  if (severity === 'critical') return 'mt-0.5 text-danger-500'
  if (severity === 'warning') return 'mt-0.5 text-warn-500'
  return 'mt-0.5 text-slate-400'
}
