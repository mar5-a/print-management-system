import type { AdminPrinter } from '@/types/admin'
import { DataTable } from '../ui/data-table'
import { getPrinterStatusClass } from './printer-format'

interface PrintersTableProps {
  rows: AdminPrinter[]
  onRowClick?: (printer: AdminPrinter) => void
}

export function PrintersTable({ rows, onRowClick }: PrintersTableProps) {
  return (
    <DataTable<AdminPrinter>
      columns={[
        {
          key: 'printer',
          header: 'Printer',
          render: (printer) => <span className="ui-table-primary-strong">{printer.name}</span>,
        },
        {
          key: 'status',
          header: 'Status',
          render: (printer) => (
            <span className={getPrinterStatusClass(printer.status)}>{printer.status}</span>
          ),
        },
        {
          key: 'total-pages',
          header: 'Total pages',
          render: (printer) => (
            <span className="ui-table-secondary">{printer.totalPages.toLocaleString()}</span>
          ),
        },
        {
          key: 'total-jobs',
          header: 'Total jobs',
          render: (printer) => (
            <span className="ui-table-secondary">{printer.totalJobs.toLocaleString()}</span>
          ),
        },
      ]}
      rows={rows}
      getRowKey={(printer) => printer.id}
      onRowClick={onRowClick}
      emptyLabel="No printers match the current filters."
    />
  )
}
