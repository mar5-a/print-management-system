export type TechAlertSeverity = 'critical' | 'warning' | 'info'
export type TechAlertSource = 'device' | 'system'

export interface TechAlert {
  id: string
  title: string
  description: string
  severity: TechAlertSeverity
  source: TechAlertSource
  deviceName?: string
  createdAt: string
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
}
