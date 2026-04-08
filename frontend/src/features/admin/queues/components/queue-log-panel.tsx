import { DetailPanel } from '@/components/ui/admin-detail'
import { DataTable } from '@/components/ui/data-table'
import { QueueLogStateBadge } from './queue-log-state-badge'
import type { AdminQueue, QueueLogEntry } from '@/types/admin'

interface QueueLogPanelProps {
  canDelete: boolean
  form: AdminQueue
  openLogCount: number
}

export function QueueLogPanel({ canDelete, form, openLogCount }: QueueLogPanelProps) {
  return (
    <DetailPanel>
      <div className="grid gap-0 border-b border-line md:grid-cols-3">
        <div className="border-b border-line px-5 py-4 md:border-r md:border-b-0"><div className="ui-heading">Open incidents</div><div className="mt-3 text-lg font-semibold text-ink-950">{openLogCount}</div></div>
        <div className="border-b border-line px-5 py-4 md:border-r md:border-b-0"><div className="ui-heading">Held jobs</div><div className="mt-3 text-lg font-semibold text-ink-950">{form.heldJobs}</div></div>
        <div className="px-5 py-4"><div className="ui-heading">Last activity</div><div className="mt-3 text-lg font-semibold text-ink-950">{form.lastActivity}</div></div>
      </div>

      {!canDelete ? <div className="border-b border-line bg-danger-100/70 px-5 py-4 text-sm text-danger-500">Deletion is blocked until the active and held work on this queue is cleared or redirected.</div> : null}

      <div className="px-5 py-5">
        <DataTable<QueueLogEntry>
          columns={[
            { key: 'time', header: 'Time', render: (entry) => <span className="ui-table-secondary-mono">{entry.time}</span> },
            { key: 'type', header: 'Type', render: (entry) => <span className="ui-table-secondary">{entry.type}</span> },
            { key: 'actor', header: 'Actor', render: (entry) => <span className="ui-table-secondary">{entry.actor}</span> },
            { key: 'message', header: 'Event', render: (entry) => <span className="ui-table-primary">{entry.message}</span> },
            { key: 'state', header: 'State', render: (entry) => <QueueLogStateBadge state={entry.state} /> },
          ]}
          rows={form.queueLogs}
          getRowKey={(entry) => entry.id}
          emptyLabel="No queue log entries are available."
        />
      </div>
    </DetailPanel>
  )
}
