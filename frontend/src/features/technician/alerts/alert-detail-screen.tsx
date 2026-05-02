import { useEffect, useState } from 'react'
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
  if (severity === 'critical') {
    return { icon: <AlertTriangle className="size-5" />, label: 'Critical', color: 'text-danger-500' }
  }

  if (severity === 'warning') {
    return { icon: <Bell className="size-5" />, label: 'Warning', color: 'text-warn-500' }
  }

  return { icon: <CheckCircle2 className="size-5" />, label: 'Info', color: 'text-slate-500' }
}

function TechAlertDetailInner({ alert }: { alert: TechAlert }) {
  const navigate = useNavigate()
  const [currentAlert, setCurrentAlert] = useState(alert)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const meta = severityMeta(currentAlert.severity)

  useEffect(() => {
    setCurrentAlert(alert)
  }, [alert])

  async function handleAcknowledge() {
    setIsSaving(true)
    setSaveError('')

    try {
      const nextAlert = await acknowledgeTechAlert(currentAlert.id)
      setCurrentAlert(nextAlert)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to acknowledge alert.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Alerts"
        title={currentAlert.title}
        description={`${meta.label} - ${currentAlert.createdAt}`}
        meta={
          <button className="ui-button-secondary" onClick={() => navigate('/tech/alerts')}>
            Back to alerts
          </button>
        }
      />

      <DetailPanel>
        {!currentAlert.acknowledged && currentAlert.severity === 'critical' && (
          <DetailAlert
            className="mb-0"
            title="Unacknowledged critical alert"
            description="Review the affected device or queue impact before acknowledging this alert."
          />
        )}

        {saveError ? (
          <div className="border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
            {saveError}
          </div>
        ) : null}

        <DetailSection title="Alert state">
          <div>
            <div className="ui-detail-label">Status</div>
            <div className="mt-2 flex h-10 items-center border border-line bg-white px-3 text-sm font-medium text-ink-950">
              {currentAlert.acknowledged ? 'Acknowledged' : 'Active'}
            </div>
          </div>
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
            <div className="ui-detail-label">Created</div>
            <div className="mt-2 text-sm text-ink-950">{currentAlert.createdAt}</div>
          </div>
        </DetailSection>

        <DetailSection title="Impact" columns="single">
          <div>
            <div className="ui-detail-label">Description</div>
            <div className="mt-2 text-sm leading-6 text-slate-700">{currentAlert.description}</div>
          </div>
        </DetailSection>

        {currentAlert.acknowledged && (
          <DetailSection title="Acknowledgement" columns="single">
            <div>
              <div className="ui-detail-label">Acknowledged by</div>
              <div className="mt-2 text-sm text-ink-950">{currentAlert.acknowledgedBy ?? '-'}</div>
            </div>
            <div>
              <div className="ui-detail-label">Acknowledged at</div>
              <div className="mt-2 text-sm text-ink-950">{currentAlert.acknowledgedAt ?? '-'}</div>
            </div>
          </DetailSection>
        )}

        {!currentAlert.acknowledged && (
          <DetailActionBar>
            <button className="ui-button-ghost" onClick={() => navigate('/tech/alerts')} disabled={isSaving}>
              Cancel
            </button>
            <button className="ui-button" onClick={handleAcknowledge} disabled={isSaving}>
              {isSaving ? 'Acknowledging...' : 'Acknowledge'}
            </button>
          </DetailActionBar>
        )}
      </DetailPanel>
    </div>
  )
}

export function TechAlertDetailScreen() {
  const { alertId } = useParams()
  const [alert, setAlert] = useState<TechAlert | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let isCurrent = true

    async function loadAlert() {
      setIsLoading(true)
      setNotFound(false)

      try {
        const nextAlert = await getTechAlertById(alertId)

        if (isCurrent) {
          if (nextAlert) {
            setAlert(nextAlert)
          } else {
            setNotFound(true)
          }
        }
      } catch {
        if (isCurrent) {
          setNotFound(true)
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    void loadAlert()

    return () => {
      isCurrent = false
    }
  }, [alertId])

  if (notFound) {
    return <Navigate to="/tech/alerts" replace />
  }

  if (isLoading || !alert) {
    return (
      <div className="min-w-0">
        <PageHeader eyebrow="Alerts" title="Loading alert" />
        <div className="ui-panel px-5 py-8 text-sm text-slate-500">Loading alert details...</div>
      </div>
    )
  }

  return <TechAlertDetailInner alert={alert} />
}
