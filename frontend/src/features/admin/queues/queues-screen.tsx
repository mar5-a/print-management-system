import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilterBar } from '@/components/composite/filter-bar'
import { PageHeader } from '@/components/composite/page-header'
import { DataTable } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { getQueueDeleteStateLabel, isQueueDeleteBlocked } from '@/lib/status'
import { createQueue, listQueues } from './api'
import { QueueCreatePanel } from './components/queue-create-panel'
import { useQueueFilters } from './hooks/use-queue-filters'
import { useQueueForm } from './hooks/use-queue-form'
import type { AdminQueue } from '@/types/admin'
import type { QueueAvailabilityScope } from './types'

export function QueuesScreen() {
  const navigate = useNavigate()
  const [queues, setQueues] = useState(() => listQueues())
  const { availability, audienceFilter, deleteFilter, filteredQueues, resetFilters, search, setAudienceFilter, setAvailability, setDeleteFilter, setSearch, setStatusFilter, statusFilter } = useQueueFilters(queues)
  const { draft, isCreateOpen, resetDraft, setCreateOpen, setDraft, toggleDraftSelection } = useQueueForm()

  function handleCreateQueue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = draft.name.trim()
    const newQueueId = `que-${Date.now().toString(36)}`
    const createdQueue: AdminQueue = {
      id: newQueueId,
      name: trimmedName || 'New queue',
      description: draft.description.trim() || 'New queue draft awaiting policy review.',
      hostedOn: draft.hostedOn,
      status: draft.enabled ? 'Online' : 'Offline',
      enabled: draft.enabled,
      releaseMode: draft.releaseMode,
      audience: draft.audience,
      department: draft.department.trim() || 'General Access',
      allowedGroups: draft.allowedGroups,
      colorMode: 'Black & White',
      defaultDuplex: true,
      costPerPage: 0.05,
      printerIds: draft.printerIds,
      pendingJobs: 0,
      heldJobs: 0,
      releasedToday: 0,
      lastActivity: 'Not released yet',
      autoDeleteAfterHours: 24,
      failureMode: 'Hold until redirected',
      notes: 'Created from the queue administration screen. Review access groups and printer assignments before production use.',
      queueLogs: [
        {
          id: `${newQueueId}-log-01`,
          time: '2026-04-06 10:00',
          type: 'Policy',
          state: 'Info',
          actor: 'david.admin',
          message: 'Queue created from the admin console draft flow.',
        },
      ],
    }

    createQueue(createdQueue)
    setQueues(listQueues())
    resetDraft()
    setCreateOpen(false)
    navigate(`/admin/queues/${createdQueue.id}`)
  }

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Queues"
        title="Queue management"
        description="Dedicated queue CRUD, printer assignment, retention policy, and deletion-safety surface for the admin console."
      />

      {isCreateOpen ? <QueueCreatePanel draft={draft} onCancel={() => { resetDraft(); setCreateOpen(false) }} onSubmit={handleCreateQueue} setDraft={setDraft} toggleDraftSelection={toggleDraftSelection} /> : null}

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search queues, groups, or servers"
        actions={
          <>
            <button type="button" className="ui-button-action h-9 px-3 py-0" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              New queue
            </button>
            <button type="button" className="ui-button-danger-soft h-9 px-3 py-0" onClick={() => setDeleteFilter('Blocked by active jobs')}>
              <Trash2 className="size-4" />
              Blocked deletes
            </button>
          </>
        }
        filters={
          <>
            <label className="min-w-[9rem] flex-1 sm:flex-none">
              <span className="sr-only">Status</span>
              <select className="ui-select h-9 w-full min-w-[9rem]" aria-label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option>All statuses</option>
                <option>Online</option>
                <option>Offline</option>
                <option>Maintenance</option>
              </select>
            </label>
            <label className="min-w-[9rem] flex-1 sm:flex-none">
              <span className="sr-only">Audience</span>
              <select className="ui-select h-9 w-full min-w-[9rem]" aria-label="Audience" value={audienceFilter} onChange={(event) => setAudienceFilter(event.target.value)}>
                <option>All audiences</option>
                <option>Students</option>
                <option>Staff</option>
                <option>Faculty</option>
                <option>Mixed</option>
              </select>
            </label>
            <label className="min-w-[11rem] flex-1 sm:flex-none">
              <span className="sr-only">Delete safety</span>
              <select className="ui-select h-9 w-full min-w-[11rem]" aria-label="Delete safety" value={deleteFilter} onChange={(event) => setDeleteFilter(event.target.value)}>
                <option>All delete states</option>
                <option>Blocked by active jobs</option>
                <option>Ready to delete</option>
              </select>
            </label>
            <label className="min-w-[9.5rem] flex-1 sm:flex-none">
              <span className="sr-only">Availability</span>
              <select className="ui-select h-9 w-full min-w-[9.5rem]" aria-label="Availability" value={availability} onChange={(event) => setAvailability(event.target.value as QueueAvailabilityScope)}>
                <option>All</option>
                <option>Enabled only</option>
                <option>Disabled only</option>
              </select>
            </label>
            <button type="button" className="ui-button-secondary h-9 px-3 py-0" onClick={resetFilters}>
              <RotateCcw className="size-3.5" />
              Reset
            </button>
          </>
        }
      />

      <div className="mt-4">
        <DataTable<AdminQueue>
          columns={[
            { key: 'queue', header: 'Queue', render: (queue) => <span className="ui-table-primary-strong">{queue.name}</span> },
            { key: 'status', header: 'Status', render: (queue) => <StatusBadge status={queue.status} /> },
            { key: 'audience', header: 'Audience', render: (queue) => <span className="ui-table-secondary">{queue.audience}</span> },
            { key: 'assignment', header: 'Assignments', render: (queue) => <span className="ui-table-secondary">{queue.printerIds.length} printers · {queue.allowedGroups.length} groups</span> },
            { key: 'backlog', header: 'Backlog', render: (queue) => <span className="ui-table-secondary">{queue.pendingJobs} active · {queue.heldJobs} held</span> },
            { key: 'delete', header: 'Delete state', render: (queue) => <span className={isQueueDeleteBlocked(queue) ? 'text-sm font-medium text-danger-500' : 'text-sm font-medium text-accent-700'}>{getQueueDeleteStateLabel(queue)}</span> },
          ]}
          rows={filteredQueues}
          getRowKey={(queue) => queue.id}
          onRowClick={(queue) => navigate(`/admin/queues/${queue.id}`)}
          emptyLabel="No queues match the current filters."
        />
      </div>
    </div>
  )
}
