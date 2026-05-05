import type { LogsOverview } from '@/features/admin/system-logs/api'

interface LogsOverviewPanelProps {
  overview: LogsOverview
  isLoading: boolean
  error: string | null
}

export function LogsOverviewPanel({ overview, isLoading, error }: LogsOverviewPanelProps) {
  return (
    <section className="ui-panel mb-5 overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <div className="text-base font-semibold text-ink-950">Print and release activity</div>
      </div>

      {error ? (
        <div className="border-b border-line bg-danger-100 px-5 py-3 text-sm text-danger-500">{error}</div>
      ) : null}

      <div className="grid gap-3 px-5 py-4 md:grid-cols-3">
        <OverviewMetric label="Total jobs" value={isLoading ? '...' : overview.totalJobs.toLocaleString()} tone="blue" />
        <OverviewMetric label="Held for release" value={isLoading ? '...' : overview.heldJobs.toLocaleString()} tone="violet" />
        <OverviewMetric label="Device/auth events" value={isLoading ? '...' : overview.deviceAuthEvents.toLocaleString()} tone="green" />
      </div>
    </section>
  )
}

function OverviewMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'blue' | 'green' | 'violet'
}) {
  const classes =
    tone === 'blue'
      ? 'bg-sky-500/10 text-sky-700'
      : tone === 'violet'
        ? 'bg-violet-500/10 text-violet-700'
        : 'bg-accent-100 text-accent-700'

  return (
    <div className={`px-4 py-3 ${classes}`}>
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{value}</div>
    </div>
  )
}
