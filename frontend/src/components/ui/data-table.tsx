import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface Column<T> {
  key: string
  header: string
  className?: string
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  onRowClick?: (row: T) => void
  emptyLabel: string
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  emptyLabel,
}: DataTableProps<T>) {
  return (
    <div className="ui-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={cn('ui-table-head text-left', column.className)}>
                  {column.header}
                </th>
              ))}
              {onRowClick ? <th className="ui-table-head w-14 text-right">Open</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-10 text-center text-sm text-slate-500"
                  colSpan={columns.length + (onRowClick ? 1 : 0)}
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <motion.tr
                  key={getRowKey(row)}
                  layout
                  className={cn(
                    'border-b border-line/80 transition last:border-b-0',
                    onRowClick ? 'cursor-pointer hover:bg-accent-100/40' : '',
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={cn('ui-table-cell align-top', column.className)}>
                      {column.render(row)}
                    </td>
                  ))}
                  {onRowClick ? (
                    <td className="ui-table-cell text-right text-slate-400">
                      <ChevronRight className="ml-auto size-4" />
                    </td>
                  ) : null}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
