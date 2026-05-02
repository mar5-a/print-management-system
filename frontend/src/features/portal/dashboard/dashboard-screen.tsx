import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { PageHeader } from '@/components/composite/page-header'
import { buildLinePoints } from '@/lib/charts'
import { formatUsd } from '@/lib/formatters'
import { DashboardActiveJob, PortalMetric, RecentPortalJobsTable } from '@/features/portal/shared/components'
import { cancelDashboardJob, getPortalDashboardSnapshot } from './api'

const usageLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function PortalDashboardScreen() {
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getPortalDashboardSnapshot>> | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    refreshSnapshot()
  }, [])

  async function refreshSnapshot() {
    try {
      setSnapshot(await getPortalDashboardSnapshot())
      setError(null)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load portal dashboard.')
    }
  }

  if (!snapshot) {
    return (
      <div className="min-w-0">
        <PageHeader
          eyebrow="Portal"
          title="Dashboard"
          description="Active print jobs, quota, and recent activity for your account."
        />
        <div className={`ui-panel px-4 py-6 text-sm ${error ? 'text-danger-500' : 'text-slate-500'}`}>
          {error ?? 'Loading portal dashboard...'}
        </div>
      </div>
    )
  }

  const { jobs, profile, weeklyUsage } = snapshot
  const activeJobs = jobs.filter((job) => job.status === 'Pending Release' || job.status === 'In Progress')
  const completedJobs = jobs.filter((job) => job.status === 'Completed')
  const totalCost = completedJobs.reduce((sum, job) => sum + job.cost, 0)
  const totalPages = completedJobs.reduce((sum, job) => sum + job.totalPages, 0)
  const quotaRemaining = profile.quotaTotal - profile.quotaUsed
  const quotaPercent = Math.min(100, Math.round((profile.quotaUsed / profile.quotaTotal) * 100))
  const linePoints = buildLinePoints(weeklyUsage, 440, 120)

  async function handleCancel(jobId: string) {
    try {
      await cancelDashboardJob(jobId)
      await refreshSnapshot()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to cancel job.')
    }
  }

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Portal"
        title="Dashboard"
        description="Active print jobs, quota, and recent activity for your account."
        meta={
          <Link className="ui-button-action" to="/portal/submit-job">
            <Upload className="size-4" />
            Submit job
          </Link>
        }
      />

      {error ? (
        <div className="mb-4 border border-danger-500/30 bg-danger-100 px-4 py-3 text-sm text-danger-500">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="ui-panel overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-line bg-mist-50/80 px-4 py-3">
            <div className="text-base font-semibold text-ink-950">Active jobs</div>
            <div className="text-sm text-slate-500">{activeJobs.length} active</div>
          </div>
          <div className="px-4 py-2">
            {activeJobs.length === 0 ? (
              <div className="py-8 text-sm text-slate-500">No active jobs right now.</div>
            ) : (
              activeJobs.map((job) => <DashboardActiveJob key={job.id} job={job} onCancel={handleCancel} />)
            )}
          </div>
        </section>

        <section className="ui-panel overflow-hidden">
          <div className="border-b border-line bg-mist-50/80 px-4 py-3">
            <div className="text-base font-semibold text-ink-950">Quota</div>
          </div>
          <div className="px-4 py-4">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <div className="text-3xl font-semibold tracking-normal text-ink-950">
                  {quotaRemaining}
                </div>
                <div className="mt-1 text-sm text-slate-500">pages remaining</div>
              </div>
              <div className="text-right text-sm text-slate-500">
                <div className="font-medium text-ink-950">{quotaPercent}% used</div>
                <div>{profile.quotaUsed}/{profile.quotaTotal}</div>
              </div>
            </div>
            <div className="mt-4 h-2 bg-slate-100">
              <div className="h-full bg-accent-700" style={{ width: `${quotaPercent}%` }} />
            </div>
            <div className="mt-3 text-sm text-slate-500">Held files clear after {profile.retentionHours} hours.</div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <PortalMetric label="Completed pages" value={`${totalPages}`} hint="This period" />
        <PortalMetric label="Completed cost" value={formatUsd(totalCost)} hint="From completed jobs" />
        <PortalMetric label="Quota used" value={`${quotaPercent}%`} hint={`${quotaRemaining} pages left`} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="ui-panel overflow-hidden">
          <div className="border-b border-line bg-mist-50/80 px-4 py-3">
            <div className="text-base font-semibold text-ink-950">Usage this week</div>
          </div>
          <div className="px-4 py-4">
            <div className="rounded-none border border-line bg-white p-4">
              <svg viewBox="0 0 440 140" className="h-44 w-full">
                {[0, 1, 2, 3].map((row) => (
                  <line key={row} x1="0" x2="440" y1={20 + row * 30} y2={20 + row * 30} stroke="#e7edf3" />
                ))}
                <polyline fill="none" points={linePoints} transform="translate(0 10)" stroke="#0f7a4b" strokeWidth="3" />
                {linePoints.split(' ').map((point, index) => {
                  const [x, y] = point.split(',').map(Number)
                  return <circle key={`${point}-${index}`} cx={x} cy={y + 10} r="3.5" fill="#0f7a4b" />
                })}
              </svg>
              <div className="mt-3 grid grid-cols-7 text-center font-mono text-[0.68rem] uppercase tracking-[0.08em] text-slate-500">
                {usageLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <RecentPortalJobsTable jobs={jobs} />
      </div>
    </div>
  )
}
