import { AlertTriangle, Save } from 'lucide-react'
import { DetailActionBar, DetailPanel, DetailSection } from '@/components/ui/admin-detail'
import { StatusBadge } from '@/components/ui/status-badge'
import { listQueueGroups, listQueuePrinters } from '@/features/admin/queues/api'
import type { AdminPrinter } from '@/types/admin'

interface QueueAssignmentsPanelProps {
  assignedPrinters: AdminPrinter[]
  form: {
    allowedGroups: string[]
    printerIds: string[]
  }
  onApply: () => void
  onReviewLog: () => void
  toggleAssignment: (field: 'printerIds' | 'allowedGroups', value: string) => void
}

export function QueueAssignmentsPanel({
  assignedPrinters,
  form,
  onApply,
  onReviewLog,
  toggleAssignment,
}: QueueAssignmentsPanelProps) {
  const printers = listQueuePrinters()
  const groups = listQueueGroups()

  return (
    <DetailPanel>
      <DetailSection title="Assigned printers" columns="single" hint="A printer can only belong to one queue at a time. Reassigning it here removes it from the previous queue.">
        <div className="grid gap-3">
          {printers.map((printer) => (
            <label key={printer.id} className="flex flex-col gap-3 border border-line bg-white px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={form.printerIds.includes(printer.id)} onChange={() => toggleAssignment('printerIds', printer.id)} />
                <div>
                  <div className="text-sm font-semibold text-ink-950">{printer.name}</div>
                  <div className="mt-1 text-sm text-slate-500">{printer.location} · {printer.model} · {printer.pendingJobs} held · {printer.queue}</div>
                </div>
              </div>
              <StatusBadge status={printer.status} />
            </label>
          ))}
        </div>
      </DetailSection>

      <DetailSection title="Access scope" columns="single">
        <div className="grid gap-3 md:grid-cols-2">
          {groups.map((group) => (
            <label key={group.id} className="flex items-start gap-3 border border-line bg-mist-50 px-4 py-4">
              <input type="checkbox" checked={form.allowedGroups.includes(group.name)} onChange={() => toggleAssignment('allowedGroups', group.name)} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink-950">{group.name}</span>
                <span className="mt-1 block text-sm text-slate-500">{group.userCount} users · {group.schedule}</span>
              </span>
            </label>
          ))}
        </div>
      </DetailSection>

      <DetailActionBar className="xl:justify-between">
        <div className="text-sm text-slate-500">
          {assignedPrinters.length === 0 ? 'No printers are currently assigned to this queue.' : `${assignedPrinters.length} printers are currently mapped here. Each physical printer remains exclusive to one queue.`}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ui-button-secondary" onClick={onReviewLog}><AlertTriangle className="size-4" />Open activity</button>
          <button type="button" className="ui-button" onClick={onApply}><Save className="size-4" />Apply assignments</button>
        </div>
      </DetailActionBar>
    </DetailPanel>
  )
}
