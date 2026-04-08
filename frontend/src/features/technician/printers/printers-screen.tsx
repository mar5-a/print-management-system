import { useDeferredValue, useMemo, useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { FilterBar } from '@/components/ui/filter-bar'
import { PageHeader } from '@/components/ui/page-header'
import { listTechPrinters } from './api'
import type { AdminPrinter } from '@/types/admin'

export function TechPrintersScreen() {
  const printers = listTechPrinters()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const filteredPrinters = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return printers.filter((printer) =>
      [printer.name, printer.model, printer.location, printer.status].some((v) =>
        v.toLowerCase().includes(query),
      ),
    )
  }, [printers, deferredSearch])

  return (
    <div className="min-w-0">
      <PageHeader eyebrow="Printers" title="Printer status" />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search printers"
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
              key: 'location',
              header: 'Location',
              render: (p) => <span className="ui-table-secondary">{p.location}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (p) => (
                <span
                  className={
                    p.status === 'Online'
                      ? 'text-sm text-accent-700'
                      : p.status === 'Offline'
                        ? 'text-sm text-danger-500'
                        : 'text-sm text-warn-500'
                  }
                >
                  {p.status}
                </span>
              ),
            },
            {
              key: 'toner',
              header: 'Toner',
              render: (p) => (
                <span className={p.toner <= 20 ? 'text-sm font-medium text-warn-500' : 'ui-table-secondary'}>
                  {p.toner}%
                </span>
              ),
            },
            {
              key: 'pending',
              header: 'Pending',
              render: (p) => <span className="ui-table-secondary">{p.pendingJobs}</span>,
            },
            {
              key: 'released',
              header: 'Released today',
              render: (p) => <span className="ui-table-secondary">{p.releasedToday}</span>,
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
