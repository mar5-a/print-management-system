import { Check, ShieldAlert, Trash2 } from 'lucide-react'
import type { AdminQueue } from '@/types/admin'

interface QueueDeleteReviewProps {
  canDelete: boolean
  form: AdminQueue
  onClose: () => void
  onDelete: () => void
  onReviewAssignments: () => void
  onReviewLog: () => void
}

export function QueueDeleteReview({
  canDelete,
  form,
  onClose,
  onDelete,
  onReviewAssignments,
  onReviewLog,
}: QueueDeleteReviewProps) {
  return (
    <section className="ui-panel mb-5 overflow-hidden">
      <div className={canDelete ? 'border-b border-line bg-accent-100/35 px-5 py-4' : 'border-b border-line bg-danger-100 px-5 py-4'}>
        <div className="flex items-start gap-3">
          {canDelete ? <Check className="mt-0.5 size-5 text-accent-700" /> : <ShieldAlert className="mt-0.5 size-5 text-danger-500" />}
          <div>
            <div className="text-base font-semibold text-ink-950">{canDelete ? 'Delete queue' : 'Delete blocked'}</div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {canDelete
                ? 'No active or held jobs remain. You can remove this queue without discarding pending print work.'
                : 'Active or held jobs are still attached to this queue. Clear or redirect them before deletion.'}
            </p>
          </div>
        </div>
      </div>

      {!canDelete ? (
        <div className="grid gap-0 border-b border-line md:grid-cols-2">
          <div className="border-b border-line px-5 py-4 md:border-r md:border-b-0">
            <div className="ui-heading">Active jobs</div>
            <div className="mt-3 text-lg font-semibold text-ink-950">{form.pendingJobs}</div>
          </div>
          <div className="px-5 py-4">
            <div className="ui-heading">Held jobs</div>
            <div className="mt-3 text-lg font-semibold text-ink-950">{form.heldJobs}</div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="text-sm text-slate-500">
          {canDelete ? 'This removes the queue record and unassigns its current routing.' : 'Review routing or queue activity to resolve the remaining work.'}
        </div>
        <div className="flex flex-wrap gap-2">
          {!canDelete ? (
            <>
              <button type="button" className="ui-button-secondary" onClick={onReviewAssignments}>Open assignments</button>
              <button type="button" className="ui-button-secondary" onClick={onReviewLog}>Open activity</button>
            </>
          ) : (
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-none border border-danger-500 bg-danger-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-danger-500/90" onClick={onDelete}>
              <Trash2 className="size-4" />
              Delete queue
            </button>
          )}
          <button type="button" className="ui-button-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </section>
  )
}
