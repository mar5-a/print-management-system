import { AlertTriangle, CheckCircle2, Info, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/composite/page-header'
import { formatUsd } from '@/lib/formatters'
import { getPortalSubmissionSnapshot, submitPortalJob } from './api'
import { usePortalSubmissionForm } from './use-portal-submission-form'
import type { PortalSubmissionDraft } from '@/types/portal'

export function PortalSubmitJobScreen() {
  const navigate = useNavigate()
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getPortalSubmissionSnapshot>> | null>(null)
  const [snapshotError, setSnapshotError] = useState<string | null>(null)
  const { draft, feedback, file, isSubmitting, resetForm, setDraft, setFeedback, setFile, setIsSubmitting } = usePortalSubmissionForm()
  const defaultQueue = snapshot?.defaultQueue
  const queues = snapshot?.queues ?? []
  const profile = snapshot?.profile
  const quotaRemaining = profile ? profile.quotaTotal - profile.quotaUsed : 0
  const supportsColorOnAssignedRoute = defaultQueue?.colorMode === 'Color'
  const totalPages = draft.pages * draft.copies
  const estimatedCost = defaultQueue
    ? Number((totalPages * defaultQueue.costPerPage * (draft.duplex ? 0.9 : 1) * (draft.colorMode === 'Color' ? 2 : 1)).toFixed(2))
    : 0
  const alternateEligibleQueues = queues.filter((queue) => queue.available && !queue.isDefault)

  useEffect(() => {
    let cancelled = false

    getPortalSubmissionSnapshot()
      .then((nextSnapshot) => {
        if (!cancelled) {
          setSnapshot(nextSnapshot)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setSnapshotError(error instanceof Error ? error.message : 'Unable to load portal route.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    setDraft((current) => ({ ...current, fileName: nextFile?.name ?? '' }))
    setFeedback(null)
  }

  function updateDraft<K extends keyof PortalSubmissionDraft>(field: K, value: PortalSubmissionDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file) {
      setFeedback({ tone: 'error', message: 'Choose a file before submitting.' })
      return
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    const allowedExtensions = ['pdf']

    if (!allowedExtensions.includes(extension) || file.size > 20 * 1024 * 1024) {
      setFeedback({ tone: 'error', message: 'Use a PDF file under 20 MB. DOCX/PPTX conversion is not wired yet.' })
      return
    }

    if (!defaultQueue || !defaultQueue.available) {
      setFeedback({ tone: 'error', message: 'Your assigned web upload route is currently unavailable.' })
      return
    }

    if (totalPages > quotaRemaining) {
      setFeedback({ tone: 'error', message: 'This job exceeds your remaining quota.' })
      return
    }

    if (!supportsColorOnAssignedRoute && draft.colorMode === 'Color') {
      setFeedback({ tone: 'error', message: 'Your assigned web upload route only supports black-and-white output.' })
      return
    }

    setIsSubmitting(true)

    try {
      const { backendResult, portalJob } = await submitPortalJob({ ...draft, fileName: file.name }, file)

      if (!portalJob) {
        setFeedback({ tone: 'error', message: 'The backend printed the file, but the local portal history mock could not create a job record.' })
        return
      }

      setFeedback({
        tone: 'success',
        message: `Job ${portalJob.id} was stored by the backend in ${portalJob.queueName}. Status: ${backendResult.status}.`,
      })
      resetForm()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Backend print request failed.'
      setFeedback({ tone: 'error', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Portal"
        title="Submit job"
        description="Upload one PDF to your assigned campus print route."
      />

      {snapshotError ? (
        <div className="mb-4 border border-danger-500/30 bg-danger-100 px-4 py-3 text-sm text-danger-500">
          {snapshotError}
        </div>
      ) : null}

      {!snapshot && !snapshotError ? (
        <div className="ui-panel px-4 py-6 text-sm text-slate-500">Loading your assigned route...</div>
      ) : null}

      {snapshot ? <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <section className="ui-panel overflow-hidden">
            <div className="border-b border-line bg-mist-50/80 px-4 py-3">
              <div className="text-base font-semibold text-ink-950">File</div>
            </div>
            <div className="px-4 py-4">
              <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center border border-dashed border-line bg-mist-50 px-4 py-5 text-center transition hover:border-accent-500 hover:bg-accent-100/40">
                <Upload className="size-5 text-slate-500" />
                <div className="mt-3 text-sm font-semibold text-ink-950">{file ? file.name : 'Upload PDF'}</div>
                <div className="mt-1 text-sm text-slate-500">Up to 20 MB</div>
                <input type="file" className="sr-only" accept=".pdf,application/pdf" onChange={handleFileChange} />
              </label>
            </div>
          </section>

          <section className="ui-panel overflow-hidden">
            <div className="border-b border-line bg-mist-50/80 px-4 py-3">
              <div className="text-base font-semibold text-ink-950">Options</div>
            </div>
            <div className="grid gap-4 px-4 py-4 lg:grid-cols-2">
              <label><div className="ui-heading">Pages</div><input type="number" min="1" className="ui-input mt-2" value={draft.pages} onChange={(event) => updateDraft('pages', Number(event.target.value))} /></label>
              <label><div className="ui-heading">Copies</div><input type="number" min="1" className="ui-input mt-2" value={draft.copies} onChange={(event) => updateDraft('copies', Number(event.target.value))} /></label>
              <label>
                <div className="ui-heading">Color mode</div>
                <select className="ui-select mt-2 w-full" value={draft.colorMode} onChange={(event) => updateDraft('colorMode', event.target.value as PortalSubmissionDraft['colorMode'])}>
                  <option>Black & White</option>
                  <option disabled={!supportsColorOnAssignedRoute}>Color</option>
                </select>
                {!supportsColorOnAssignedRoute ? (
                  <div className="mt-2 text-xs text-slate-500">
                    Your assigned upload route is currently configured for black-and-white jobs only.
                  </div>
                ) : null}
              </label>
              <label>
                <div className="ui-heading">Paper type</div>
                <select className="ui-select mt-2 w-full" value={draft.paperType} onChange={(event) => updateDraft('paperType', event.target.value as PortalSubmissionDraft['paperType'])}>
                  <option>Standard</option>
                  <option>Heavy</option>
                  <option>Glossy</option>
                </select>
              </label>
              <label className="flex items-center gap-3 lg:col-span-2">
                <input type="checkbox" checked={draft.duplex} onChange={(event) => updateDraft('duplex', event.target.checked)} />
                <span className="text-sm text-ink-950">Double-sided printing when supported</span>
              </label>
            </div>
          </section>
          <section className="ui-panel">
            <div className="flex flex-col gap-3 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
              {feedback ? (
                <div className={`flex items-start gap-2 text-sm ${feedback.tone === 'success' ? 'text-accent-700' : 'text-danger-500'}`}>
                  {feedback.tone === 'success' ? <CheckCircle2 className="mt-0.5 size-4" /> : <AlertTriangle className="mt-0.5 size-4" />}
                  <span>{feedback.message}</span>
                </div>
              ) : (
                <div className="text-sm text-slate-500">PDF files are stored by the backend and held against your assigned route.</div>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" className="ui-button-secondary" onClick={() => navigate('/portal/history')}>History</button>
                <button type="submit" className="ui-button" disabled={isSubmitting}>{isSubmitting ? 'Sending...' : 'Submit job'}</button>
              </div>
            </div>
          </section>
        </form>

        <aside className="space-y-4">
          <section className="ui-panel overflow-hidden">
            <div className="border-b border-line bg-mist-50/80 px-4 py-3">
              <div className="text-base font-semibold text-ink-950">Assigned route</div>
            </div>
            <div className="space-y-3 px-4 py-4">
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <Info className="mt-0.5 size-4 text-accent-700" />
                <span>Resolved by policy. Queue selection is not available in the portal.</span>
              </div>
              <div className={`border px-3 py-3 ${defaultQueue?.available ? 'border-line bg-white' : 'border-danger-200 bg-danger-50/60'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-ink-950">{defaultQueue?.name ?? 'No assigned route'}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      {defaultQueue ? `${defaultQueue.printerName} · ${defaultQueue.location}` : 'A valid queue assignment is required before web submission can continue.'}
                    </div>
                  </div>
                  <div className={`rounded-full px-2.5 py-1 text-xs font-semibold ${defaultQueue?.available ? 'bg-accent-100 text-accent-700' : 'bg-danger-100 text-danger-500'}`}>
                    {defaultQueue?.available ? defaultQueue.submissionPath : 'Needs admin review'}
                  </div>
                </div>
                {defaultQueue ? (
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                    <span>{defaultQueue.releaseMode}</span>
                    <span>{defaultQueue.queueHost}</span>
                    <span>{defaultQueue.access}</span>
                  </div>
                ) : null}
                {!defaultQueue?.available && defaultQueue?.reason ? <div className="mt-3 text-sm font-medium text-danger-500">{defaultQueue.reason}</div> : null}
              </div>
              {alternateEligibleQueues.length > 0 ? (
                <div className="text-sm text-slate-500">
                  Other campus queues may still be available through device-side or desktop printing.
                </div>
              ) : null}
            </div>
          </section>

          <section className="ui-panel overflow-hidden">
            <div className="border-b border-line bg-mist-50/80 px-4 py-3"><div className="text-base font-semibold text-ink-950">Summary</div></div>
            <div className="space-y-3 px-4 py-4 text-sm text-slate-600">
              <div className="flex justify-between gap-4"><span>Assigned route</span><span className="font-medium text-ink-950">{defaultQueue?.name ?? 'None'}</span></div>
              <div className="flex justify-between gap-4"><span>Total pages</span><span className="font-medium text-ink-950">{totalPages}</span></div>
              <div className="flex justify-between gap-4"><span>Estimated cost</span><span className="font-medium text-ink-950">{formatUsd(estimatedCost)}</span></div>
              <div className="flex justify-between gap-4"><span>Output support</span><span className="font-medium text-ink-950">{supportsColorOnAssignedRoute ? 'Black & White, Color' : 'Black & White only'}</span></div>
              <div className="flex justify-between gap-4"><span>Release</span><span className="font-medium text-ink-950">{defaultQueue?.releaseMode ?? 'Assignment required'}</span></div>
              <div className="border-t border-line pt-4 text-slate-500">Held files clear after {profile?.retentionHours ?? 24} hours. Release still happens at the device, not in this upload form.</div>
            </div>
          </section>

          <section className="ui-panel overflow-hidden">
            <div className="border-b border-line bg-mist-50/80 px-4 py-3"><div className="text-base font-semibold text-ink-950">Quota</div></div>
            <div className="px-4 py-4">
              <div className="text-2xl font-semibold tracking-normal text-ink-950">{profile?.quotaUsed}/{profile?.quotaTotal}</div>
              <div className="mt-4 h-2 bg-slate-100"><div className="h-full bg-accent-700" style={{ width: `${profile ? (profile.quotaUsed / profile.quotaTotal) * 100 : 0}%` }} /></div>
              <div className="mt-3 text-sm text-slate-500">{quotaRemaining} pages currently available.</div>
            </div>
          </section>
        </aside>
      </div> : null}
    </div>
  )
}
