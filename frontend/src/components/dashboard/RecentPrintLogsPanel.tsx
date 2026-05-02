import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import {
  listRecentPrintRows,
  type PrintLogPage,
} from '@/features/admin/dashboard/api'
import { PrintLogFilterSelect } from './print-logs/PrintLogFilterSelect'
import { PrintLogSearchInput } from './print-logs/PrintLogSearchInput'
import { PrintLogsPagination } from './print-logs/PrintLogsPagination'
import { PrintLogsTable } from './print-logs/PrintLogsTable'

const defaultPrintLogPage: PrintLogPage = {
  rows: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
  statusOptions: [],
  deviceOptions: [],
}

export function RecentPrintLogsPanel() {
  const [printLogs, setPrintLogs] = useState<PrintLogPage>(defaultPrintLogPage)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [device, setDevice] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, 250)

    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let isMounted = true

    async function loadPrintLogs() {
      setIsLoading(true)

      try {
        const nextPrintLogs = await listRecentPrintRows({
          search: debouncedSearch,
          status,
          device,
          page,
          limit,
        })

        if (isMounted) {
          setPrintLogs(nextPrintLogs)
          setError(null)
        }
      } catch (nextError) {
        if (isMounted) {
          setError(nextError instanceof Error ? nextError.message : 'Unable to load print logs.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadPrintLogs()

    return () => {
      isMounted = false
    }
  }, [debouncedSearch, status, device, page, limit])

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleStatusChange(value: string) {
    setStatus(value)
    setPage(1)
  }

  function handleDeviceChange(value: string) {
    setDevice(value)
    setPage(1)
  }

  function handleLimitChange(value: number) {
    setLimit(value)
    setPage(1)
  }

  return (
    <section className="ui-panel overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-line bg-white px-5 py-4">
        <div className="text-base font-semibold text-ink-950">Recent print logs</div>

        <button className="ui-button-secondary px-3 py-1.5">
          <FileText className="size-4" />
          Export print logs
        </button>
      </div>

      <div className="px-5 py-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(14rem,1fr)_minmax(12rem,0.9fr)_minmax(12rem,0.9fr)]">
          <PrintLogSearchInput value={search} onChange={handleSearchChange} />
          <PrintLogFilterSelect
            ariaLabel="Filter print logs by status"
            placeholder="Filter by status"
            value={status}
            options={printLogs.statusOptions}
            onChange={handleStatusChange}
          />
          <PrintLogFilterSelect
            ariaLabel="Filter print logs by device"
            placeholder="Filter by device"
            value={device}
            options={printLogs.deviceOptions}
            onChange={handleDeviceChange}
          />
        </div>

        <PrintLogsTable rows={printLogs.rows} isLoading={isLoading} error={error} />

        <PrintLogsPagination
          page={printLogs.page}
          limit={printLogs.limit}
          total={printLogs.total}
          totalPages={printLogs.totalPages}
          onPageChange={setPage}
          onLimitChange={handleLimitChange}
        />
      </div>
    </section>
  )
}
