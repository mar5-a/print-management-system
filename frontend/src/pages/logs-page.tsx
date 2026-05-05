import { useEffect, useState } from 'react'
import { RecentPrintLogsPanel } from '../components/dashboard/RecentPrintLogsPanel'
import { LogsFilters } from '../components/system-logs/LogsFilters'
import { LogsHeader } from '../components/system-logs/LogsHeader'
import { LogsOverviewPanel } from '../components/system-logs/LogsOverviewPanel'
import { OperationalEventsPanel } from '../components/system-logs/OperationalEventsPanel'
import {
  getLogsOverview,
  type LogsOverview,
  type LogsRange,
} from '../features/admin/system-logs/api'

const emptyOverview: LogsOverview = {
  totalJobs: 0,
  heldJobs: 0,
  deviceAuthEvents: 0,
}

export function LogsPage() {
  const [range, setRange] = useState<LogsRange>('week')
  const [overview, setOverview] = useState<LogsOverview>(emptyOverview)
  const [isOverviewLoading, setIsOverviewLoading] = useState(true)
  const [overviewError, setOverviewError] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setIsOverviewLoading(true)

    getLogsOverview(range)
      .then((nextOverview) => {
        if (!cancelled) {
          setOverview(nextOverview)
          setOverviewError(null)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setOverviewError(error instanceof Error ? error.message : 'Unable to load log overview.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsOverviewLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [range])

  function resetFilters() {
    setRange('week')
    setResetKey((current) => current + 1)
  }

  return (
    <div className="min-w-0">
      <LogsHeader />
      <LogsFilters
        range={range}
        onRangeChange={setRange}
        onReset={resetFilters}
      />
      <LogsOverviewPanel overview={overview} isLoading={isOverviewLoading} error={overviewError} />
      <RecentPrintLogsPanel />
      <OperationalEventsPanel range={range} resetKey={resetKey} />
    </div>
  )
}
