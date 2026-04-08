import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Bell, CheckCircle2 } from 'lucide-react'
import {
  DetailActionBar,
  DetailAlert,
  DetailPanel,
  DetailSection,
} from '@/components/ui/admin-detail'
import { PageHeader } from '@/components/ui/page-header'
import { getTechAlertById, acknowledgeTechAlert } from './api'
import type { TechAlert } from '@/types/technician'

function severityMeta(severity: TechAlert['severity']) {
  if (severity === 'critical')
    return { icon: <AlertTriangle className="size-5" />, label: 'Critical', color: 'text-danger-500' }
  if (severity === 'warning')
    return { icon: <Bell className="size-5" />, label: 'Warning', color: 'text-warn-500' }
  return { icon: <CheckCircle2 className="size-5" />, label: 'Info', color: 'text-slate-500' }
}

function TechAlertDetailInner({ alert }: { alert: TechAlert }) {
  const navigate = useNavigate()
  const [currentAlert, setCurrentAlert] = useState(alert)
  const meta = severityMeta(currentAlert.severity)

  function handleAcknowledge() {
    const nextAlert = acknowledgeTechAlert(currentAlert.id)

    if (nextAlert) {
      setCurrentAlert(nextAlert)
    }
  }

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Alerts"
        title={currentAlert.title}
        description={`${meta.label} · ${currentAlert.createdAt}`}
        meta={
          <button className="ui-button-secondary" onClick={() => navigate('/tech/alerts')}>
            Back to alerts
          </button>
        }
      />

      <DetailPanel>
        {!currentAlert.acknowledged && currentAlert.severity === 'critical' && (
          <div className="px-5 pt-5">
            <DetailAlert
              title="Unacknowledged critical alert"
              description="This alert requires technician review."
            />
          </div>
        )}

        <DetailSection title="Details" columns="single">
          <div>
            <div className="ui-detail-label">Severity</div>
            <div className="mt-2 flex items-center gap-2">
              <span className={meta.color}>{meta.icon}</span>
              <span className="text-sm font-medium text-ink-950">{meta.label}</span>
            </div>
          </div>
          <div>
            <div className="ui-detail-label">Source</div>
            <div className="mt-2 text-sm text-ink-950">{currentAlert.source}</div>
          </div>
          {currentAlert.deviceName && (
            <div>
              <div className="ui-detail-label">Device</div>
              <div className="mt-2 text-sm text-ink-950">{currentAlert.deviceName}</div>
            </div>
          )}
          <div>
            <div className="ui-detail-label">Description</div>
            <div className="mt-2 text-sm leading-6 text-slate-700">{currentAlert.description}</div>
          </div>
          <div>
            <div className="ui-detail-label">Created</div>
            <div className="mt-2 text-sm text-ink-950">{currentAlert.createdAt}</div>
          </div>
        </DetailSection>

        {currentAlert.acknowledged && (
          <DetailSection title="Acknowledgement" columns="single">
            <div>
              <div className="ui-detail-label">Acknowledged by</div>
              <div className="mt-2 text-sm text-ink-950">{currentAlert.acknowledgedBy ?? '—'}</div>
            </div>
            <div>
              <div className="ui-detail-label">Acknowledged at</div>
              <div className="mt-2 text-sm text-ink-950">{currentAlert.acknowledgedAt ?? '—'}</div>
            </div>
          </DetailSection>
        )}

        {!currentAlert.acknowledged && (
          <DetailActionBar>
            <button className="ui-button-ghost" onClick={() => navigate('/tech/alerts')}>
              Cancel
            </button>
            <button className="ui-button" onClick={handleAcknowledge}>
              Acknowledge
            </button>
          </DetailActionBar>
        )}
      </DetailPanel>
    </div>
  )
}

export function TechAlertDetailScreen() {
  const { alertId } = useParams()
  const alert = getTechAlertById(alertId)

  if (!alert) {
    return <Navigate to="/tech/alerts" replace />
  }

  return <TechAlertDetailInner alert={alert} />
}
