import { Calendar, Eye, LoaderCircle, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { FilterBar } from '@/components/composite/filter-bar'
import { PageHeader } from '@/components/composite/page-header'
import { DataTable } from '@/components/ui/data-table'
import { formatUsd } from '@/lib/formatters'
import { PortalJobStatusBadge } from '@/features/portal/shared/components'
import { PortalFeedbackBanner, PortalProgressPanel } from '@/features/portal/shared/portal-feedback'
import { cancelHistoryJob, getHistoryJobDevicePin, listHistoryJobs, storeHistoryJobOnDevice } from './api'
import { usePortalHistoryFilters } from './use-portal-history-filters'
import type { PortalDeviceReleaseInfo, PortalPrintJob } from '@/types/portal'
import type { PortalJobStatus } from '@/types/portal'

function getHistoryMessage(job: PortalPrintJob) {
  if (job.status === 'Completed') return 'Saved in your history.'
  if (job.status === 'Stored on printer') return 'Stored in printer memory and waiting for panel release.'
  if (job.status === 'Sending to printer') return 'Submission may have reached printer memory. Reveal PIN if the job appears on the printer panel.'
  if (job.status === 'Failed') return job.details
  if (job.status === 'Expired') return job.details
  if (job.retentionDeadline) return `Held files purge at ${job.retentionDeadline}.`
  return job.details
}

export function PortalHistoryScreen() {
  const [jobs, setJobs] = useState<PortalPrintJob[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [workingJobId, setWorkingJobId] = useState<string | null>(null)
  const [recentlyStoredJobId, setRecentlyStoredJobId] = useState<string | null>(null)
  const [deviceReleases, setDeviceReleases] = useState<Record<string, PortalDeviceReleaseInfo>>({})
  const { filteredJobs, search, setSearch, sortBy, setSortBy, statusFilter, setStatusFilter } =
    usePortalHistoryFilters(jobs)

  useEffect(() => {
    refreshJobs()
  }, [])

  async function refreshJobs() {
    try {
      const nextJobs = await listHistoryJobs()
      setJobs(nextJobs)
      setError(null)
      return nextJobs
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load print history.')
      throw nextError
    }
  }

  async function handleCancel(jobId: string) {
    try {
      setWorkingJobId(jobId)
      setRecentlyStoredJobId(null)
      await cancelHistoryJob(jobId)
      await refreshJobs()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to cancel job.')
    } finally {
      setWorkingJobId(null)
    }
  }

  async function handleStoreOnDevice(jobId: string) {
    try {
      setWorkingJobId(jobId)
      setNotice(null)
      const result = await storeHistoryJobOnDevice(jobId)
      const deviceRelease = result.deviceRelease
      if (deviceRelease) {
        setDeviceReleases((current) => ({ ...current, [jobId]: deviceRelease }))
      }
      await refreshJobs()
      setRecentlyStoredJobId(jobId)
    } catch (nextError) {
      const nextJobs = await refreshJobs().catch(() => null)
      const recoveredJob = nextJobs?.find((job) => job.id === jobId)

      if (recoveredJob?.status === 'Stored on printer') {
        try {
          const deviceRelease = await getHistoryJobDevicePin(jobId)
          setDeviceReleases((current) => ({ ...current, [jobId]: deviceRelease }))
          setError(null)
          setNotice('The printer accepted the job after the first response failed. The PIN was recovered from the backend.')
          return
        } catch {
          setError('The printer accepted the job, but the PIN could not be reloaded automatically. Use Reveal PIN from History.')
          return
        }
      }

      setError(nextError instanceof Error ? nextError.message : 'Unable to send job to printer memory.')
    } finally {
      setWorkingJobId(null)
    }
  }

  async function handleRevealPin(jobId: string) {
    try {
      setWorkingJobId(jobId)
      const deviceRelease = await getHistoryJobDevicePin(jobId)
      setDeviceReleases((current) => ({ ...current, [jobId]: deviceRelease }))
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to reveal device PIN.')
    } finally {
      setWorkingJobId(null)
    }
  }

  const groupedJobs = useMemo(() => {
    const groups: { label: string; jobs: PortalPrintJob[] }[] = []
    const today = new Date()
    const todayStr = today.toLocaleDateString()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toLocaleDateString()

    for (const job of filteredJobs) {
      const jobDate = new Date(job.submittedAt)
      const dateStr = jobDate.toLocaleDateString()
      let label: string
      if (dateStr === todayStr) {
        label = 'Today'
      } else if (dateStr === yesterdayStr) {
        label = 'Yesterday'
      } else {
        label = jobDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
      }

      const existing = groups.find((g) => g.label === label)
      if (existing) {
        existing.jobs.push(job)
      } else {
        groups.push({ label, jobs: [job] })
      }
    }

    return groups
  }, [filteredJobs])

  const tableColumns = [
    {
      key: 'document' as const,
      header: 'Document',
      render: (job: PortalPrintJob) => (
        <div>
          <div className="ui-table-primary-strong">{job.fileName}</div>
          <div className="ui-table-meta mt-1">{job.id}</div>
        </div>
      ),
    },
    {
      key: 'submitted' as const,
      header: 'Submitted',
      render: (job: PortalPrintJob) => (
        <div>
          <div className="ui-table-secondary">{job.submittedAt}</div>
          <div className="ui-table-meta mt-1">{job.queueName}</div>
        </div>
      ),
    },
    {
      key: 'device' as const,
      header: 'Device',
      render: (job: PortalPrintJob) => <span className="ui-table-secondary">{job.printerName}</span>,
    },
    {
      key: 'output' as const,
      header: 'Output',
      render: (job: PortalPrintJob) => (
        <div>
          <div className="ui-table-secondary">{job.totalPages} pages · {formatUsd(job.cost)}</div>
          <div className="ui-table-meta mt-1">{job.pages} inferred pages · {job.copies} {job.copies === 1 ? 'copy' : 'copies'} · queue defaults</div>
        </div>
      ),
    },
    {
      key: 'status' as const,
      header: 'Status',
      render: (job: PortalPrintJob) => <PortalJobStatusBadge status={job.status} />,
    },
    {
      key: 'message' as const,
      header: 'Details',
      render: (job: PortalPrintJob) => (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-slate-600">{getHistoryMessage(job)}</div>
          {job.status === 'Ready to send' || job.status === 'Failed' ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="ui-button h-8 min-h-8 w-fit px-3 py-0"
                disabled={workingJobId === job.id}
                onClick={() => handleStoreOnDevice(job.id)}
              >
                {workingJobId === job.id ? 'Sending to printer memory...' : job.status === 'Failed' ? 'Retry storing on printer' : 'Store on printer'}
              </button>
              {job.status === 'Ready to send' ? (
                <button
                  type="button"
                  className="ui-button-secondary h-8 min-h-8 w-fit px-3 py-0"
                  disabled={workingJobId === job.id}
                  onClick={() => handleCancel(job.id)}
                >
                  Cancel pending job
                </button>
              ) : null}
            </div>
          ) : null}
          {job.status === 'Stored on printer' || job.status === 'Sending to printer' ? (
            <DeviceReleasePanel
              job={job}
              release={deviceReleases[job.id]}
              isWorking={workingJobId === job.id}
              isFreshlyStored={recentlyStoredJobId === job.id}
              onReveal={() => handleRevealPin(job.id)}
            />
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Portal"
        title="History"
        description="Your print records, web uploads, and assigned campus queue activity."
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search file name, job ID, queue, or device"
        actions={<div className="text-sm text-slate-500">{filteredJobs.length} jobs found</div>}
        filters={
          <>
            <label className="min-w-[11rem] flex-1 sm:flex-none">
              <span className="sr-only">Status</span>
              <select className="ui-select h-9 w-full min-w-[11rem]" aria-label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'All' | PortalJobStatus)}>
                <option>All</option>
                <option>Ready to send</option>
                <option>Stored on printer</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Failed</option>
                <option>Cancelled</option>
                <option>Expired</option>
              </select>
            </label>
            <label className="min-w-[10rem] flex-1 sm:flex-none">
              <span className="sr-only">Sort by</span>
              <select className="ui-select h-9 w-full min-w-[10rem]" aria-label="Sort by" value={sortBy} onChange={(event) => setSortBy(event.target.value as 'Newest' | 'Oldest' | 'Highest cost')}>
                <option>Newest</option>
                <option>Oldest</option>
                <option>Highest cost</option>
              </select>
            </label>
            <button type="button" className="ui-button-secondary h-9 px-3 py-0" onClick={() => { setSearch(''); setSortBy('Newest'); setStatusFilter('All') }}>
              <RotateCcw className="size-3.5" />
              Reset
            </button>
          </>
        }
      />

      {error ? (
        <PortalFeedbackBanner
          tone="error"
          title="Something went wrong"
          message={error}
          onDismiss={() => setError(null)}
        />
      ) : null}

      {notice ? (
        <PortalFeedbackBanner
          tone="success"
          title="Job stored"
          message={notice}
          onDismiss={() => setNotice(null)}
        />
      ) : null}

      <PortalProgressPanel
        visible={!!workingJobId}
        title="Sending to printer memory..."
        message="This may take a moment while the connector reaches the printer."
      />

      {groupedJobs.length === 0 ? (
        <div className="mt-4 ui-panel px-4 py-8 text-sm text-slate-500">No print jobs match the current filters.</div>
      ) : (
        <div className="mt-4 space-y-4">
          {groupedJobs.map((group) => (
            <section key={group.label}>
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="size-4 text-slate-400" />
                <span className="text-sm font-semibold text-ink-950">{group.label}</span>
                <span className="text-xs text-slate-500">{group.jobs.length} job{group.jobs.length === 1 ? '' : 's'}</span>
              </div>
              <DataTable<PortalPrintJob>
                columns={tableColumns}
                rows={group.jobs}
                getRowKey={(job) => job.id}
                emptyLabel=""
              />
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function DeviceReleasePanel({
  job,
  release,
  isWorking,
  isFreshlyStored,
  onReveal,
}: {
  job: PortalPrintJob
  release?: PortalDeviceReleaseInfo
  isWorking: boolean
  isFreshlyStored: boolean
  onReveal: () => void
}) {
  const username = release?.username ?? job.deviceStorageUsername ?? 'Assigned folder'
  const jobName = release?.jobName ?? job.deviceStorageJobName ?? 'Stored job'

  return (
    <div className={`border border-line bg-mist-50 px-4 py-3 text-sm text-slate-600 ${
      isFreshlyStored ? 'border-l-4 border-l-green-600' : ''
    }`}>
      <div className="font-medium text-ink-950">Printer panel instructions</div>
      <div className="my-2.5 h-px bg-line" />
      <ol className="space-y-1.5">
        <li>
          <span className="text-slate-500">1.</span>{' '}
          Open <span className="font-medium text-ink-950">Retrieve from Device Memory</span>
        </li>
        <li>
          <span className="text-slate-500">2.</span>{' '}
          Select folder:{' '}
          <span className="font-mono font-medium text-ink-950">{username}</span>
        </li>
        <li>
          <span className="text-slate-500">3.</span>{' '}
          Select job:{' '}
          <span className="font-mono font-medium text-ink-950">{jobName}</span>
        </li>
        <li>
          <span className="text-slate-500">4.</span>{' '}
          Enter PIN:{' '}
          <span className="inline-flex items-center justify-center min-w-[5rem] rounded-sm bg-panel px-2.5 py-1 font-mono text-base font-semibold tracking-widest text-ink-950 ring-1 ring-line">
            {release ? release.pin : '----'}
          </span>
        </li>
      </ol>
      {!release ? (
        <button
          type="button"
          className="ui-button-secondary mt-3 h-8 min-h-8 w-fit px-3 py-0"
          disabled={isWorking}
          onClick={onReveal}
        >
          {isWorking ? <LoaderCircle className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
          {isWorking ? 'Revealing...' : 'Reveal PIN'}
        </button>
      ) : null}
    </div>
  )
}
