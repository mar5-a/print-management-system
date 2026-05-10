import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
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

type RecentPrintLogsPanelProps = {
  externalSearch?: string
  onTotalChange?: (total: number) => void
}

export function RecentPrintLogsPanel({ externalSearch, onTotalChange }: RecentPrintLogsPanelProps) {
  const [printLogs, setPrintLogs] = useState<PrintLogPage>(defaultPrintLogPage)
  const [search, setSearch] = useState(externalSearch ?? '')
  const [debouncedSearch, setDebouncedSearch] = useState(externalSearch ?? '')
  const [status, setStatus] = useState('all')
  const [device, setDevice] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof externalSearch !== 'string') {
      return
    }

    setSearch(externalSearch)
    setPage(1)
  }, [externalSearch])

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
          onTotalChange?.(nextPrintLogs.total)
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
  }, [debouncedSearch, status, device, page, limit, onTotalChange])

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

  const canExport = !isLoading && printLogs.rows.length > 0
  const exportFilename = useMemo(() => {
    const now = new Date()
    const formatted = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-')

    return `print-logs-${formatted}.csv`
  }, [])

  function handleExportCsv() {
    if (!canExport) {
      return
    }

    const headers = ['Time', 'User', 'Device', 'Pages', 'Status', 'Cost']
    const lines = printLogs.rows.map((row) => [row.time, row.user, row.device, row.pages, row.status, row.cost])
    const csv = [headers, ...lines]
      .map((line) => line.map((field) => escapeCsvField(String(field))).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = exportFilename
    anchor.click()

    window.URL.revokeObjectURL(url)
  }

  return (
    <section className="ui-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-mist-50/70 px-4 py-3.5">
        <div>
          <div className="text-base font-semibold text-ink-950">Recent print logs</div>
          <div className="mt-1 text-xs text-slate-500">{printLogs.total.toLocaleString()} records</div>
        </div>

        <button
          className="ui-button-secondary min-h-9 px-3 py-1.5 text-xs"
          type="button"
          onClick={handleExportCsv}
          disabled={!canExport}
          title={canExport ? 'Export current table rows to CSV' : 'No rows to export'}
        >
          <Download className="size-3.5" />
          Export CSV
        </button>
      </div>

      <div className="px-4 py-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(14rem,1fr)_minmax(12rem,0.9fr)_minmax(12rem,0.9fr)]">
          <PrintLogSearchInput value={search} onChange={handleSearchChange} placeholder="Search users, devices..." />
          <PrintLogFilterSelect
            ariaLabel="Filter print logs by status"
            placeholder="All statuses"
            value={status}
            options={printLogs.statusOptions}
            onChange={handleStatusChange}
          />
          <PrintLogFilterSelect
            ariaLabel="Filter print logs by device"
            placeholder="All printers"
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

function escapeCsvField(value: string) {
  if (!/[",\n]/.test(value)) {
    return value
  }

  return `"${value.replaceAll('"', '""')}"`
}
