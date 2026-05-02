import { DataTable } from '@/components/ui/data-table'
import type { TechDashboardPrinter } from '@/features/technician/dashboard/api'

interface TechPrinterHealthTableProps {
  printers: TechDashboardPrinter[]
  heldJobs: number
}

export function TechPrinterHealthTable({ printers, heldJobs }: TechPrinterHealthTableProps) {
  return (
    <section className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-ink-950">Printer health</h3>
        <span className="text-xs font-medium text-slate-500">{heldJobs} held jobs</span>
      </div>
      <DataTable<TechDashboardPrinter>
        columns={[
          {
            key: 'name',
            header: 'Printer',
            render: (printer) => <span className="ui-table-primary-strong">{printer.name}</span>,
          },
          {
            key: 'status',
            header: 'Status',
            render: (printer) => <span className={getPrinterStatusClass(printer.status)}>{printer.status}</span>,
          },
          {
            key: 'queue',
            header: 'Queue',
            render: (printer) => <span className="ui-table-secondary">{printer.queue}</span>,
          },
          {
            key: 'pending',
            header: 'Held jobs',
            render: (printer) => <span className="ui-table-primary-strong">{printer.pendingJobs}</span>,
          },
          {
            key: 'location',
            header: 'Location',
            render: (printer) => <span className="ui-table-secondary">{printer.location}</span>,
          },
        ]}
        rows={printers}
        getRowKey={(printer) => printer.id}
        emptyLabel="No printers."
      />
    </section>
  )
}

function getPrinterStatusClass(status: string) {
  return status === 'Online'
    ? 'text-sm text-accent-700'
    : status === 'Offline'
      ? 'text-sm text-danger-500'
      : 'text-sm text-warn-500'
}
