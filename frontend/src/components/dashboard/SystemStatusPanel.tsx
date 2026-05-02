import {
  AlertTriangle,
  ArrowRightLeft,
  Ban,
  Clock3,
  FileText,
  Power,
  Printer,
  ShieldCheck,
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
      <div className="border-b border-line bg-mist-50/80 px-5 py-4">
        <div className="text-base font-semibold text-ink-950">System status</div>
      </div>

      <div className="px-5 py-2">
        <StatusRow icon={<Clock3 className="size-4" />} label="System uptime" value={systemUptime} />
        <StatusRow icon={<ShieldCheck className="size-4" />} label="Users" value={`${activeUsers + suspendedUsers}`} />
        <StatusRow icon={<Printer className="size-4" />} label="Printers" value={`${printersCount}`} />
        <StatusRow icon={<FileText className="size-4" />} label="Devices" value={`${devicesCount}`} />
        <StatusRow icon={<Ban className="size-4" />} label="Recent errors" value={`${recentErrors}`} tone="danger" />
        <StatusRow icon={<AlertTriangle className="size-4" />} label="Recent warnings" value={`${recentWarnings}`} tone="warn" />
        <StatusRow icon={<FileText className="size-4" />} label="Total pages" value={`${totalPages.toLocaleString()}`} tone="success" />
        <StatusRow icon={<ArrowRightLeft className="size-4" />} label="Hold/release jobs" value={`${holdReleaseJobs}`} />
        <StatusRow icon={<Power className="size-4" />} label="Active user clients" value={`${activeUserClients}`} />
      </div>
    </section>
  )
}
