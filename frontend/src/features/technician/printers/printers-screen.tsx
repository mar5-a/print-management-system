import { useDeferredValue, useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { FilterBar } from '@/components/ui/filter-bar'
import { PageHeader } from '@/components/ui/page-header'
import { listTechPrinters } from './api'
import type { AdminPrinter } from '@/types/admin'

function getPrinterStatusClass(status: AdminPrinter['status']) {
  return status === 'Online'
    ? 'text-sm text-accent-700'
    : status === 'Offline'
      ? 'text-sm text-danger-500'
      : 'text-sm text-warn-500'
}

function getPrinterOperationalIssue(printer: AdminPrinter) {
  if (printer.status === 'Offline') {
    return 'Release blocked until the device reconnects.'
  }

  if (printer.status === 'Maintenance') {
    return 'Maintenance mode is active.'
  }

  if (printer.toner <= 20) {
    return 'Low toner warning.'
  }

  return 'No active device fault.'
}

export function TechPrintersScreen() {
  const printers = listTechPrinters()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'All' | AdminPrinter['status'] | 'Needs attention'>('All')
  const deferredSearch = useDeferredValue(search)

  const filteredPrinters = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return printers.filter((printer) => {
      const matchesSearch =
        !query ||
        [printer.name, printer.model, printer.location, printer.status, printer.queue].some((v) =>
          v.toLowerCase().includes(query),
        )
      const matchesStatus =
        status === 'All'
          ? true
          : status === 'Needs attention'
            ? printer.status !== 'Online' || printer.toner <= 20
            : printer.status === status

      return matchesSearch && matchesStatus
    })
  }, [printers, deferredSearch, status])

  function resetFilters() {
    setSearch('')
    setStatus('All')
  }

  return (
    <div className="min-w-0">
      <PageHeader eyebrow="Printers" title="Printer health" />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search printers"
        filters={
          <>
            <label className="min-w-[10rem] flex-1 sm:flex-none">
              <span className="sr-only">Status</span>
              <select
                className="ui-select h-9 w-full min-w-[10rem]"
                aria-label="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value as 'All' | AdminPrinter['status'] | 'Needs attention')}
              >
                <option>All</option>
                <option>Needs attention</option>
                <option>Online</option>
                <option>Offline</option>
                <option>Maintenance</option>
              </select>
            </label>
            <button type="button" className="ui-button-secondary h-9 px-3 py-0" onClick={resetFilters}>
              <RotateCcw className="size-3.5" />
              Reset
            </button>
          </>
        }
      />

      <div className="mt-4">
        <DataTable<AdminPrinter>
          columns={[
            {
              key: 'device',
              header: 'Printer',
              render: (p) => <span className="ui-table-primary-strong">{p.name}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (p) => <span className={getPrinterStatusClass(p.status)}>{p.status}</span>,
            },
            {
              key: 'queue',
              header: 'Queue',
              render: (p) => <span className="ui-table-secondary">{p.queue}</span>,
            },
            {
              key: 'pending',
              header: 'Held jobs',
              render: (p) => <span className="ui-table-primary-strong">{p.pendingJobs}</span>,
            },
            {
              key: 'issue',
              header: 'Operational note',
              render: (p) => <span className="ui-table-secondary">{getPrinterOperationalIssue(p)}</span>,
            },
            {
              key: 'location',
              header: 'Location',
              render: (p) => <span className="ui-table-secondary">{p.location}</span>,
            },
          ]}
          rows={filteredPrinters}
          getRowKey={(p) => p.id}
          emptyLabel="No printers match the current search."
        />
      </div>
    </div>
  )
}
