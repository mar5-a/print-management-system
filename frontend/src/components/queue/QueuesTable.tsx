import { DataTable } from '../ui/data-table'
import { StatusBadge } from '../ui/status-badge'
import { getQueueDeleteStateLabel, isQueueDeleteBlocked } from '@/lib/status'
import type { AdminQueue } from '@/types/admin'

interface QueuesTableProps {
  rows: AdminQueue[]
  onRowClick: (queue: AdminQueue) => void
}

export function QueuesTable({ rows, onRowClick }: QueuesTableProps) {
  return (
    <DataTable<AdminQueue>
      columns={[
        {
          key: 'queue',
          header: 'Queue',
          render: (queue) => <span className="ui-table-primary-strong">{queue.name}</span>,
        },
        {
          key: 'status',
          header: 'Status',
          render: (queue) => <StatusBadge status={queue.status} />,
        },
        {
          key: 'assignments',
          header: 'Assignments',
          render: (queue) => (
            <span className="ui-table-secondary">
              {queue.printerIds.length} printers / {queue.allowedGroups.length} groups
            </span>
          ),
        },
        {
          key: 'backlog',
          header: 'Backlog',
          render: (queue) => (
            <span className="ui-table-secondary">
              {queue.pendingJobs} active / {queue.heldJobs} held
            </span>
          ),
        },
        {
          key: 'delete',
          header: 'Delete state',
          render: (queue) => (
            <span className={isQueueDeleteBlocked(queue) ? 'text-sm font-medium text-danger-500' : 'text-sm font-medium text-accent-700'}>
              {getQueueDeleteStateLabel(queue)}
            </span>
          ),
        },
      ]}
      rows={rows}
      getRowKey={(queue) => queue.id}
      onRowClick={onRowClick}
      emptyLabel="No queues match the current filters."
    />
  )
}
