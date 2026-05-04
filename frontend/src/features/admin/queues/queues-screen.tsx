import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { QueuesHeader } from '@/components/queue/QueuesHeader'
import { QueuesTable } from '@/components/queue/QueuesTable'
import { QueuesToolbar, type QueueStatusFilter } from '@/components/queue/QueuesToolbar'
import { listGroups } from '@/features/admin/groups/api'
import { listPrinters } from '@/features/admin/printers/api'
import { createQueue, listQueues, type QueueMutationInput } from './api'
import { QueueCreatePanel } from './components/queue-create-panel'
import { useQueueForm } from './hooks/use-queue-form'
import type { AdminGroup, AdminPrinter, AdminQueue } from '@/types/admin'

export function QueuesScreen() {
  const navigate = useNavigate()
  const [queues, setQueues] = useState<AdminQueue[]>([])

  useEffect(() => {
    listQueues().then(setQueues).catch(console.error)
  }, [])
  const { availability, audienceFilter, deleteFilter, filteredQueues, resetFilters, search, setAudienceFilter, setAvailability, setDeleteFilter, setSearch, setStatusFilter, statusFilter } = useQueueFilters(queues)
  const { draft, isCreateOpen, resetDraft, setCreateOpen, setDraft, toggleDraftSelection } = useQueueForm()

  async function handleCreateQueue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const input: QueueMutationInput = {
      name: draft.name.trim() || 'New queue',
      description: draft.description.trim(),
      status: draft.enabled ? 'Online' : 'Offline',
      releaseMode: draft.releaseMode,
      audience: draft.audience,
      retentionHours: 24,
      costPerPage: 0.05,
      printerIds: draft.printerIds,
      allowedGroups: draft.allowedGroups,
    }

    await createQueue(createdQueue)
    const refreshed = await listQueues()
    setQueues(refreshed)
    resetDraft()
    setCreateOpen(false)
    navigate(`/admin/queues/${createdQueue.id}`)
  }

  return (
    <div className="min-w-0">
      <QueuesHeader />

      {isCreateOpen ? (
        <QueueCreatePanel
          draft={draft}
          groups={groups}
          printers={printers}
          onCancel={() => {
            resetDraft()
            setCreateOpen(false)
          }}
          onSubmit={handleCreateQueue}
          setDraft={setDraft}
          toggleDraftSelection={toggleDraftSelection}
        />
      ) : null}

      <QueuesToolbar
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onReset={resetFilters}
        onAddQueue={() => setCreateOpen(true)}
      />

      {loadError ? (
        <div className="mt-4 border border-danger-500/30 bg-danger-100 px-4 py-3 text-sm text-danger-500">
          {loadError}
        </div>
      ) : null}

      {isCreatingQueue ? (
        <div className="mt-4 border border-line bg-mist-50 px-4 py-3 text-sm text-slate-600">
          Creating queue...
        </div>
      ) : null}

      <div className="mt-4">
        <QueuesTable rows={queues} onRowClick={(queue) => navigate(`/admin/queues/${queue.id}`)} />
      </div>
    </div>
  )
}
