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
    <section className="ui-panel overflow-hidden">
      <div className="h-1 w-full bg-sky-600" />
      <div className="px-4 py-4">
        <div className="ui-heading">{label}</div>
        <div className="mt-3 text-3xl font-semibold tracking-tight text-ink-950">{value}</div>
        {hint ? <div className="mt-1 text-sm text-slate-500">{hint}</div> : null}
      </div>
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
    <div className="border-b border-line py-4 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-ink-950">{job.fileName}</div>
          <div className="mt-1 text-sm text-slate-500">{job.queueName} · {job.printerName}</div>
          <div className="mt-1 font-mono text-xs text-slate-500">{job.id}</div>
        </div>
        <PortalJobStatusBadge status={job.status} />
      </div>
      <div className="mt-2 text-sm text-slate-500">
        {job.totalPages} pages · {formatUsd(job.cost)}
      </div>
      <div className="mt-2 text-sm text-slate-500">
        {job.retentionDeadline ? `Held until ${job.retentionDeadline}.` : job.details}
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
    <section className="ui-panel overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-line bg-mist-50/80 px-5 py-4">
        <div className="text-base font-semibold text-ink-950">Recent jobs</div>
        <Link className="ui-button-secondary px-3 py-1.5" to="/portal/history">
          <FileClock className="size-4" />
          History
        </Link>
      </div>
      <div className="px-5 py-4">
        <DataTable<PortalPrintJob>
          columns={[
            {
              key: 'file',
              header: 'Document',
              render: (job) => (
                <div>
                  <div className="font-semibold text-ink-950">{job.fileName}</div>
                  <div className="mt-1 text-sm text-slate-500">{job.id}</div>
                </div>
              ),
            },
            {
              key: 'submitted',
              header: 'Submitted',
              render: (job) => (
                <div>
                  <div className="text-sm font-medium text-ink-950">{job.submittedAt}</div>
                  <div className="mt-1 text-sm text-slate-500">{job.queueName}</div>
                </div>
              ),
            },
            {
              key: 'device',
              header: 'Device',
              render: (job) => <span className="text-sm text-slate-600">{job.printerName}</span>,
            },
            {
              key: 'total',
              header: 'Total',
              render: (job) => <span className="text-sm text-slate-600">{job.totalPages} pages · {formatUsd(job.cost)}</span>,
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
      </div>
    </section>
  )
}
