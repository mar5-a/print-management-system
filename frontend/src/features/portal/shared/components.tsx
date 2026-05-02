import { FileClock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { formatUsd } from '@/lib/formatters'
import { getPortalJobStatusClass } from '@/lib/status'
import type { PortalJobStatus, PortalPrintJob, PortalQueueOption } from '@/types/portal'

export function PortalMetric({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <section className="ui-panel px-4 py-3">
      <div className="ui-heading">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-normal text-ink-950">{value}</div>
      {hint ? <div className="mt-1 text-sm text-slate-500">{hint}</div> : null}
    </section>
  )
}

export function PortalJobStatusBadge({ status }: { status: PortalJobStatus }) {
  return <Badge className={getPortalJobStatusClass(status)}>{status}</Badge>
}

export function PortalQueueCard({
  queue,
  selected,
  onSelect,
}: {
  queue: PortalQueueOption
  selected?: boolean
  onSelect?: () => void
}) {
  return (
    <button
      type="button"
      onClick={queue.available ? onSelect : undefined}
      className={`w-full border px-4 py-4 text-left transition ${
        selected
          ? 'border-ink-950 bg-ink-950 text-white'
          : queue.available
            ? 'border-line bg-white hover:border-slate-300 hover:bg-mist-50'
            : 'border-line bg-slate-100/60 text-slate-500'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{queue.name}</div>
          <div className={`mt-1 text-sm ${selected ? 'text-white/75' : 'text-slate-500'}`}>
            {queue.printerName} · {queue.location}
          </div>
        </div>
        <Badge
          className={
            queue.available
              ? selected
                ? 'bg-white/15 text-white'
                : 'bg-accent-100 text-accent-700'
              : 'bg-white text-slate-500'
          }
        >
          {queue.access}
        </Badge>
      </div>
      <div className={`mt-3 flex flex-wrap gap-3 text-sm ${selected ? 'text-white/75' : 'text-slate-500'}`}>
        <span>{queue.releaseMode}</span>
        <span>{queue.colorMode}</span>
      </div>
      {!queue.available && queue.reason ? <div className="mt-3 text-sm font-medium text-danger-500">{queue.reason}</div> : null}
    </button>
  )
}

export function DashboardActiveJob({
  job,
  onCancel,
}: {
  job: PortalPrintJob
  onCancel: (jobId: string) => void
}) {
  return (
    <div className="border-b border-line py-3 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-ink-950">{job.fileName}</div>
          <div className="mt-1 text-sm text-slate-500">{job.queueName} · {job.printerName}</div>
          <div className="mt-1 font-mono text-xs text-slate-500">{job.id}</div>
        </div>
        <PortalJobStatusBadge status={job.status} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
        <span>{job.totalPages} pages</span>
        <span>{formatUsd(job.cost)}</span>
        <span>{job.retentionDeadline ? `Held until ${job.retentionDeadline}` : job.details}</span>
      </div>
      {job.status === 'Pending Release' ? (
        <div className="mt-3">
          <button type="button" className="ui-button-secondary px-3 py-1.5" onClick={() => onCancel(job.id)}>
            Cancel pending job
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function RecentPortalJobsTable({ jobs }: { jobs: PortalPrintJob[] }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="text-base font-semibold text-ink-950">Recent jobs</div>
        <Link className="ui-button-secondary px-3 py-1.5" to="/portal/history">
          <FileClock className="size-4" />
          History
        </Link>
      </div>
      <DataTable<PortalPrintJob>
        columns={[
          {
            key: 'file',
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
            key: 'total',
            header: 'Total',
            render: (job) => <span className="ui-table-secondary">{job.totalPages} pages · {formatUsd(job.cost)}</span>,
          },
          {
            key: 'status',
            header: 'Status',
            render: (job) => <PortalJobStatusBadge status={job.status} />,
          },
        ]}
        rows={jobs.slice(0, 5)}
        getRowKey={(job) => job.id}
        emptyLabel="You have no print jobs yet."
      />
    </section>
  )
}
