import { useCallback, useDeferredValue, useEffect, useState } from 'react'
import { PrintersHeader } from '@/components/printer/PrintersHeader'
import { PrintersTable } from '@/components/printer/PrintersTable'
import { PrintersToolbar } from '@/components/printer/PrintersToolbar'
import type { PrinterStatusFilter } from '@/components/printer/printer-format'
import type { AdminPrinter } from '@/types/admin'
import { listTechPrinters } from './api'

export function TechPrintersScreen() {
  const [printers, setPrinters] = useState<AdminPrinter[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PrinterStatusFilter>('All statuses')
  const deferredSearch = useDeferredValue(search)

  const loadPrinters = useCallback(
    async () =>
      listTechPrinters({
        search: deferredSearch,
        status,
        limit: 100,
      }),
    [deferredSearch, status],
  )

  useEffect(() => {
    let cancelled = false

    loadPrinters()
      .then((nextPrinters) => {
        if (!cancelled) {
          setPrinters(nextPrinters)
          setLoadError(null)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load printers.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [loadPrinters])

  function resetPrinterFilters() {
    setSearch('')
    setStatus('All statuses')
  }

  return (
    <div className="min-w-0">
      <PrintersHeader />

      <PrintersToolbar
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onReset={resetPrinterFilters}
      />

      {loadError ? (
        <div className="mt-4 border border-danger-500/30 bg-danger-100 px-4 py-3 text-sm text-danger-500">
          {loadError}
        </div>
      ) : null}

      <div className="mt-4">
        <PrintersTable rows={printers} />
      </div>
    </div>
  )
}
