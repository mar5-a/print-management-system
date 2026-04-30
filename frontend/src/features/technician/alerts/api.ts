import { api } from '@/lib/api'
import type { TechAlert } from '@/types/technician'

function formatDateTime(value?: string | null): string {
	if (!value) return '—'
	const d = new Date(value)
	if (Number.isNaN(d.getTime())) return value
	return d.toLocaleString()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAlert(alert: any): TechAlert {
	return {
		id: alert.id,
		title: alert.title,
		description: alert.description ?? '',
		severity: (alert.severity ?? 'warning') as TechAlert['severity'],
		source: 'device',
		deviceName: alert.printer_name ?? undefined,
		createdAt: formatDateTime(alert.detected_at),
		acknowledged: Boolean(alert.resolved_at),
		acknowledgedBy: alert.resolved_by_username ?? undefined,
		acknowledgedAt: formatDateTime(alert.resolved_at),
	}
}

export async function listTechAlerts(): Promise<TechAlert[]> {
	const res = await api.get<{ data: unknown[] }>('/alerts?limit=100')
	return res.data.map(mapAlert)
}

export async function getTechAlertById(alertId?: string): Promise<TechAlert | undefined> {
	if (!alertId) return undefined
	try {
		const res = await api.get<{ data: unknown }>(`/alerts/${alertId}`)
		return mapAlert(res.data)
	} catch {
		return undefined
	}
}

export async function acknowledgeTechAlert(alertId: string): Promise<TechAlert> {
	const res = await api.post<{ data: unknown }>(`/alerts/${alertId}/resolve`, {})
	return mapAlert(res.data)
}
