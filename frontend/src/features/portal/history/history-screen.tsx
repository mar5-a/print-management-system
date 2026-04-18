import { Search } from 'lucide-react'
import { useState } from 'react'
import { FilterBar } from '@/components/composite/filter-bar'
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
  const [jobs, setJobs] = useState(() => listHistoryJobs())
  const { filteredJobs, search, setSearch, sortBy, setSortBy, statusFilter, setStatusFilter } =
    usePortalHistoryFilters(jobs)

  function handleCancel(jobId: string) {
    if (cancelHistoryJob(jobId)) {
      setJobs(listHistoryJobs())
    }
  }

  return (
    <div className="min-w-0">
      <section className="ui-panel mb-5 overflow-hidden">
        <div className="border-b border-line bg-mist-50/80 px-5 py-4">
          <div className="text-base font-semibold text-ink-950">Your print history</div>
          <div className="mt-1 text-sm text-slate-500">Only your own records are shown, including supplementary web uploads and jobs routed from your assigned campus queue.</div>
        </div>
        <div className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
          <label>
            <div className="ui-heading">Status</div>
            <select className="ui-select mt-2 w-full" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'All' | PortalJobStatus)}>
              <option>All</option>
              <option>Pending Release</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Failed</option>
              <option>Cancelled</option>
            </select>
          </label>
          <label>
            <div className="ui-heading">Sort by</div>
            <select className="ui-select mt-2 w-full" value={sortBy} onChange={(event) => setSortBy(event.target.value as 'Newest' | 'Oldest' | 'Highest cost')}>
              <option>Newest</option>
              <option>Oldest</option>
              <option>Highest cost</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <div className="ui-heading">Search</div>
            <label className="relative mt-2 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input className="ui-input pl-10" placeholder="Search file name, job ID, queue, or device" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
          </div>
        </div>
      </section>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search your jobs">
        <div className="text-sm text-slate-500">{filteredJobs.length} jobs found</div>
      </FilterBar>

      <div className="mt-4 space-y-4">
        {filteredJobs.length === 0 ? (
          <section className="ui-panel px-5 py-10 text-center text-sm text-slate-500">No print jobs match the current period or filter.</section>
        ) : (
          filteredJobs.map((job) => (
            <section key={job.id} className="ui-panel overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-line bg-mist-50/70 px-5 py-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-base font-semibold text-ink-950">{job.fileName}</div>
                  <div className="mt-1 text-sm text-slate-500">{job.submittedAt} · {job.queueName}</div>
                  <div className="mt-1 font-mono text-xs text-slate-500">{job.id}</div>
                </div>
                <PortalJobStatusBadge status={job.status} />
              </div>
              <div className="grid gap-4 px-5 py-5 md:grid-cols-3">
                <div>
                  <div className="ui-heading">Device</div>
                  <div className="mt-2 text-sm font-medium text-ink-950">{job.printerName}</div>
                </div>
                <div>
                  <div className="ui-heading">Total pages</div>
                  <div className="mt-2 text-sm font-medium text-ink-950">{job.totalPages}</div>
                  <div className="mt-1 text-sm text-slate-500">{job.pages} pages × {job.copies} copies</div>
                </div>
                <div>
                  <div className="ui-heading">Cost</div>
                  <div className="mt-2 text-sm font-medium text-ink-950">{formatUsd(job.cost)}</div>
                </div>
                <div className="md:col-span-3">
                  <div className="text-sm text-slate-500">{job.colorMode} · {job.duplex ? 'Duplex' : 'Single-sided'} · {job.paperType}</div>
                </div>
              </div>
              <div className="flex flex-col gap-3 border-t border-line px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-slate-500">{getHistoryMessage(job)}</div>
                {job.status === 'Pending Release' ? <button type="button" className="ui-button-secondary px-3 py-1.5" onClick={() => handleCancel(job.id)}>Cancel pending job</button> : null}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
