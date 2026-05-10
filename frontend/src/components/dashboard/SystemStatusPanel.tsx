import {
  AlertTriangle,
  ArrowRightLeft,
  CircleGauge,
  Clock3,
  FileStack,
  Power,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { StatusRow } from './StatusRow'

type SystemStatusPanelProps = {
  activeUsers: number
  activeUserClients: number
  suspendedUsers: number
  printersCount: number
  devicesCount: number
  recentErrors: number
  recentWarnings: number
  totalPages: number
  holdReleaseJobs: number
  systemUptime: string
}

export function SystemStatusPanel({
  activeUsers,
  activeUserClients,
  suspendedUsers,
  printersCount,
  devicesCount,
  recentErrors,
  recentWarnings,
  totalPages,
  holdReleaseJobs,
  systemUptime,
}: SystemStatusPanelProps) {
  return (
    <section className="ui-panel overflow-hidden">
      <div className="border-b border-line bg-accent-100/55 px-4 py-3.5">
        <div className="text-base font-semibold text-ink-950">System overview</div>
      </div>

      <div className="px-4 py-2">
        <StatusRow icon={<Clock3 className="size-4" />} label="System uptime" value={systemUptime} />
        <StatusRow icon={<UsersRound className="size-4" />} label="Users in scope" value={`${activeUsers + suspendedUsers}`} />
        <StatusRow icon={<CircleGauge className="size-4" />} label="Active users" value={`${activeUsers}`} tone="success" />
        <StatusRow icon={<ShieldCheck className="size-4" />} label="Managed printers" value={`${printersCount}`} />
        <StatusRow icon={<Power className="size-4" />} label="Active user clients" value={`${activeUserClients}`} />
        <StatusRow icon={<AlertTriangle className="size-4" />} label="Recent warnings" value={`${recentWarnings}`} tone="warn" />
        <StatusRow icon={<AlertTriangle className="size-4" />} label="Recent errors" value={`${recentErrors}`} tone="danger" />
        <StatusRow icon={<FileStack className="size-4" />} label="Total pages" value={`${totalPages.toLocaleString()}`} tone="success" />
        <StatusRow icon={<ArrowRightLeft className="size-4" />} label="Hold/release jobs" value={`${holdReleaseJobs}`} />
        <StatusRow icon={<Power className="size-4" />} label="Device records" value={`${devicesCount}`} />
      </div>
    </section>
  )
}
