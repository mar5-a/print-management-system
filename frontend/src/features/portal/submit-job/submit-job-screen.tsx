import { AlertTriangle, CheckCircle2, Upload } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatUsd } from '@/lib/formatters'
import { PortalQueueCard } from '@/features/portal/shared/components'
import { getPortalSubmissionSnapshot, submitPortalJob } from './api'
import { usePortalSubmissionForm } from './use-portal-submission-form'
import type { PortalSubmissionDraft } from '@/types/portal'

export function PortalSubmitJobScreen() {
  const navigate = useNavigate()
  const { profile, queues } = useMemo(() => getPortalSubmissionSnapshot(), [])
  const { draft, feedback, file, resetForm, setDraft, setFeedback, setFile } = usePortalSubmissionForm()
  const selectedQueue = queues.find((queue) => queue.id === draft.queueId)
  const quotaRemaining = profile.quotaTotal - profile.quotaUsed
  const totalPages = draft.pages * draft.copies
  const estimatedCost = selectedQueue
    ? Number((totalPages * selectedQueue.costPerPage * (draft.duplex ? 0.9 : 1) * (draft.colorMode === 'Color' ? 2 : 1)).toFixed(2))
    : 0

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    setDraft((current) => ({ ...current, fileName: nextFile?.name ?? '' }))
    setFeedback(null)
  }

  function updateDraft<K extends keyof PortalSubmissionDraft>(field: K, value: PortalSubmissionDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file) {
      setFeedback({ tone: 'error', message: 'Choose a file before submitting.' })
      return
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    const allowedExtensions = ['pdf', 'docx', 'pptx']

    if (!allowedExtensions.includes(extension) || file.size > 20 * 1024 * 1024) {
      setFeedback({ tone: 'error', message: 'Use a PDF, DOCX, or PPTX file under 20 MB.' })
      return
    }

    if (!selectedQueue || !selectedQueue.available) {
      setFeedback({ tone: 'error', message: 'Select an available queue before submitting.' })
      return
    }

    if (totalPages > quotaRemaining) {
      setFeedback({ tone: 'error', message: 'This job exceeds your remaining quota.' })
      return
    }

    const createdJob = submitPortalJob({ ...draft, fileName: file.name })

    if (!createdJob) {
      setFeedback({ tone: 'error', message: 'The selected queue is not currently available.' })
      return
    }

    setFeedback({
      tone: 'success',
      message: `Job accepted as ${createdJob.id}. It will remain held for up to ${profile.retentionHours} hours if unreleased.`,
    })
    resetForm()
  }

  return (
    <div className="min-w-0">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <section className="ui-panel overflow-hidden">
            <div className="border-b border-line bg-mist-50/80 px-5 py-4">
              <div className="text-base font-semibold text-ink-950">File</div>
            </div>
            <div className="px-5 py-5">
              <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center border border-dashed border-line bg-mist-50 px-4 py-6 text-center">
                <Upload className="size-5 text-slate-500" />
                <div className="mt-3 text-sm font-semibold text-ink-950">{file ? file.name : 'Upload PDF, DOCX, or PPTX'}</div>
                <div className="mt-1 text-sm text-slate-500">Up to 20 MB</div>
                <input type="file" className="sr-only" accept=".pdf,.docx,.pptx" onChange={handleFileChange} />
              </label>
            </div>
          </section>

          <section className="ui-panel overflow-hidden">
            <div className="border-b border-line bg-mist-50/80 px-5 py-4">
              <div className="text-base font-semibold text-ink-950">Queue</div>
            </div>
            <div className="px-5 py-5">
              <div className="grid gap-3 lg:grid-cols-2">
                {queues.map((queue) => (
                  <PortalQueueCard
                    key={queue.id}
                    queue={queue}
                    selected={draft.queueId === queue.id}
                    onSelect={() => {
                      updateDraft('queueId', queue.id)
                      setFeedback(null)
                    }}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="ui-panel overflow-hidden">
            <div className="border-b border-line bg-mist-50/80 px-5 py-4">
              <div className="text-base font-semibold text-ink-950">Options</div>
            </div>
            <div className="grid gap-4 px-5 py-5 lg:grid-cols-2">
              <label><div className="ui-heading">Pages</div><input type="number" min="1" className="ui-input mt-2" value={draft.pages} onChange={(event) => updateDraft('pages', Number(event.target.value))} /></label>
              <label><div className="ui-heading">Copies</div><input type="number" min="1" className="ui-input mt-2" value={draft.copies} onChange={(event) => updateDraft('copies', Number(event.target.value))} /></label>
              <label>
                <div className="ui-heading">Color mode</div>
                <select className="ui-select mt-2 w-full" value={draft.colorMode} onChange={(event) => updateDraft('colorMode', event.target.value as PortalSubmissionDraft['colorMode'])}>
                  <option>Black & White</option>
                  <option>Color</option>
                </select>
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

          <section className="ui-panel overflow-hidden">
            <div className="flex flex-col gap-3 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
              {feedback ? (
                <div className={`flex items-start gap-2 text-sm ${feedback.tone === 'success' ? 'text-accent-700' : 'text-danger-500'}`}>
                  {feedback.tone === 'success' ? <CheckCircle2 className="mt-0.5 size-4" /> : <AlertTriangle className="mt-0.5 size-4" />}
                  <span>{feedback.message}</span>
                </div>
              ) : (
                <div className="text-sm text-slate-500">PDF, DOCX, and PPTX are accepted.</div>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" className="ui-button-secondary" onClick={() => navigate('/portal/history')}>History</button>
                <button type="submit" className="ui-button">Submit job</button>
              </div>
            </div>
          </section>
        </form>

        <aside className="space-y-5">
          <section className="ui-panel overflow-hidden">
            <div className="border-b border-line bg-mist-50/80 px-5 py-4"><div className="text-base font-semibold text-ink-950">Summary</div></div>
            <div className="space-y-4 px-5 py-5 text-sm text-slate-600">
              <div className="flex justify-between gap-4"><span>Selected queue</span><span className="font-medium text-ink-950">{selectedQueue?.name ?? 'None'}</span></div>
              <div className="flex justify-between gap-4"><span>Total pages</span><span className="font-medium text-ink-950">{totalPages}</span></div>
              <div className="flex justify-between gap-4"><span>Estimated cost</span><span className="font-medium text-ink-950">{formatUsd(estimatedCost)}</span></div>
              <div className="flex justify-between gap-4"><span>Release</span><span className="font-medium text-ink-950">{selectedQueue?.releaseMode ?? 'Select a queue'}</span></div>
              <div className="border-t border-line pt-4 text-slate-500">Held files clear after {profile.retentionHours} hours.</div>
            </div>
          </section>

          <section className="ui-panel overflow-hidden">
            <div className="border-b border-line bg-mist-50/80 px-5 py-4"><div className="text-base font-semibold text-ink-950">Quota</div></div>
            <div className="px-5 py-5">
              <div className="text-2xl font-semibold tracking-tight text-ink-950">{profile.quotaUsed}/{profile.quotaTotal}</div>
              <div className="mt-4 h-3 bg-slate-100"><div className="h-full bg-sky-600" style={{ width: `${(profile.quotaUsed / profile.quotaTotal) * 100}%` }} /></div>
              <div className="mt-3 text-sm text-slate-500">{profile.quotaTotal - profile.quotaUsed} pages currently available.</div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
