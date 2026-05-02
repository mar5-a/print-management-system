import { RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FilterBar } from '@/components/composite/filter-bar'
import { PageHeader } from '@/components/composite/page-header'
import { DataTable } from '@/components/ui/data-table'
import { formatUsd } from '@/lib/formatters'
import { PortalJobStatusBadge } from '@/features/portal/shared/components'
import { cancelHistoryJob, listHistoryJobs } from './api'
import { usePortalHistoryFilters } from './use-portal-history-filters'
import type { PortalPrintJob } from '@/types/portal'
import type { PortalJobStatus } from '@/types/portal'

function getHistoryMessage(job: PortalPrintJob) {
  if (job.status === 'Completed') return 'Saved in your history.'
  if (job.retentionDeadline) return `Held files purge at ${job.retentionDeadline}.`
  return job.details
}

export function PortalHistoryScreen() {
  const [jobs, setJobs] = useState<PortalPrintJob[]>([])
  const [error, setError] = useState<string | null>(null)
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
      await cancelHistoryJob(jobId)
      await refreshJobs()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to cancel job.')
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
                <option>Pending Release</option>
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
                  <div className="ui-table-meta mt-1">{job.colorMode} · {job.duplex ? 'Duplex' : 'Single-sided'} · {job.paperType}</div>
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
                  {job.status === 'Pending Release' ? (
                    <button type="button" className="ui-button-secondary h-8 min-h-8 w-fit px-3 py-0" onClick={() => handleCancel(job.id)}>
                      Cancel pending job
                    </button>
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
