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
      <PageHeader eyebrow="Printers" title="Operational printer status" description="Read-only printer health, queue backlog, and release-impact visibility for technicians." />

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
              key: 'queue',
              header: 'Queue',
              render: (p) => <span className="ui-table-secondary">{p.queue}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (p) => (
                <span className={p.status === 'Online' ? 'text-sm text-accent-700' : p.status === 'Offline' ? 'text-sm text-danger-500' : 'text-sm text-warn-500'}>
                  {p.status}
                </span>
              ),
            },
            {
              key: 'issue',
              header: 'Operational note',
              render: (p) => (
                <span className="ui-table-secondary">
                  {p.status === 'Offline'
                    ? 'Release blocked until the device reconnects.'
                    : p.status === 'Maintenance'
                      ? 'Maintenance mode is active.'
                      : p.toner <= 20
                        ? 'Low toner warning.'
                        : 'No active device fault.'}
                </span>
              ),
            },
            {
              key: 'pending',
              header: 'Held jobs',
              render: (p) => <span className="ui-table-secondary">{p.pendingJobs}</span>,
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
