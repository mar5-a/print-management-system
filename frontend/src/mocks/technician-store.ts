import type { TechAlert } from '@/types/technician'
import { adminUsers, adminPrinters } from './admin-store'

// ── Alerts ──

const alertSeedData: TechAlert[] = [
  {
    id: 'ta-01',
    title: 'Printer D1 offline',
    description: 'Printer D1 went offline after a network switch failure in the Library. 11 held jobs are waiting for release once the device is restored.',
    severity: 'critical',
    source: 'device',
    deviceName: 'Printer D1',
    createdAt: '2026-04-08 07:54',
    acknowledged: false,
  },
  {
    id: 'ta-02',
    title: 'Printer C3 paper feed fault',
    description: 'Repeated paper feed alerts on Printer C3 triggered automatic maintenance mode. 5 pending jobs require manual redirect.',
    severity: 'critical',
    source: 'device',
    deviceName: 'Printer C3',
    createdAt: '2026-04-08 08:11',
    acknowledged: false,
  },
  {
    id: 'ta-03',
    title: 'Low toner on Printer B2',
    description: 'Toner level at 46%. Consider scheduling a replacement cartridge within the next 48 hours.',
    severity: 'warning',
    source: 'device',
    deviceName: 'Printer B2',
    createdAt: '2026-04-08 06:30',
    acknowledged: false,
  },
  {
    id: 'ta-04',
    title: 'AD sync delay',
    description: 'Last Active Directory sync completed with 2-second latency, above the normal threshold. Monitor for recurrence.',
    severity: 'info',
    source: 'system',
    createdAt: '2026-04-08 09:12',
    acknowledged: false,
  },
  {
    id: 'ta-05',
    title: 'Printer C3 maintenance resolved',
    description: 'Paper feed issue on Printer C3 was resolved by on-site technician. Device returned to Online status.',
    severity: 'info',
    source: 'device',
    deviceName: 'Printer C3',
    createdAt: '2026-04-07 16:40',
    acknowledged: true,
    acknowledgedBy: 'sarah.tech',
    acknowledgedAt: '2026-04-07 16:45',
  },
]

const techAlertsData: TechAlert[] = alertSeedData.map((alert) => ({ ...alert }))

// ── Alert helpers ──

export function listTechAlerts(): TechAlert[] {
  return techAlertsData.map((alert) => ({ ...alert }))
}

export function getTechAlertById(alertId?: string): TechAlert | undefined {
  const alert = techAlertsData.find((a) => a.id === alertId)
  return alert ? { ...alert } : undefined
}

export function acknowledgeTechAlert(alertId: string): TechAlert | undefined {
  const index = techAlertsData.findIndex((a) => a.id === alertId)
  if (index === -1) return undefined

  techAlertsData[index] = {
    ...techAlertsData[index],
    acknowledged: true,
    acknowledgedBy: 'sarah.tech',
    acknowledgedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  }

  return { ...techAlertsData[index] }
}

// ── Non-admin users (excludes Administrator role) ──

export function listTechUsers() {
  return adminUsers.filter((user) => user.role !== 'Administrator')
}

export function getTechUserById(userId?: string) {
  const user = adminUsers.find((u) => u.id === userId)
  if (!user || user.role === 'Administrator') return undefined
  return user
}

export function updateTechUserQuota(userId: string, newTotal: number) {
  const user = adminUsers.find((u) => u.id === userId)
  if (!user || user.role === 'Administrator') return undefined
  user.quotaTotal = newTotal
  return user
}

export function setTechUserStatus(userId: string, status: 'Active' | 'Suspended') {
  const user = adminUsers.find((u) => u.id === userId)
  if (!user || user.role === 'Administrator') return undefined
  user.status = status
  return user
}

// ── Printer status (read-only) ──

export function listTechPrinters() {
  return adminPrinters
}
