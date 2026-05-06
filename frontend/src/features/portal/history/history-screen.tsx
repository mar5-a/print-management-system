import { Eye, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FilterBar } from '@/components/composite/filter-bar'
import { PageHeader } from '@/components/composite/page-header'
import { DataTable } from '@/components/ui/data-table'
import { formatUsd } from '@/lib/formatters'
import { PortalJobStatusBadge } from '@/features/portal/shared/components'
import { cancelHistoryJob, getHistoryJobDevicePin, listHistoryJobs, storeHistoryJobOnDevice } from './api'
import { usePortalHistoryFilters } from './use-portal-history-filters'
import type { PortalDeviceReleaseInfo, PortalPrintJob } from '@/types/portal'
import type { PortalJobStatus } from '@/types/portal'

function getHistoryMessage(job: PortalPrintJob) {
  if (job.status === 'Completed') return 'Saved in your history.'
  if (job.status === 'Stored on printer') return 'Stored in printer memory and waiting for panel release.'
  if (job.retentionDeadline) return `Held files purge at ${job.retentionDeadline}.`
  return job.details
}

export function PortalHistoryScreen() {
  const [jobs, setJobs] = useState<PortalPrintJob[]>([])
  const [error, setError] = useState<string | null>(null)
  const [workingJobId, setWorkingJobId] = useState<string | null>(null)
  const [deviceReleases, setDeviceReleases] = useState<Record<string, PortalDeviceReleaseInfo>>({})
  const { filteredJobs, search, setSearch, sortBy, setSortBy, statusFilter, setStatusFilter } =
    usePortalHistoryFilters(jobs)

  useEffect(() => {
    refreshJobs()
  }, [])

  async function refreshJobs() {
    try {
      setJobs(await listHistoryJobs())
      setError(null)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load print history.')
    }
  }

  async function handleCancel(jobId: string) {
    try {
      setWorkingJobId(jobId)
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
      const result = await storeHistoryJobOnDevice(jobId)
      const deviceRelease = result.deviceRelease
      if (deviceRelease) {
        setDeviceReleases((current) => ({ ...current, [jobId]: deviceRelease }))
      }
      await refreshJobs()
    } catch (nextError) {
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
        <div className="mt-4 border border-danger-500/30 bg-danger-100 px-4 py-3 text-sm text-danger-500">
          {error}
        </div>
      ) : null}

      <div className="mt-4">
        <DataTable<PortalPrintJob>
          columns={[
            {
              key: 'document',
              header: 'Document',
              render: (job) => (
                <div>
                  <div className="ui-table-primary-strong">{job.fileName}</div>
                  <div className="ui-table-meta mt-1">{job.id}</div>
                </div>
              ),
            },
            {
              key: 'submitted',
              header: 'Submitted',
              render: (job) => (
                <div>
                  <div className="ui-table-secondary">{job.submittedAt}</div>
                  <div className="ui-table-meta mt-1">{job.queueName}</div>
                </div>
              ),
            },
            {
              key: 'device',
              header: 'Device',
              render: (job) => <span className="ui-table-secondary">{job.printerName}</span>,
            },
            {
              key: 'output',
              header: 'Output',
              render: (job) => (
                <div>
                  <div className="ui-table-secondary">{job.totalPages} pages · {formatUsd(job.cost)}</div>
                  <div className="ui-table-meta mt-1">{job.pages} inferred pages · {job.copies} {job.copies === 1 ? 'copy' : 'copies'} · queue defaults</div>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (job) => <PortalJobStatusBadge status={job.status} />,
            },
            {
              key: 'message',
              header: 'Details',
              render: (job) => (
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-slate-600">{getHistoryMessage(job)}</div>
                  {job.status === 'Ready to send' ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="ui-button h-8 min-h-8 w-fit px-3 py-0"
                        disabled={workingJobId === job.id}
                        onClick={() => handleStoreOnDevice(job.id)}
                      >
                        {workingJobId === job.id ? 'Sending to printer memory...' : 'Store on printer'}
                      </button>
                      <button
                        type="button"
                        className="ui-button-secondary h-8 min-h-8 w-fit px-3 py-0"
                        disabled={workingJobId === job.id}
                        onClick={() => handleCancel(job.id)}
                      >
                        Cancel pending job
                      </button>
                    </div>
                  ) : null}
                  {job.status === 'Stored on printer' ? (
                    <DeviceReleasePanel
                      job={job}
                      release={deviceReleases[job.id]}
                      isWorking={workingJobId === job.id}
                      onReveal={() => handleRevealPin(job.id)}
                    />
                  ) : null}
                </div>
              ),
            },
          ]}
          rows={filteredJobs}
          getRowKey={(job) => job.id}
          emptyLabel="No print jobs match the current filters."
        />
      </div>
    </div>
  )
}

function DeviceReleasePanel({
  job,
  release,
  isWorking,
  onReveal,
}: {
  job: PortalPrintJob
  release?: PortalDeviceReleaseInfo
  isWorking: boolean
  onReveal: () => void
}) {
  const username = release?.username ?? job.deviceStorageUsername ?? 'Assigned folder'
  const jobName = release?.jobName ?? job.deviceStorageJobName ?? 'Stored job'
  const pin = release?.pin ?? '••••'

  return (
    <div className="border border-line bg-mist-50 px-3 py-3 text-sm text-slate-600">
      <div className="font-medium text-ink-950">Printer panel instructions</div>
      <div className="mt-2">
        Retrieve from Device Memory → folder <span className="font-mono text-ink-950">{username}</span> → job{' '}
        <span className="font-mono text-ink-950">{jobName}</span> → PIN{' '}
        <span className="font-mono text-ink-950">{pin}</span>
      </div>
      {!release ? (
        <button
          type="button"
          className="ui-button-secondary mt-3 h-8 min-h-8 w-fit px-3 py-0"
          disabled={isWorking}
          onClick={onReveal}
        >
          <Eye className="size-3.5" />
          {isWorking ? 'Revealing...' : 'Reveal PIN'}
        </button>
      ) : null}
    </div>
  )
}
