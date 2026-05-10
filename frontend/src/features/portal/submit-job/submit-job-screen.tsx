import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ChevronLeft, ChevronRight, FileText, Info, Upload } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/composite/page-header'
import { PortalFeedbackBanner, PortalProgressPanel } from '@/features/portal/shared/portal-feedback'
import { getPortalSubmissionSnapshot, submitPortalJob } from './api'
import { usePortalSubmissionForm } from './use-portal-submission-form'
import type { PortalSubmissionDraft } from '@/types/portal'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PortalSubmitJobScreen() {
  const navigate = useNavigate()
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getPortalSubmissionSnapshot>> | null>(null)
  const [snapshotError, setSnapshotError] = useState<string | null>(null)
  const { draft, feedback, file, isSubmitting, resetForm, setDraft, setFeedback, setFile, setIsSubmitting } = usePortalSubmissionForm()
  const defaultQueue = snapshot?.defaultQueue
  const queues = snapshot?.queues ?? []
  const profile = snapshot?.profile
  const quotaRemaining = profile ? profile.quotaTotal - profile.quotaUsed : 0
  const alternateEligibleQueues = queues.filter((queue) => queue.available && !queue.isDefault)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewPage, setPreviewPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [renderingPage, setRenderingPage] = useState(false)
  const previousPreviewUrl = useRef<string | null>(null)
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)

  const renderPage = useCallback(async (pageNum: number) => {
    const pdf = pdfDocRef.current
    if (!pdf || pageNum < 1 || pageNum > pdf.numPages) return

    setRenderingPage(true)
    try {
      const page = await pdf.getPage(pageNum)
      const scale = 1.5
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      await page.render({ canvas, canvasContext: ctx, viewport }).promise

      if (previousPreviewUrl.current) {
        URL.revokeObjectURL(previousPreviewUrl.current)
      }

      const dataUrl = canvas.toDataURL()
      previousPreviewUrl.current = dataUrl
      setPreviewUrl(dataUrl)
    } catch {
      setPreviewUrl(null)
    } finally {
      setRenderingPage(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (previousPreviewUrl.current) {
        URL.revokeObjectURL(previousPreviewUrl.current)
      }
      pdfDocRef.current?.destroy()
    }
  }, [])

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      setPreviewPage(1)
      setTotalPages(0)
      pdfDocRef.current?.destroy()
      pdfDocRef.current = null
      return
    }

    let cancelled = false
    const objectUrl = URL.createObjectURL(file)

    pdfjsLib.getDocument(objectUrl).promise
      .then((pdf) => {
        if (cancelled) {
          pdf.destroy()
          URL.revokeObjectURL(objectUrl)
          return
        }

        pdfDocRef.current?.destroy()
        pdfDocRef.current = pdf
        setTotalPages(pdf.numPages)
        setPreviewPage(1)
        renderPage(1)
        URL.revokeObjectURL(objectUrl)
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewUrl(null)
          setTotalPages(0)
        }
        URL.revokeObjectURL(objectUrl)
      })

    return () => {
      cancelled = true
    }
  }, [file, renderPage])

  useEffect(() => {
    if (!pdfDocRef.current || previewPage < 1) return
    renderPage(previewPage)
  }, [previewPage, renderPage])

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

    if (!Number.isInteger(draft.copies) || draft.copies < 1 || draft.copies > 25) {
      setFeedback({ tone: 'error', message: 'Submit between 1 and 25 copies.' })
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Backend print request failed.'
      setFeedback({ tone: 'error', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSuccess = feedback?.tone === 'success'

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Portal"
        title="Submit job"
        description="Upload one PDF to your assigned campus print route."
      />

      {snapshotError ? (
        <PortalFeedbackBanner
          tone="error"
          title="Route load failed"
          message={snapshotError}
          onDismiss={() => setSnapshotError(null)}
        />
      ) : null}

      <PortalProgressPanel
        title="Loading..."
        message="Loading your assigned route..."
        visible={!snapshot && !snapshotError}
      />

      {snapshot ? <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <AnimatePresence mode="wait">
          {isSuccess && !isSubmitting ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="ui-panel flex flex-col items-center justify-center px-6 py-16 text-center"
            >
              <CheckCircle2 className="size-12 text-green-600" />
              <div className="mt-4 text-xl font-semibold text-ink-950">Job saved</div>
              <div className="mt-2 max-w-sm text-sm text-slate-500">
                Go to History to store it on the printer and reveal your PIN.
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  className="ui-button"
                  onClick={() => navigate('/portal/history')}
                >
                  Go to History
                </button>
                <button
                  type="button"
                  className="ui-button-secondary"
                  onClick={() => {
                    resetForm()
                    setFeedback(null)
                  }}
                >
                  Submit another
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <form className="space-y-4" onSubmit={handleSubmit}>
                <PortalProgressPanel
                  title="Saving job..."
                  message="Uploading PDF and creating a held print job."
                  visible={isSubmitting}
                />

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
                    <div className="text-base font-semibold text-ink-950">Print request</div>
                  </div>
                  <div className="grid gap-4 px-4 py-4 lg:grid-cols-2">
                    <label>
                      <div className="ui-heading">Copies</div>
                      <input
                        type="number"
                        min="1"
                        max="25"
                        className="ui-input mt-2"
                        value={draft.copies}
                        onChange={(event) => updateDraft('copies', Number(event.target.value))}
                      />
                      <div className="mt-2 text-xs text-slate-500">
                        Copies are printed as one stored printer job with one PIN.
                      </div>
                    </label>
                    <div>
                      <div className="ui-heading">Page count</div>
                      <div className="mt-2 border border-line bg-mist-50 px-3 py-2 text-sm text-slate-600">
                        Calculated from the PDF after upload.
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        Page count is no longer editable because it affects quota and cost.
                      </div>
                    </div>
                    <div className="border-t border-line pt-4 text-sm text-slate-500 lg:col-span-2">
                      Color, duplex, and paper settings are controlled by the printer/queue defaults for now. They are hidden until the connector can enforce them per job.
                    </div>
                  </div>
                </section>
                <section className="ui-panel">
                  <div className="flex flex-col gap-3 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
                    {feedback?.tone === 'error' ? (
                      <PortalFeedbackBanner
                        tone="error"
                        title="Submission failed"
                        message={feedback.message}
                        onDismiss={() => setFeedback(null)}
                      />
                    ) : (
                      <PortalFeedbackBanner
                        tone="info"
                        title="Ready to submit"
                        message="Upload a PDF. The job is saved first, then sent to printer memory from History."
                      />
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="ui-button-secondary" onClick={() => navigate('/portal/history')}>History</button>
                      <button type="submit" className="ui-button" disabled={isSubmitting}>{isSubmitting ? 'Saving job...' : 'Submit job'}</button>
                    </div>
                  </div>
                </section>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <aside className="space-y-4">
          {previewUrl && file ? (
            <section className="ui-panel overflow-hidden">
              <div className="border-b border-line bg-mist-50/80 px-4 py-3">
                <div className="text-base font-semibold text-ink-950">Preview</div>
              </div>
              <div className="bg-panel">
                <div className="flex items-center justify-center border-b border-line bg-muted/70 px-4 py-3" style={{ height: 260 }}>
                  {renderingPage ? (
                    <div className="text-sm text-slate-400">Rendering...</div>
                  ) : (
                    <img
                      src={previewUrl}
                      alt={`Page ${previewPage}`}
                      className="max-h-full max-w-full border border-line bg-panel object-contain shadow-sm"
                    />
                  )}
                </div>
                {totalPages > 1 ? (
                  <div className="flex items-center justify-between border-b border-line px-2 py-1.5">
                    <button
                      type="button"
                      className="flex size-7 items-center justify-center rounded-sm text-slate-500 transition hover:bg-muted hover:text-ink-950 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                      disabled={previewPage <= 1 || renderingPage}
                      onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <span className="font-mono text-xs text-slate-500">
                      {previewPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      className="flex size-7 items-center justify-center rounded-sm text-slate-500 transition hover:bg-muted hover:text-ink-950 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                      disabled={previewPage >= totalPages || renderingPage}
                      onClick={() => setPreviewPage((p) => Math.min(totalPages, p + 1))}
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                ) : null}
                <div className="px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <FileText className="mt-0.5 size-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink-950">{file.name}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{formatFileSize(file.size)}{totalPages > 0 ? ` · ${totalPages} page${totalPages === 1 ? '' : 's'}` : ''}</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <section className="ui-panel overflow-hidden">
            <div className="border-b border-line bg-mist-50/80 px-4 py-3">
              <div className="text-base font-semibold text-ink-950">Assigned route</div>
            </div>
            <div className="space-y-3 px-4 py-4">
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <Info className="mt-0.5 size-4 text-accent-700" />
                <span>Resolved by policy. Queue selection is not available in the portal.</span>
              </div>
              <div className={`border px-3 py-3 ${defaultQueue?.available ? 'border-line bg-panel' : 'border-danger-200 bg-danger-100/40'}`}>
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
              <div className="flex justify-between gap-4"><span>Copies</span><span className="font-medium text-ink-950">{draft.copies}</span></div>
              <div className="flex justify-between gap-4"><span>Page count</span><span className="font-medium text-ink-950">Inferred by backend</span></div>
              <div className="flex justify-between gap-4"><span>Print settings</span><span className="font-medium text-ink-950">Queue defaults</span></div>
              <div className="flex justify-between gap-4"><span>Release</span><span className="font-medium text-ink-950">{defaultQueue?.releaseMode ?? 'Assignment required'}</span></div>
              <div className="border-t border-line pt-4 text-slate-500">Held files clear after {profile?.retentionHours ?? 24} hours. Device storage and PIN retrieval are handled from History.</div>
            </div>
          </section>

          <section className="ui-panel overflow-hidden">
            <div className="border-b border-line bg-mist-50/80 px-4 py-3"><div className="text-base font-semibold text-ink-950">Quota</div></div>
            <div className="px-4 py-4">
              <div className="text-2xl font-semibold tracking-normal text-ink-950">{profile?.quotaUsed}/{profile?.quotaTotal}</div>
              <div className="mt-4 h-2 bg-muted"><div className="h-full bg-accent-700" style={{ width: `${profile ? (profile.quotaUsed / profile.quotaTotal) * 100 : 0}%` }} /></div>
              <div className="mt-3 text-sm text-slate-500">{quotaRemaining} pages currently available.</div>
            </div>
          </section>
        </aside>
      </div> : null}
    </div>
  )
}
