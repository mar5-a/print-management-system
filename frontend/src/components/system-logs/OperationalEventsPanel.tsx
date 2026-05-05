import { useEffect, useState } from 'react'
import {
  listOperationalEvents,
  type LogsRange,
  type OperationalEventPage,
} from '@/features/admin/system-logs/api'
import { PrintLogFilterSelect } from '@/components/dashboard/print-logs/PrintLogFilterSelect'
import { PrintLogSearchInput } from '@/components/dashboard/print-logs/PrintLogSearchInput'
import { PrintLogsPagination } from '@/components/dashboard/print-logs/PrintLogsPagination'
import { OperationalEventsTable } from './OperationalEventsTable'

interface OperationalEventsPanelProps {
  range: LogsRange
  resetKey: number
}

const emptyOperationalEvents: OperationalEventPage = {
  rows: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
  typeOptions: [],
}

export function OperationalEventsPanel({ range, resetKey }: OperationalEventsPanelProps) {
  const [events, setEvents] = useState<OperationalEventPage>(emptyOperationalEvents)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [type, setType] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    listOperationalEvents({
      range,
      search: debouncedSearch,
      type,
      page,
      limit,
    })
      .then((nextEvents) => {
        if (!cancelled) {
          setEvents(nextEvents)
          setError(null)
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load operational events.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [debouncedSearch, limit, page, range, type])

  useEffect(() => {
    setPage(1)
  }, [range])

  useEffect(() => {
    setSearch('')
    setDebouncedSearch('')
    setType('all')
    setPage(1)
  }, [resetKey])

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleTypeChange(value: string) {
    setType(value)
    setPage(1)
  }

  function handleLimitChange(value: number) {
    setLimit(value)
    setPage(1)
  }

  return (
    <section className="ui-panel mt-5 overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-line bg-white px-5 py-4">
        <div className="text-base font-semibold text-ink-950">Operational events</div>
      </div>
      <div className="px-5 py-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(14rem,1fr)_minmax(12rem,0.9fr)]">
          <PrintLogSearchInput
            ariaLabel="Search operational events"
            placeholder="Search operational events..."
            value={search}
            onChange={handleSearchChange}
          />
          <PrintLogFilterSelect
            ariaLabel="Filter operational events by type"
            placeholder="Filter by type"
            value={type}
            options={events.typeOptions}
            onChange={handleTypeChange}
          />
        </div>

        <OperationalEventsTable rows={events.rows} isLoading={isLoading} error={error} />

        <PrintLogsPagination
          page={events.page}
          limit={events.limit}
          total={events.total}
          totalPages={events.totalPages}
          onPageChange={setPage}
          onLimitChange={handleLimitChange}
        />
      </div>
    </section>
  )
}
