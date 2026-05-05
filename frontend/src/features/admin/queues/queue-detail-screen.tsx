import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/composite/page-header'
import { SectionTabs } from '@/components/composite/section-tabs'
import { listGroups } from '@/features/admin/groups/api'
import { listPrinters } from '@/features/admin/printers/api'
import { isQueueDeleteBlocked } from '@/lib/status'
import { getQueueByIdOrUndefined, removeQueue, saveQueue, type QueueMutationInput } from './api'
import { QueueAssignmentsPanel } from './components/queue-assignments-panel'
import { QueueConfigurationPanel } from './components/queue-configuration-panel'
import { QueueDeleteReview } from './components/queue-delete-review'
import { QueueLogPanel } from './components/queue-log-panel'
import type { AdminGroup, AdminPrinter, AdminQueue } from '@/types/admin'

export function QueueDetailScreen() {
  const navigate = useNavigate()
  const { queueId } = useParams()
  const [queue, setQueue] = useState<AdminQueue | undefined>(undefined)
  const [loadingQueue, setLoadingQueue] = useState(true)
  useEffect(() => {
    getQueueByIdOrUndefined(queueId).then(setQueue).finally(() => setLoadingQueue(false))
  }, [queueId])

  if (loadingQueue) return null
  if (!queue) {
    return <Navigate to="/admin/queues" replace />
  }

  return (
    <QueueDetailView
      key={queue.id}
      groups={groups}
      printers={printers}
      queue={queue}
      onBack={() => navigate('/admin/queues')}
      onQueueChange={setQueue}
    />
  )
}

function QueueDetailView({
  groups,
  onBack,
  onQueueChange,
  printers,
  queue,
}: {
  groups: AdminGroup[]
  onBack: () => void
  onQueueChange: (queue: AdminQueue) => void
  printers: AdminPrinter[]
  queue: AdminQueue
}) {
  const [activeTab, setActiveTab] = useState('Policy')
  const [form, setForm] = useState(queue)
  const [saveMessage, setSaveMessage] = useState('')
  const [deleteReviewOpen, setDeleteReviewOpen] = useState(false)
  const [allPrinters, setAllPrinters] = useState<Awaited<ReturnType<typeof listQueuePrinters>>>([])
  useEffect(() => { listQueuePrinters().then(setAllPrinters) }, [])
  const assignedPrinters = allPrinters.filter((printer) => form.printerIds.includes(printer.id))
  const openLogCount = form.queueLogs.filter((entry) => entry.state === 'Open').length
  const canDelete = !isQueueDeleteBlocked(form)

  function updateForm<K extends keyof AdminQueue>(field: K, value: AdminQueue[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function toggleAssignment(field: 'printerIds' | 'allowedGroups', value: string) {
    setForm((current) => {
      const nextValues = current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value]

      return { ...current, [field]: nextValues }
    })
  }

  function resetForm() {
    getQueueByIdOrUndefined(queue.id).then((freshQueue) => {
      setForm(freshQueue ?? queue)
      setSaveMessage('')
      setDeleteReviewOpen(false)
    })
  }

  function handleApply() {
    const nextForm = { ...form, status: (form.enabled ? form.status : 'Offline') as AdminQueue['status'] }
    saveQueue(nextForm).then((saved) => {
      setForm(saved)
      setSaveMessage('Queue changes saved.')
    }).catch(() => setSaveMessage('Failed to save changes.'))
  }

  async function handleDelete() {
    if (!canDelete) {
      setDeleteReviewOpen(true)
      return
    }
    removeQueue(form.id).then(onBack)
  }

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Queues"
        title={`Queue details: ${form.name}`}
        description={`${form.audience} access / ${form.releaseMode}`}
        meta={
          <>
            <button type="button" className="ui-button-secondary" onClick={onBack}>
              Back to queues
            </button>
            <button
              type="button"
              className="ui-button-danger-soft px-3 py-2"
              onClick={() => setDeleteReviewOpen(true)}
            >
              <Trash2 className="size-4" />
              {canDelete ? 'Delete queue' : 'Review delete'}
            </button>
          </>
        }
      />

      {deleteReviewOpen ? <QueueDeleteReview canDelete={canDelete} form={form} onClose={() => setDeleteReviewOpen(false)} onDelete={handleDelete} onReviewAssignments={() => setActiveTab('Assignments')} onReviewLog={() => setActiveTab('Activity')} /> : null}

      <SectionTabs tabs={['Policy', 'Assignments', 'Activity']} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'Policy' ? <QueueConfigurationPanel form={form} onApply={handleApply} onReset={resetForm} saveMessage={saveMessage} updateForm={updateForm} /> : null}
      {activeTab === 'Assignments' ? <QueueAssignmentsPanel assignedPrinters={assignedPrinters} form={form} groups={groups} onApply={handleApply} onReviewLog={() => setActiveTab('Activity')} printers={printers} toggleAssignment={toggleAssignment} /> : null}
      {activeTab === 'Activity' ? <QueueLogPanel canDelete={canDelete} form={form} openLogCount={openLogCount} /> : null}
    </div>
  )
}

function toQueueMutationInput(queue: AdminQueue): QueueMutationInput {
  return {
    name: queue.name,
    description: queue.description,
    status: queue.enabled ? queue.status : 'Offline',
    releaseMode: queue.releaseMode,
    audience: queue.audience,
    retentionHours: queue.autoDeleteAfterHours,
    costPerPage: queue.costPerPage,
    printerIds: queue.printerIds,
    allowedGroups: queue.allowedGroups,
  }
}
