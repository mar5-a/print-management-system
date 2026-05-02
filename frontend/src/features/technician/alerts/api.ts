import { api } from '@/lib/api'
import type { TechAlert, TechAlertSeverity } from '@/types/technician'

interface ApiData<T> {
  data: T
}

export interface BackendTechAlert {
  id: string
  title: string
  description: string
  severity: TechAlertSeverity
  status: 'open' | 'acknowledged' | 'resolved' | string
  source: 'device' | 'system'
  printer_id: string | null
  printer_name: string | null
  detected_at: string
  resolved_at: string | null
  acknowledged_by: string | null
  acknowledged_at: string | null
}

export interface TechAlertFilters {
  search?: string
  status?: 'All' | 'Active' | 'Acknowledged'
  severity?: 'All severities' | TechAlertSeverity
}

export async function listTechAlerts(filters: TechAlertFilters = {}) {
  const params = new URLSearchParams()

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim())
  }

  if (filters.status === 'Active') {
    params.set('status', 'active')
  } else if (filters.status === 'Acknowledged') {
    params.set('status', 'acknowledged')
  } else {
    params.set('status', 'all')
  }

  if (filters.severity && filters.severity !== 'All severities') {
    params.set('severity', filters.severity)
  }

  const query = params.toString()
  const response = await api.get<ApiData<BackendTechAlert[]>>(`/alerts${query ? `?${query}` : ''}`)
  return response.data.map(mapBackendTechAlert)
}

export async function getTechAlertById(alertId?: string) {
  if (!alertId) {
    return undefined
  }

  const response = await api.get<ApiData<BackendTechAlert>>(`/alerts/${alertId}`)
  return mapBackendTechAlert(response.data)
}

export async function acknowledgeTechAlert(alertId: string) {
  const response = await api.post<ApiData<BackendTechAlert>>(`/alerts/${alertId}/acknowledge`)
  return mapBackendTechAlert(response.data)
}

export function mapBackendTechAlert(alert: BackendTechAlert): TechAlert {
  return {
    id: alert.id,
    title: alert.title,
    description: alert.description,
    severity: alert.severity,
    source: alert.source,
    deviceName: alert.printer_name ?? undefined,
    createdAt: formatTechTimestamp(alert.detected_at),
    acknowledged: alert.status === 'acknowledged',
    acknowledgedBy: alert.acknowledged_by ?? undefined,
    acknowledgedAt: alert.acknowledged_at ? formatTechTimestamp(alert.acknowledged_at) : undefined,
  }
}

export function formatTechTimestamp(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}
