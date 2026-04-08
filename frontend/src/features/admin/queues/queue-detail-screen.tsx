import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/composite/page-header'
import { SectionTabs } from '@/components/composite/section-tabs'
import { isQueueDeleteBlocked } from '@/lib/status'
import { getQueueByIdOrUndefined, listQueuePrinters, removeQueue, saveQueue } from './api'
import { QueueAssignmentsPanel } from './components/queue-assignments-panel'
import { QueueConfigurationPanel } from './components/queue-configuration-panel'
import { QueueDeleteReview } from './components/queue-delete-review'
import { QueueLogPanel } from './components/queue-log-panel'
import type { AdminQueue } from '@/types/admin'

export function QueueDetailScreen() {
  const navigate = useNavigate()
  const { queueId } = useParams()
  const queue = getQueueByIdOrUndefined(queueId)

  if (!queue) {
    return <Navigate to="/admin/queues" replace />
  }

  return <QueueDetailView key={queue.id} queue={queue} onBack={() => navigate('/admin/queues')} />
}

function QueueDetailView({ queue, onBack }: { queue: AdminQueue; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState('Policy')
  const [form, setForm] = useState(queue)
  const [saveMessage, setSaveMessage] = useState('')
  const [deleteReviewOpen, setDeleteReviewOpen] = useState(false)
  const assignedPrinters = listQueuePrinters().filter((printer) => form.printerIds.includes(printer.id))
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
    const freshQueue = getQueueByIdOrUndefined(queue.id)
    setForm(freshQueue ?? queue)
    setSaveMessage('')
    setDeleteReviewOpen(false)
  }

  function handleApply() {
    const nextForm = { ...form, status: form.enabled ? form.status : 'Offline' }
    saveQueue(nextForm)
    setForm(nextForm)
    setSaveMessage('Queue changes saved to the mock admin store.')
  }

  function handleDelete() {
    if (!canDelete) {
      setDeleteReviewOpen(true)
      return
    }

    removeQueue(form.id)
    onBack()
  }

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Queues"
        title={`Queue details: ${form.name}`}
        description={`${form.audience} access on ${form.hostedOn}`}
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
      {activeTab === 'Assignments' ? <QueueAssignmentsPanel assignedPrinters={assignedPrinters} form={form} onApply={handleApply} onReviewLog={() => setActiveTab('Activity')} toggleAssignment={toggleAssignment} /> : null}
      {activeTab === 'Activity' ? <QueueLogPanel canDelete={canDelete} form={form} openLogCount={openLogCount} /> : null}
    </div>
  )
}
